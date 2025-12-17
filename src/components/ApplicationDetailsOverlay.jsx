import React, { useState } from 'react';
import supabase from '../supabase'; // Ensure this is configured properly
import { db } from '../firebase'; // Firebase Firestore instance
import { collection, addDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import '../styles/ApplicationDetailsOverlay.css';

const ApplicationDetailsOverlay = ({ application, onClose, onAccept }) => {
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [deliveryAreasCollapsed, setDeliveryAreasCollapsed] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  const getPhotoUrl = (key) => {
    const url = application.photoURLs?.[key];
    if (!url) return null;
    const baseUrl = `${supabase.supabaseUrl}/storage/v1/object/public/applications/`;
    if (url.startsWith('http')) return url;
    return baseUrl + url;
  };

  const getRelativePath = (fullUrl) => {
    if (!fullUrl || !fullUrl.includes('/applications/')) return null;
    return fullUrl.split('/applications/')[1];
  };

  const convertTo12Hour = (time24) => {
    if (!time24) return '';
    const [hourStr, minute] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const handleImageClick = (url, alt) => setEnlargedImage({ url, alt });
  const closeEnlargedImage = () => setEnlargedImage(null);
  const toggleDeliveryAreas = () => setDeliveryAreasCollapsed(!deliveryAreasCollapsed);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      // Prepare restaurant data from application fields
      const restaurantData = {
        ownerId: application.uploaderId,
        name: application.restaurantName || 'Unnamed Restaurant',
        phone: application.phone || '',
        averageIncome: application.averageIncome ? parseFloat(application.averageIncome) : 0,
        address: application.address || {},
        businessHours: application.businessHours || {},
        deliveryAreas: application.deliveryAreas || [],
        createdAt: new Date(),
      };

      // Add new restaurant doc in Firestore root 'restaurants' collection
      const restaurantRef = await addDoc(collection(db, 'restaurants'), restaurantData);
      const restaurant = { id: restaurantRef.id, ...restaurantData };

      // Move photos from 'applications' storage bucket to 'restaurants' bucket in Supabase
      const photoKeys = ['coverURL', 'selfieURL', 'validIdURL', 'selfieWithValidIdURL', 'displayURL'];
      const newPhotoURLs = {};

      for (const key of photoKeys) {
        const fullUrl = application.photoURLs?.[key];
        const oldPath = getRelativePath(fullUrl);
        if (oldPath) {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('applications')
            .download(oldPath);

          if (downloadError) {
            console.error(`Failed to download ${key}:`, downloadError);
            continue;
          }

          const newPath = `${restaurant.id}/${key}`;
          const { error: uploadError } = await supabase.storage
            .from('restaurants')
            .upload(newPath, fileData);

          if (uploadError) {
            console.error(`Failed to upload ${key}:`, uploadError);
            continue;
          }

          const { data: publicUrl } = supabase.storage
            .from('restaurants')
            .getPublicUrl(newPath);

          newPhotoURLs[key] = publicUrl.publicUrl;
        }
      }

      // Handle any additional files
      const additionalPhotoURLs = [];
      if (application.additionalFileURLs) {
        for (let i = 0; i < application.additionalFileURLs.length; i++) {
          const fullUrl = application.additionalFileURLs[i];
          const oldPath = getRelativePath(fullUrl);
          if (oldPath) {
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('applications')
              .download(oldPath);

            if (downloadError) {
              console.error(`Failed to download additional file ${i}:`, downloadError);
              continue;
            }

            const newPath = `${restaurant.id}/proof${i}`;
            const { error: uploadError } = await supabase.storage
              .from('restaurants')
              .upload(newPath, fileData);

            if (uploadError) {
              console.error(`Failed to upload additional file ${i}:`, uploadError);
              continue;
            }

            const { data: publicUrl } = supabase.storage
              .from('restaurants')
              .getPublicUrl(newPath);

            additionalPhotoURLs.push(publicUrl.publicUrl);
          }
        }
      }

      // Update restaurant document with new photo URLs and additional files
      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        photoURLs: newPhotoURLs,
        additionalFileURLs: additionalPhotoURLs,
      });

      // Reference application document in root applications collection
      const appRef = doc(db, 'applications', application.id);
      const appSnap = await getDoc(appRef);

      if (appSnap.exists()) {
        await updateDoc(appRef, { status: 'approved' });
      } else {
        // If application document does not exist, create it safely without overwriting
        await setDoc(appRef, { status: 'approved' }, { merge: true });
      }

      // Update user roles, restaurantId, and applicationActive flag
      const userRef = doc(db, 'users', application.uploaderId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error(`User document with ID ${application.uploaderId} does not exist.`);
      }

      const userData = userSnap.data();
      const existingRoles = userData.roles || {};

      await updateDoc(userRef, {
        fullName: application.fullName || '',
        sex: application.sex || '',
        age: application.age || '',
        civilStatus: application.civilStatus || '',
        birthdate: application.birthdate || '',
        nationality: application.nationality || '',
        occupation: application.occupation || '',
        roles: {
          ...existingRoles,
          user: true,
          business: true,  // Ensure business role added if missing
        },
        restaurantId: restaurant.id,
        applicationActive: false,  // Set applicationActive to false
      });

      if (onAccept) onAccept(restaurant);
      onClose();
    } catch (error) {
      console.error('Error accepting application:', error);
      alert(`Failed to accept application: ${error.message}`);
    } finally {
      setIsAccepting(false);
    }
  };

  if (!application) return null;

  const allPhotos = [
    { key: 'selfieURL', label: 'Selfie', url: getPhotoUrl('selfieURL') },
    { key: 'validIdURL', label: 'Valid ID', url: getPhotoUrl('validIdURL') },
    { key: 'selfieWithValidIdURL', label: 'Selfie with Valid ID', url: getPhotoUrl('selfieWithValidIdURL') },
    { key: 'displayURL', label: 'Restaurant Display Photo', url: getPhotoUrl('displayURL') },
    ...(application.additionalFileURLs || []).map((url, index) => ({ key: `proof${index}`, label: `Proof ${index + 1}`, url })),
  ].filter((photo) => photo.url);

  const coverUrl = getPhotoUrl('coverURL');

  return (
    <>
      <div className="business-application-overlay" onClick={onClose}>
        <div
          className="business-application-content"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="application-details-title"
          tabIndex={-1}
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
        >
          {coverUrl && (
            <div className="profile-banner">
              <img
                src={coverUrl}
                alt="Restaurant Cover"
                onClick={() => handleImageClick(coverUrl, 'Restaurant Cover')}
                style={{ cursor: 'pointer' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          <div className="profile-section">
            {getPhotoUrl('displayURL') && (
              <div className="profile-pic">
                <img
                  src={getPhotoUrl('displayURL')}
                  alt="Restaurant Display"
                  onClick={() => handleImageClick(getPhotoUrl('displayURL'), 'Restaurant Display')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            )}
            <div className="profile-info">
              <h2>{application.restaurantName || 'N/A'}</h2>
              <p><strong>Phone:</strong> {application.phone || 'N/A'}</p>
              <p><strong>Average Income (Monthly):</strong> {application.averageIncome ? `₱${application.averageIncome}` : 'N/A'}</p>
            </div>
          </div>

          <div className="infos-section">
            <div className="info-column">
              <h3>Application Information</h3>
              <p><strong>Application ID:</strong> {application.id}</p>
              <p><strong>Status:</strong> {application.status || 'N/A'}</p>
              <p>
                <strong>Submitted At:</strong>{' '}
                {application.submittedAt
                  ? application.submittedAt.toDate
                    ? application.submittedAt.toDate().toLocaleString()
                    : new Date(application.submittedAt).toLocaleString()
                  : 'N/A'}
              </p>
              <p><strong>Uploader ID:</strong> {application.uploaderId}</p>

              <h3>Business Location</h3>
              {application.address ? (
                <>
                  <p><strong>Street:</strong> {application.address.street}</p>
                  <p><strong>Barangay:</strong> {application.address.barangay}</p>
                  <p><strong>City:</strong> {application.address.city}</p>
                  <p><strong>Province:</strong> {application.address.province}</p>
                  <p><strong>Region:</strong> {application.address.region}</p>
                </>
              ) : (
                <p>No address information available.</p>
              )}
            </div>

            <div className="info-column">
              <h3>Owner Details</h3>
              <p><strong>Full Name:</strong> {application.fullName || 'N/A'}</p>
              <p><strong>Sex:</strong> {application.sex || 'N/A'}</p>
              <p><strong>Age:</strong> {application.age || 'N/A'}</p>
              <p><strong>Civil Status:</strong> {application.civilStatus || 'N/A'}</p>
              <p><strong>Birthdate:</strong> {application.birthdate || 'N/A'}</p>
              <p><strong>Nationality:</strong> {application.nationality || 'N/A'}</p>
              <p><strong>Occupation:</strong> {application.occupation || 'N/A'}</p>

              <h3>Business Hours</h3>
              {application.businessHours ? (
                <div className="business-hours-container">
                  {daysOfWeek.map(({ key, label }) => {
                    const day = application.businessHours[key];
                    return day ? (
                      <div key={key} className="business-hour-row">
                        <span className="day-label">{label}:</span>
                        {day.enabled ? (
                          <span>{convertTo12Hour(day.open)} - {convertTo12Hour(day.close)}</span>
                        ) : (
                          <span className="closed-label">Closed</span>
                        )}
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <p>No business hours available.</p>
              )}

              <h3 onClick={toggleDeliveryAreas} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                Delivery Areas
                <span style={{ marginLeft: '10px', transform: deliveryAreasCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }}>
                  ▼
                </span>
              </h3>
              {!deliveryAreasCollapsed && (
                <div style={{ marginTop: '10px' }}>
                  {application.deliveryAreas && application.deliveryAreas.length > 0 ? (
                    <ul>
                      {application.deliveryAreas.map((area, index) => (
                        <li key={index}>{area}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No delivery areas specified.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="photos-section">
            <h3>Photos</h3>
            {allPhotos.length > 0 ? (
              <div className="photos-cluster">
                {allPhotos.map((photo) => (
                  <div key={photo.key} className="photo-item">
                    <img
                      src={photo.url}
                      alt={photo.label}
                      onClick={() => handleImageClick(photo.url, photo.label)}
                      style={{ cursor: 'pointer' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className="photo-label">{photo.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No photos available.</p>
            )}
          </div>

          <div className="ba-navigation">
            {application.status === 'pending' && (
              <button type="button" className="btn-accept" onClick={handleAccept} disabled={isAccepting}>
                {isAccepting ? 'Accepting...' : 'Accept'}
              </button>
            )}
            <button type="button" className="btn-close" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {enlargedImage && (
        <div className="enlarged-image-overlay" onClick={closeEnlargedImage}>
          <div className="enlarged-image-content" onClick={(e) => e.stopPropagation()}>
            <img src={enlargedImage.url} alt={enlargedImage.alt} />
            <button className="close-enlarged-btn" onClick={closeEnlargedImage}>×</button>
          </div>
        </div>
      )}
    </>
  );
};

export default ApplicationDetailsOverlay;

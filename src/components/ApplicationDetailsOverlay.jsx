import React, { useState } from 'react';
import supabase from '../supabase'; // Ensure this is configured
import { db } from '../firebase'; // Import Firebase db
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import '../styles/ApplicationDetailsOverlay.css';

const ApplicationDetailsOverlay = ({ application, onClose, onAccept }) => {
    const [enlargedImage, setEnlargedImage] = useState(null); // For enlarged image modal
    const [deliveryAreasCollapsed, setDeliveryAreasCollapsed] = useState(true); // State for collapsible delivery areas
    const [isAccepting, setIsAccepting] = useState(false); // State for loading during accept

    // Helper to get the correct URL (assuming public bucket)
    const getPhotoUrl = (key) => {
        const url = application.photoURLs?.[key];
        console.log(`getPhotoUrl for ${key}:`, url); // Debug log
        if (!url) return null;
        const baseUrl = `${supabase.supabaseUrl}/storage/v1/object/public/applications/`;
        console.log('Base URL:', baseUrl); // Debug log
        if (url.startsWith('http')) return url; // Already full URL
        return baseUrl + url; // Assume it's a relative path
    };

    // Helper to extract relative path from full Supabase URL
    const getRelativePath = (fullUrl) => {
        if (!fullUrl || !fullUrl.includes('/applications/')) return null;
        return fullUrl.split('/applications/')[1];
    };

    // Helper for 12-hour time conversion
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

    // Handle image click for enlargement
    const handleImageClick = (url, alt) => {
        setEnlargedImage({ url, alt });
    };

    // Close enlarged image
    const closeEnlargedImage = () => {
        setEnlargedImage(null);
    };

    // Toggle delivery areas collapse
    const toggleDeliveryAreas = () => {
        setDeliveryAreasCollapsed(!deliveryAreasCollapsed);
    };

    // Handle Accept button click
    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            // Prepare restaurant data from application, flattened to match reference style
            const restaurantData = {
                ownerId: application.uploaderId,
                name: application.restaurantName || 'Unnamed Restaurant',
                phone: application.phone || '',
                averageIncome: application.averageIncome ? parseFloat(application.averageIncome) : 0,
                address: application.address || {},
                fullName: application.fullName || '',
                sex: application.sex || '',
                age: application.age || '',
                civilStatus: application.civilStatus || '',
                birthdate: application.birthdate || '',
                nationality: application.nationality || '',
                occupation: application.occupation || '',
                businessHours: application.businessHours || {},
                deliveryAreas: application.deliveryAreas || [],
                status: 'active',
                createdAt: new Date(),
            };

            // Add to Firebase Firestore 'restaurants' collection
            const restaurantRef = await addDoc(collection(db, 'restaurants'), restaurantData);
            const restaurant = { id: restaurantRef.id, ...restaurantData };

            // Move photos from applications to restaurants bucket
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

            // Declare additionalPhotoURLs before the loop
            const additionalPhotoURLs = [];

            // Handle additional files if any
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

            // Update restaurant with new photo URLs in Firestore
            await updateDoc(doc(db, 'restaurants', restaurant.id), {
                photoURLs: newPhotoURLs,
                additionalFileURLs: additionalPhotoURLs,
            });

            // Update application status to 'accepted' in Firestore (with existence check)
            try {
                const appDocRef = doc(db, 'applications', application.id);
                const appDocSnap = await getDoc(appDocRef);
                if (appDocSnap.exists()) {
                    await updateDoc(appDocRef, { status: 'accepted' });
                } else {
                    console.warn('Application document does not exist, skipping status update.');
                }
            } catch (appError) {
                console.error('Failed to update application status:', appError);
            }

            // Update user document with roles and restaurantId
            try {
                const userRef = doc(db, 'users', application.uploaderId);
                await updateDoc(userRef, {
                    roles: {
                        user: true,
                        business: true,
                    },
                    restaurantId: restaurant.id,
                });
            } catch (userError) {
                console.error('Failed to update user document:', userError);
                // Continue if user update fails
            }

            // Call onAccept callback if provided
            if (onAccept) onAccept(restaurant);

            // Close the overlay
            onClose();
        } catch (error) {
            console.error('Error accepting application:', error);
            alert('Failed to accept application. Please try again.');
        } finally {
            setIsAccepting(false);
        }
    };

    if (!application) return null;

    console.log('Application object:', application); // Debug log for entire application
    console.log('Photo URLs:', application.photoURLs); // Debug log for photoURLs

    // Collect all photos for bottom section (excluding cover, as it's at the top)
    const allPhotos = [
        { key: 'selfieURL', label: 'Selfie', url: getPhotoUrl('selfieURL') },
        { key: 'validIdURL', label: 'Valid ID', url: getPhotoUrl('validIdURL') },
        { key: 'selfieWithValidIdURL', label: 'Selfie with Valid ID', url: getPhotoUrl('selfieWithValidIdURL') },
        { key: 'displayURL', label: 'Restaurant Display Photo', url: getPhotoUrl('displayURL') },
        // Removed coverURL as it's displayed at the top
        ...(application.additionalFileURLs || []).map((url, index) => ({ key: `proof${index}`, label: `Proof ${index + 1}`, url })),
    ].filter(photo => photo.url);

    const coverUrl = getPhotoUrl('coverURL');
    console.log('Cover URL:', coverUrl); // Debug log for cover URL

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
                    {/* Cover photo as banner at the top of the content */}
                    {coverUrl && (
                        <div className="profile-banner">
                            <img
                                src={coverUrl}
                                alt="Restaurant Cover"
                                onClick={() => handleImageClick(coverUrl, 'Restaurant Cover')}
                                style={{ cursor: 'pointer' }}
                                onError={(e) => {
                                    console.error('Cover image failed to load:', coverUrl);
                                    e.target.style.display = 'none';
                                    // Optionally, show a fallback message or image
                                }}
                                onLoad={() => console.log('Cover image loaded successfully:', coverUrl)} // Debug log
                            />
                        </div>
                    )}

                    {/* Profile Section */}
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

                    {/* Infos Section */}
                    <div className="infos-section">
                        <div className="info-column">
                            <h3>Application Information</h3>
                            <p><strong>Application ID:</strong> {application.id}</p>
                            <p><strong>Status:</strong> {application.status || 'N/A'}</p>
                            <p><strong>Submitted At:</strong> {application.submittedAt ? application.submittedAt.toDate ? application.submittedAt.toDate().toLocaleString() : new Date(application.submittedAt).toLocaleString() : 'N/A'}</p>
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
                                <span style={{ marginLeft: '10px', transform: deliveryAreasCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }}>▼</span>
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

                    {/* Photos Section at the bottom */}
                    <div className="photos-section">
                        <h3>Photos</h3>
                        {allPhotos.length > 0 ? (
                            <div className="photos-cluster">
                                {allPhotos.map((photo, index) => (
                                    <div key={photo.key} className="photo-item">
                                        <img
                                            src={photo.url}
                                            alt={photo.label}
                                            onClick={() => handleImageClick(photo.url, photo.label)}
                                            style={{ cursor: 'pointer' }}
                                            onError={(e) => {
                                                console.error(`Failed to load ${photo.label}:`, photo.url);
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <p style={{ display: 'none', color: 'red' }}>Image failed to load</p>
                                        <span className="photo-label">{photo.label}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No photos available.</p>
                        )}
                    </div>

                    {/* Close Button */}
                    <div className="ba-navigation">
                        <button
                            type="button"
                            className="btn-accept"
                            onClick={handleAccept}
                            disabled={isAccepting}
                        >
                            {isAccepting ? 'Accepting...' : 'Accept'}
                        </button>
                        <button type="button" className="btn-close" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Enlarged Image Modal */}
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

import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/performance-page.css'; // Adjust or rename as needed
import ApplicationDetailsOverlay from './ApplicationDetailsOverlay';

const statusColors = {
  pending: '#ffc107',    // Amber
  approved: '#28a745',   // Green
  denied: '#dc3545',     // Red
  rejected: '#dc3545',   // Red, if you have rejected status
  // Add other statuses/colors as needed
};

const PerformancePage = () => {
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchApplications();
      } else {
        setError('User not authenticated');
        setLoading(false);
        setApplications([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch all applications with orderBy submittedAt descending
  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      // Order by submittedAt descending (newest first)
      const applicationsQuery = query(
        collection(db, 'applications'),
        orderBy('submittedAt', 'desc')
      );
      const applicationsSnap = await getDocs(applicationsQuery);

      const apps = applicationsSnap.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data()
      }));

      setApplications(apps);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update application status (optional for your usage)
  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const applicationRef = doc(db, 'applications', applicationId);
      await updateDoc(applicationRef, { status: newStatus });
      fetchApplications();
    } catch (error) {
      console.error('Failed to update application status:', error);
      setError(error.message);
    }
  };

  if (loading) return <div className="main-content">Loading applications...</div>;
  if (error) return <div className="main-content">Error: {error}</div>;

  return (
    <div className="applications-page" style={{ fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#f9f9f9' }}>
      <h1>Applications</h1>

      {applications.length === 0 && <p>No applications found.</p>}

      <div className="applications-list" style={{ marginTop: '20px' }}>
        {applications.map(application => {
          const status = application.status ? application.status.toLowerCase() : 'pending';
          const statusColor = statusColors[status] || '#6c757d'; // default gray if unknown status
          
          return (
            <div
              key={application.id}
              className="application-card"
              style={{
                backgroundColor: 'white',
                padding: '15px',
                marginBottom: '15px',
                borderRadius: '8px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                borderLeft: `6px solid ${statusColor}`, // Highlight border strip by status color
              }}
            >
              <p><strong>Application ID (Document Name):</strong> {application.id}</p>
              <p><strong>Uploader ID:</strong> {application.uploaderId}</p>
              <p>
                <strong>Submitted At:</strong>{' '}
                {application.submittedAt
                  ? application.submittedAt.toDate
                    ? application.submittedAt.toDate().toLocaleString()
                    : new Date(application.submittedAt).toLocaleString()
                  : 'N/A'}
              </p>
              {application.status && (
                <p>
                  <strong>Status:</strong>{' '}
                  <span style={{ color: statusColor, fontWeight: 'bold' }}>
                    {application.status}
                  </span>
                </p>
              )}
              {application.restaurantName && <p><strong>Restaurant Name:</strong> {application.restaurantName}</p>}
              {application.address && (
                <p>
                  <strong>Location:</strong>{' '}
                  {`${application.address.street}, ${application.address.barangay}, ${application.address.city}, ${application.address.province}`}
                </p>
              )}

              <button
                style={{
                  padding: '8px 15px',
                  marginTop: '10px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
                onClick={() => setSelectedApplication(application)}
              >
                View Details
              </button>

              {/* Uncomment these buttons if you want to enable status update */}
              {/* 
              <button
                style={{
                  padding: '8px 15px',
                  marginTop: '10px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
                onClick={() => updateApplicationStatus(application.id, 'approved')}
              >
                Approve
              </button>
              <button
                style={{
                  padding: '8px 15px',
                  marginTop: '10px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
                onClick={() => updateApplicationStatus(application.id, 'denied')}
              >
                Deny
              </button> 
              */}

              {application.status !== 'pending' && (
                <p style={{ fontStyle: 'italic', marginTop: '10px' }}>
                  This application has been <strong>{application.status}</strong>.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {selectedApplication && (
        <ApplicationDetailsOverlay
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
        />
      )}
    </div>
  );
};

export default PerformancePage;

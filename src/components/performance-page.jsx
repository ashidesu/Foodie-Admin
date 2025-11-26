import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/performance-page.css'; // You may want to rename this css or keep for reuse


const PerformancePage = () => {
    const [user, setUser] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Listen for auth state changes
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchApplications();
            } else {
                setError('User not authenticated');
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Fetch all applications from Firestore
    const fetchApplications = async () => {
        setLoading(true);
        setError(null);
        try {
            const applicationsQuery = query(collection(db, 'applications'));
            const applicationsSnap = await getDocs(applicationsQuery);
            
            // Map over documents
            const apps = applicationsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setApplications(apps);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Approve an application: update roles in users, create restaurant doc, update user's restaurantId, update app status
    const approveApplication = async (application) => {
        setLoading(true);
        try {
            const userRef = doc(db, 'users', application.userId);
            const userDocSnap = await getDoc(userRef);

            if (!userDocSnap.exists()) {
                setError('User document not found');
                setLoading(false);
                return;
            }

            const userData = userDocSnap.data();

            // Create restaurant doc in restaurants collection
            const newRestaurantData = {
                ownerId: application.userId,
                // You may want to include further data from the application if available
                name: application.restaurantName || 'Unnamed Restaurant',
                location: application.location || '',
                deliveryAreas: application.deliveryAreas || [],
                openHours: application.openHours || {},
                photoUrl: application.photoUrl || '',
                createdAt: new Date(),
            };
            const restaurantRef = await addDoc(collection(db, 'restaurants'), newRestaurantData);

            // Update user document roles map and restaurantId 
            await updateDoc(userRef, {
                roles: {
                    ...userData.roles,
                    user: true,
                    business: true,
                },
                restaurantId: restaurantRef.id,
            });

            // Update application status to 'approved'
            const appRef = doc(db, 'applications', application.id);
            await updateDoc(appRef, { status: 'approved' });

            // Also, add restaurantId to newRestaurantData for immediate use if required
            // Reload applications to refresh statuses
            await fetchApplications();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Deny an application: update status to 'denied'
    const denyApplication = async (application) => {
        setLoading(true);
        try {
            const appRef = doc(db, 'applications', application.id);
            await updateDoc(appRef, { status: 'denied' });
            await fetchApplications();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="main-content">Loading applications...</div>;
    if (error) return <div className="main-content">Error: {error}</div>;

    return (
        <div className="applications-page" style={{ fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#f9f9f9' }}>
            <h1>Applications</h1>

            {applications.length === 0 && (
                <p>No applications found.</p>
            )}

            <div className="applications-list" style={{ marginTop: '20px' }}>
                {applications.map(application => (
                    <div key={application.id} className="application-card" style={{
                        backgroundColor: 'white', padding: '15px', marginBottom: '15px',
                        borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                    }}>
                        <p><strong>Application ID:</strong> {application.id}</p>
                        <p><strong>User ID:</strong> {application.userId}</p>
                        <p><strong>Submitted At:</strong> {application.submittedAt ? application.submittedAt.toDate ? application.submittedAt.toDate().toLocaleString() : new Date(application.submittedAt).toLocaleString() : 'N/A'}</p>
                        {application.status && <p><strong>Status:</strong> {application.status}</p>}
                        {/* Optional display fields from app */}
                        {application.restaurantName && <p><strong>Restaurant Name:</strong> {application.restaurantName}</p>}
                        {application.location && <p><strong>Location:</strong> {application.location}</p>}

                        {application.status === 'pending' && (
                            <div style={{ marginTop: '10px' }}>
                                <button
                                    style={{
                                        padding: '8px 15px',
                                        marginRight: '10px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => approveApplication(application)}
                                >
                                    Approve
                                </button>
                                <button
                                    style={{
                                        padding: '8px 15px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => denyApplication(application)}
                                >
                                    Deny
                                </button>
                            </div>
                        )}

                        {application.status !== 'pending' && (
                            <p style={{ fontStyle: 'italic', marginTop: '10px' }}>
                                This application has been <strong>{application.status}</strong>.
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PerformancePage;
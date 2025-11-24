import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Assuming you're using React Router for navigation
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Assuming Firebase is configured
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/home-page.css'; // You'll need to create this CSS file for styling

const HomePage = () => {
    const [user, setUser] = useState(null);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Listen for authentication state changes and fetch data
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchData(currentUser);
            } else {
                setError('User not authenticated');
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Function to fetch completed orders for revenue chart and pending orders for list
    const fetchData = async (currentUser) => {
        setLoading(true);
        setError(null);
        try {
            // Fetch user document to get restaurantId
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (!userDocSnap.exists()) {
                setError('User document not found');
                setLoading(false);
                return;
            }
            
            const userData = userDocSnap.data();
            const restaurantId = userData.restaurantId;
            
            if (!restaurantId) {
                setError('Restaurant ID not found in user document');
                setLoading(false);
                return;
            }

            // Fetch completed orders for revenue chart (using 'this month' as default)
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // This month
            const completedQuery = query(
                collection(db, 'orders'), 
                where('restaurantId', '==', restaurantId), 
                where('status', '==', 'completed')
            );
            const completedSnap = await getDocs(completedQuery);
            const completedList = completedSnap.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(order => {
                    if (!order.createdAt) return false;
                    const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                    return orderDate >= startDate && orderDate <= now;
                });
            setCompletedOrders(completedList);

            // Fetch pending orders for the list
            const pendingQuery = query(
                collection(db, 'orders'), 
                where('restaurantId', '==', restaurantId), 
                where('status', '==', 'pending')
            );
            const pendingSnap = await getDocs(pendingQuery);
            const pendingList = pendingSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                time: formatTimeAgo(doc.data().createdAt)
            }));
            setPendingOrders(pendingList.slice(0, 5)); // Limit to top 5 pending orders
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format time ago (from OrderPage)
    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const now = new Date();
        const createdAt = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diffInMinutes = Math.floor((now - createdAt) / (1000 * 60));
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    };

    // Prepare data for revenue over time chart (from PerformancePage)
    const revenueByDate = {};
    completedOrders.forEach(order => {
        if (order.createdAt) {
            const date = order.createdAt.toDate ? order.createdAt.toDate().toDateString() : new Date(order.createdAt).toDateString();
            revenueByDate[date] = (revenueByDate[date] || 0) + parseFloat(order.totalPrice || 0);
        }
    });
    const chartData = Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue }));

    if (loading) return <div className="home-page">Loading dashboard...</div>;
    if (error) return <div className="home-page">Error: {error}</div>;

    return (
        <div className="home-page">
            <h1>Welcome to the Restaurant Admin Dashboard</h1>
            <p>Manage your restaurant operations efficiently with our comprehensive tools.</p>

            {/* Overall Performance Graph */}
            <div className="performance-section">
                <h2>Revenue Over Time (This Month)</h2>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Pending Orders List */}
            <div className="pending-orders-section">
                <h2>Pending Orders</h2>
                {pendingOrders.length === 0 ? (
                    <p>No pending orders.</p>
                ) : (
                    <ul className="pending-orders-list">
                        {pendingOrders.map(order => (
                            <li key={order.id} className="pending-order-item yellow-highlight">
                                <div className="order-id">Order {order.id}</div>
                                <div className="order-time">{order.time}</div>
                                <div className="order-total">${parseFloat(order.totalPrice).toFixed(2)}</div>
                            </li>
                        ))}
                    </ul>
                )}
                <Link to="/orders" className="btn-secondary">View All Orders</Link>
            </div>

            <div className="overview-sections">
                <div className="section-card">
                    <h2>Order Management</h2>
                    <p>
                        Handle incoming orders with ease. View orders by status (New, Preparing, Ready for Pickup, Out for Delivery, Completed), 
                        accept or reject new orders, update statuses, and track customer details. This page integrates with Firebase to fetch 
                        orders based on your restaurant ID and provides real-time updates.
                    </p>
                    <Link to="/orders" className="btn-primary">Go to Orders</Link>
                </div>

                <div className="section-card">
                    <h2>Performance Analytics</h2>
                    <p>
                        Analyze your restaurant's performance with detailed metrics including total revenue, order counts, average order value, 
                        and revenue trends over time. Track individual dish performance, view top-performing dishes by revenue, and see which 
                        dishes are frequently ordered together. Filter data by date ranges and visualize with interactive charts using Recharts.
                    </p>
                    <Link to="/performance" className="btn-primary">Go to Performance</Link>
                </div>

                <div className="section-card">
                    <h2>Menu Management</h2>
                    <p>
                        Manage your menu by adding, editing, or deleting dishes. View a gallery of dishes with images stored in Supabase, 
                        filter by category or status, and search for specific items. Each dish displays details like name, price, description, 
                        and associated restaurant. Use the overlay to add new dishes seamlessly.
                    </p>
                    <Link to="/menu" className="btn-primary">Go to Menu</Link>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
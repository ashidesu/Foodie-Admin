import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/performance-page.css';

const PerformancePage = () => {
    const [user, setUser] = useState(null);
    const [dishes, setDishes] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [selectedDishes, setSelectedDishes] = useState([]); // Array for multiple selected dishes
    const [dateRange, setDateRange] = useState('this month');
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

    // Function to fetch dishes and completed orders
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

            // Fetch dishes for the restaurant
            const dishesQuery = query(collection(db, 'dishes'), where('restaurantId', '==', restaurantId));
            const dishesSnap = await getDocs(dishesQuery);
            const dishesList = dishesSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDishes(dishesList);

            // Fetch completed orders for the restaurant
            const ordersQuery = query(collection(db, 'orders'), where('restaurantId', '==', restaurantId), where('status', '==', 'completed'));
            const ordersSnap = await getDocs(ordersQuery);
            const ordersList = ordersSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCompletedOrders(ordersList);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get date range
    const getDateRange = (range) => {
        const now = new Date();
        let startDate;
        switch (range) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'yesterday':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                break;
            case 'this week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
                break;
            case 'this month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'this year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(0);
        }
        return { startDate, endDate: now };
    };

    // Filter orders by date range
    const { startDate, endDate } = getDateRange(dateRange);
    const filteredOrders = completedOrders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
    });

    // Calculate overall performance metrics
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.totalPrice || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Prepare data for revenue over time chart
    const revenueByDate = {};
    filteredOrders.forEach(order => {
        if (order.createdAt) {
            const date = order.createdAt.toDate ? order.createdAt.toDate().toDateString() : new Date(order.createdAt).toDateString();
            revenueByDate[date] = (revenueByDate[date] || 0) + parseFloat(order.totalPrice || 0);
        }
    });
    const overallChartData = Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue }));

    // Prepare data for individual dish performance line chart
    const dishPerformanceByDate = {};
    filteredOrders.forEach(order => {
        if (order.createdAt) {
            const date = order.createdAt.toDate ? order.createdAt.toDate().toDateString() : new Date(order.createdAt).toDateString();
            if (!dishPerformanceByDate[date]) {
                dishPerformanceByDate[date] = {};
            }
            order.items.forEach(item => {
                const dishName = item.name;
                dishPerformanceByDate[date][dishName] = (dishPerformanceByDate[date][dishName] || 0) + (item.quantity || 1);
            });
        }
    });
    const dishChartData = Object.entries(dishPerformanceByDate).map(([date, dishes]) => ({ date, ...dishes }));

    // Handle checkbox changes for selected dishes
    const handleDishSelection = (dishName) => {
        setSelectedDishes(prev => 
            prev.includes(dishName) 
                ? prev.filter(d => d !== dishName) 
                : [...prev, dishName]
        );
    };

    // Calculate top performing dishes (by revenue)
    const dishStats = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            const dishName = item.name;
            if (!dishStats[dishName]) {
                dishStats[dishName] = { count: 0, revenue: 0 };
            }
            dishStats[dishName].count += item.quantity || 1;
            dishStats[dishName].revenue += (item.quantity || 1) * parseFloat(item.price);
        });
    });
    const topPerformingDishes = Object.entries(dishStats)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10);

    // Calculate most frequently ordered together dishes
    const pairStats = {};
    filteredOrders.forEach(order => {
        const items = order.items.map(item => item.name);
        for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
                const pair = [items[i], items[j]].sort().join(' & ');
                pairStats[pair] = (pairStats[pair] || 0) + 1;
            }
        }
    });
    const topPairs = Object.entries(pairStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    if (loading) return <div className="main-content">Loading performance data...</div>;
    if (error) return <div className="main-content">Error: {error}</div>;

    return (
        <div className="performance-page">
            <h1>Restaurant Performance</h1>

            {/* Date Range Filter */}
            <div className="filters">
                <label htmlFor="date-range">Date Range:</label>
                <select id="date-range" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="this week">This Week</option>
                    <option value="this month">This Month</option>
                    <option value="this year">This Year</option>
                </select>
            </div>

            <div className="overall-performance">
                <h2>Overall Performance</h2>
                <div className="stats">
                    <div className="stat-item">Total Revenue: ${totalRevenue.toFixed(2)}</div>
                    <div className="stat-item">Total Completed Orders: {totalOrders}</div>
                    <div className="stat-item">Average Order Value: ${avgOrderValue.toFixed(2)}</div>
                </div>
                <div className="chart-container">
                    <h3>Revenue Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={overallChartData}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="individual-performance">
                <h2>Individual Dish Performance</h2>
                <div className="dish-selector">
                    <label>Select Dishes:</label>
                    <div className="checkbox-group">
                        {dishes.map(dish => (
                            <label key={dish.id} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={selectedDishes.includes(dish.name)}
                                    onChange={() => handleDishSelection(dish.name)}
                                />
                                {dish.name}
                            </label>
                        ))}
                    </div>
                </div>
                <div className="chart-container">
                    <h3>Orders Over Time for Selected Dishes</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dishChartData}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            {selectedDishes.map((dish, index) => (
                                <Line 
                                    key={dish} 
                                    type="monotone" 
                                    dataKey={dish} 
                                    stroke={`hsl(${index * 137.5 % 360}, 70%, 50%)`} // Different colors
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="leaderboards">
                <div className="leaderboard">
                    <h2>Top Performing Dishes (by Revenue)</h2>
                    <ol className="leaderboard-list">
                        {topPerformingDishes.map(([name, stats], index) => (
                            <li key={name} className="leaderboard-item">
                                <span className="rank">{index + 1}.</span>
                                <span className="name">{name}</span>
                                <span className="value">${stats.revenue.toFixed(2)}</span>
                            </li>
                        ))}
                    </ol>
                </div>
                <div className="leaderboard">
                    <h2>Most Frequently Ordered Together</h2>
                    <ol className="leaderboard-list">
                        {topPairs.map(([pair, count], index) => (
                            <li key={pair} className="leaderboard-item">
                                <span className="rank">{index + 1}.</span>
                                <span className="name">{pair}</span>
                                <span className="value">{count} times</span>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default PerformancePage;
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, Pie, PieChart
} from 'recharts';
import '../styles/home-page.css';

const TIME_PERIODS = [
    { label: "This week", value: "thisWeek" },
    { label: "This month", value: "thisMonth" },
    { label: "This year", value: "thisYear" }
];

const InteractionsPieChart = ({ data }) => {
    return (
        <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '30px'
        }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Interactions Breakdown</h2>
            <PieChart width={400} height={400}>
                <Pie
                    data={data}
                    cx={200}
                    cy={200}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </div>
    );
};

const HomePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState("thisMonth");

    // Aggregate summary card stats
    const [dailyUsers, setDailyUsers] = useState(0);
    const [dailyInteractions, setDailyInteractions] = useState(0);
    const [newUsers, setNewUsers] = useState(0);

    // Data for charts
    const [lineChartData, setLineChartData] = useState([]);
    const [comparisonChartData, setComparisonChartData] = useState([]);
    const [interactionsData, setInteractionsData] = useState([]);

    // Top performers
    const [topUsers, setTopUsers] = useState([]);
    const [topRestaurants, setTopRestaurants] = useState([]);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await fetchData(currentUser);
            } else {
                setError('User not authenticated');
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [selectedPeriod]);

    const getDateRange = (period) => {
        const now = new Date();
        let startDate;
        switch (period) {
            case "today":
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case "yesterday":
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                const endYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
                return { start: startDate, end: endYesterday };
            case "thisWeek":
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay());
                break;
            case "thisMonth":
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case "thisYear":
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        return { start: startDate, end: now };
    };

    const fetchData = async (currentUser) => {
        setLoading(true);
        setError(null);
        try {
            const { start: startDate, end: endDate } = getDateRange(selectedPeriod);

            // Fetch users
            const usersQuery = query(collection(db, 'users'));
            const usersSnap = await getDocs(usersQuery);
            const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Filter new users in period
            const newUsersFiltered = allUsers.filter(u => {
                const createdAt = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
                return createdAt >= startDate && createdAt <= endDate;
            });
            setNewUsers(newUsersFiltered.length);

            // Daily users (active in period, assuming lastLogin or similar)
            const dailyUsersFiltered = allUsers.filter(u => {
                const lastLogin = u.lastLogin?.toDate ? u.lastLogin.toDate() : new Date(u.lastLogin);
                return lastLogin >= startDate && lastLogin <= endDate;
            });
            setDailyUsers(dailyUsersFiltered.length);

            // Fetch restaurants for names
            const restaurantsQuery = query(collection(db, 'restaurants'));
            const restaurantsSnap = await getDocs(restaurantsQuery);
            const restaurantsMap = {};
            restaurantsSnap.docs.forEach(doc => {
                const data = doc.data();
                restaurantsMap[doc.id] = data.name || 'Unknown Restaurant';
            });

            // Fetch interactions
            const interactionsQuery = query(collection(db, 'interactions'), where('createdAt', '>=', startDate), where('createdAt', '<=', endDate));
            const interactionsSnap = await getDocs(interactionsQuery);
            const interactions = interactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDailyInteractions(interactions.length);

            // Fetch videos uploaded
            const videosQuery = query(collection(db, 'videos'), where('uploadedAt', '>=', startDate), where('uploadedAt', '<=', endDate));
            const videosSnap = await getDocs(videosQuery);
            const videos = videosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Fetch orders placed
            const ordersQuery = query(collection(db, 'orders'), where('createdAt', '>=', startDate), where('createdAt', '<=', endDate));
            const ordersSnap = await getDocs(ordersQuery);
            const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Build line chart data: interactions, videos, orders over time
            const dataMap = {};
            const addToData = (date, type, count = 1) => {
                const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (!dataMap[label]) dataMap[label] = { date: label, interactions: 0, videos: 0, orders: 0 };
                dataMap[label][type] += count;
            };

            interactions.forEach(i => {
                const d = i.createdAt.toDate();
                addToData(d, 'interactions');
            });
            videos.forEach(v => {
                const d = v.uploadedAt.toDate();
                addToData(d, 'videos');
            });
            orders.forEach(o => {
                const d = o.createdAt.toDate();
                addToData(d, 'orders');
            });

            const lineData = Object.values(dataMap).sort((a, b) => new Date(a.date) - new Date(b.date));
            setLineChartData(lineData);

            // Comparison chart: social media (interactions + videos) vs MFOA (orders)
            const comparisonData = lineData.map(d => ({
                date: d.date,
                socialMedia: d.interactions + d.videos,
                mfoa: d.orders
            }));
            setComparisonChartData(comparisonData);

            // Interactions pie chart data: likes, comments, views
            const likes = interactions.filter(i => i.type === 'like').length;
            const comments = interactions.filter(i => i.type === 'comment').length;
            const views = interactions.filter(i => i.type === 'view').length;
            setInteractionsData([
                { name: 'Likes', value: likes, color: '#7c3aed' },
                { name: 'Comments', value: comments, color: '#6366f1' },
                { name: 'Views', value: views, color: '#f97316' }
            ]);

            // Top performing users (most interactions received)
            const userInteractions = {};
            interactions.forEach(i => {
                const targetId = i.targetUserId; // Assuming interactions have targetUserId
                userInteractions[targetId] = (userInteractions[targetId] || 0) + 1;
            });
            const topUsersList = Object.entries(userInteractions)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([id, count]) => ({ id, interactions: count, name: allUsers.find(u => u.id === id)?.name || 'Unknown' }));
            setTopUsers(topUsersList);

            // Top performing restaurants (most orders received)
            const restaurantOrders = {};
            orders.forEach(o => {
                const restId = o.restaurantId;
                restaurantOrders[restId] = (restaurantOrders[restId] || 0) + 1;
            });
            const topRestaurantsList = Object.entries(restaurantOrders)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([id, count]) => ({ id, orders: count, name: restaurantsMap[id] || 'Unknown Restaurant' }));
            setTopRestaurants(topRestaurantsList);

        } catch (err) {
            setError(`Error fetching data: ${err.message}`);
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="home-page">Loading dashboard...</div>;
    if (error) return <div className="home-page">Error: {error}</div>;

    return (
        <div className="home-page-container" style={{ fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#f9f9f9' }}>
            {/* Header */}
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ margin: 0, color: '#333' }}>Admin Dashboard</h1>
                <select
                    value={selectedPeriod}
                    onChange={e => setSelectedPeriod(e.target.value)}
                    style={{
                        padding: '10px 15px', backgroundColor: '#007bff', color: 'white',
                        border: 'none', borderRadius: '5px', cursor: 'pointer'
                    }}
                >
                    {TIME_PERIODS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                </select>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards" style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                <div className="summary-card" aria-label="Daily users" style={cardStyle}>
                    <h3 style={cardTitleStyle}>Daily Users</h3>
                    <p style={cardStatStyle}>
                        {dailyUsers.toLocaleString()}
                        <span style={{ color: 'green' }}> ↑ </span>
                    </p>
                </div>
                <div className="summary-card" aria-label="Daily interactions" style={cardStyle}>
                    <h3 style={cardTitleStyle}>Daily Interactions</h3>
                    <p style={cardStatStyle}>
                        {dailyInteractions.toLocaleString()}
                        <span style={{ color: 'green' }}> ↑ </span>
                    </p>
                </div>
                <div className="summary-card" aria-label="New users" style={cardStyle}>
                    <h3 style={cardTitleStyle}>New Users</h3>
                    <p style={cardStatStyle}>
                        {newUsers.toLocaleString()}
                        <span style={{ color: 'green' }}> ↑ </span>
                    </p>
                </div>
            </div>

            {/* Line Chart: Interactions, Videos, Orders */}
            <div className="metrics-section" style={sectionCardStyle}>
                <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Metrics Over Time</h2>
                <LineChart
                    width={900}
                    height={300}
                    data={lineChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    aria-label="Metrics line chart"
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend verticalAlign="top" align="right" height={36} />
                    <Line type="monotone" dataKey="interactions" name="Interactions" stroke="#7c3aed" strokeWidth={2} />
                    <Line type="monotone" dataKey="videos" name="Videos Uploaded" stroke="#6366f1" strokeWidth={2} />
                    <Line type="monotone" dataKey="orders" name="Orders Placed" stroke="#f97316" strokeWidth={2} />
                </LineChart>
            </div>

            {/* Comparison Line Chart: Social Media vs MFOA */}
            <div className="comparison-section" style={sectionCardStyle}>
                <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Social Media vs MFOA Usage</h2>
                <LineChart
                    width={900}
                    height={300}
                    data={comparisonChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    aria-label="Comparison line chart"
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend verticalAlign="top" align="right" height={36} />
                    <Line type="monotone" dataKey="socialMedia" name="Social Media (Interactions + Videos)" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="mfoa" name="MFOA (Orders)" stroke="#ec4899" strokeWidth={2} />
                </LineChart>
            </div>

            {/* Pie Chart: Interactions Breakdown */}
            <InteractionsPieChart data={interactionsData} />

            {/* Top Performing Users */}
            <div className="top-users-section" style={sectionCardStyle}>
                <h3>Top Performing Users (Most Interactions Received)</h3>
                {topUsers.length === 0 ? (
                    <p>No data available.</p>
                ) : (
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Name</th>
                                <th>Interactions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topUsers.map((user, idx) => {
                                const rank = idx + 1;
                                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                                return (
                                    <tr key={user.id} className={`leaderboard-row rank-${rank}`}>
                                        <td className="rank-cell">
                                            {rank}
                                            {medal && <span className="medal">{medal}</span>}
                                        </td>
                                        <td>{user.name}</td>
                                        <td>{user.interactions}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Top Performing Restaurants */}
            <div className="top-restaurants-section" style={sectionCardStyle}>
                <h3>Top Performing Restaurants (Most Orders Received)</h3>
                {topRestaurants.length === 0 ? (
                    <p>No data available.</p>
                ) : (
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Name</th>
                                <th>Orders</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topRestaurants.map((rest, idx) => {
                                const rank = idx + 1;
                                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                                return (
                                    <tr key={rest.id} className={`leaderboard-row rank-${rank}`}>
                                        <td className="rank-cell">
                                            {rank}
                                            {medal && <span className="medal">{medal}</span>}
                                        </td>
                                        <td>{rest.name}</td>
                                        <td>{rest.orders}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const cardStyle = {
    flex: 1,
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const cardTitleStyle = {
    margin: '0 0 10px 0',
    color: '#555'
};

const cardStatStyle = {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold'
};

const sectionCardStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '30px'
};

export default HomePage;

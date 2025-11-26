import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/menu-page.css';

const MenuPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('likes'); // Default leaderboard tab
  const [userMap, setUserMap] = useState({}); // Map userId -> user info

  const tabs = [
    { key: 'likes', label: 'Most Likes Received' },
    { key: 'posts', label: 'Most Posts' },
    { key: 'interactions', label: 'Most Interactions Made' }
  ];

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      if (currentUser) {
        fetchLeaderboards();
      } else {
        setLoading(false);
        setError('User not authenticated');
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchLeaderboards = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all users once to build a userId -> user info map
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = {};
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        usersData[doc.id] = {
          id: doc.id,
          displayName: data.displayName || data.name || 'Anonymous'
        };
      });
      setUserMap(usersData);

      // Fetch all videos - posts
      const videosSnapshot = await getDocs(collection(db, 'videos'));
      const videoList = [];
      const postsCountMap = {}; // userId -> posts count
      const videoOwnerMap = {}; // videoId -> uploaderId
      
      videosSnapshot.forEach(doc => {
        const data = doc.data();
        videoList.push({ id: doc.id, uploaderId: data.uploaderId });
        // Count posts per user
        if (data.uploaderId) {
          postsCountMap[data.uploaderId] = (postsCountMap[data.uploaderId] || 0) + 1;
          videoOwnerMap[doc.id] = data.uploaderId;
        }
      });

      // Fetch all interactions
      const interactionsSnapshot = await getDocs(collection(db, 'interactions'));
      // Count likes received per uploader
      const likesReceivedMap = {}; // userId -> likes count
      // Count interactions made per user
      const interactionsMadeMap = {}; // userId -> interactions count

      interactionsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'like') {
          // 'like' counts as likes received for uploader of the video
          const uploaderId = videoOwnerMap[data.videoId];
          if (uploaderId) {
            likesReceivedMap[uploaderId] = (likesReceivedMap[uploaderId] || 0) + 1;
          }
        }
        // Count interaction made by userId for all types (like, comment, etc)
        if (data.userId) {
          interactionsMadeMap[data.userId] = (interactionsMadeMap[data.userId] || 0) + 1;
        }
      });

      // Create a unified leaderboard array based on users in the system
      const leaderboard = Object.keys(usersData).map(userId => {
        return {
          id: userId,
          displayName: usersData[userId].displayName,
          postsCount: postsCountMap[userId] || 0,
          likesReceived: likesReceivedMap[userId] || 0,
          interactionsMade: interactionsMadeMap[userId] || 0
        };
      });

      setUsers(leaderboard);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sort users based on active tab key
  const sortedUsers = [...users].sort((a, b) => {
    if (activeTab === 'likes') return b.likesReceived - a.likesReceived;
    if (activeTab === 'posts') return b.postsCount - a.postsCount;
    if (activeTab === 'interactions') return b.interactionsMade - a.interactionsMade;
    return 0;
  });

  const topUsers = sortedUsers.slice(0, 10);

  const handleTabClick = (tabKey) => setActiveTab(tabKey);

  const getRankDisplay = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  if (loading) return <div className="main-content">Loading user statistics...</div>;
  if (error) return <div className="main-content">Error: {error}</div>;

  return (
    <div className="main-content">
      <div className="dashboard-header">
        <h1>User Statistics Dashboard</h1>
        <div className="header-stats">
          <div className="stat-box">
            <div className="stat-number">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{users.reduce((sum, u) => sum + u.postsCount, 0)}</div>
            <div className="stat-label">Total Posts</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{users.reduce((sum, u) => sum + u.likesReceived, 0)}</div>
            <div className="stat-label">Total Likes</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{users.reduce((sum, u) => sum + u.interactionsMade, 0)}</div>
            <div className="stat-label">Total Interactions</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <div
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div className="leaderboard-section">
        <h2 className="section-title">{tabs.find(tab => tab.key === activeTab)?.label}</h2>
        
        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>
                  {activeTab === 'likes' && 'Likes Received'}
                  {activeTab === 'posts' && 'Posts'}
                  {activeTab === 'interactions' && 'Interactions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {topUsers.length === 0 ? (
                <tr><td colSpan="3">No users found.</td></tr>
              ) : (
                topUsers.map((user, i) => (
                  <tr key={user.id} className={i < 3 ? 'top-rank' : ''}>
                    <td className="rank-cell">{getRankDisplay(i)}</td>
                    <td className="user-cell">{user.displayName}</td>
                    <td className="stat-cell">
                      {activeTab === 'likes' && user.likesReceived}
                      {activeTab === 'posts' && user.postsCount}
                      {activeTab === 'interactions' && user.interactionsMade}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;

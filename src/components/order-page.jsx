// ReportedVideosPage.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, deleteDoc, doc, documentId } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/order-page.css';

const OrderPage = () => {
  const [videos, setVideos] = useState([]);
  const [expandedVideoId, setExpandedVideoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReportedVideosWithReports();
  }, []);

  const fetchReportedVideosWithReports = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch all reports documents
      const reportsSnapshot = await getDocs(collection(db, 'reports'));

      // Map videoId -> array of report objects
      const reportsByVideo = {};
      reportsSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.videoId) {
          if (!reportsByVideo[data.videoId]) {
            reportsByVideo[data.videoId] = [];
          }
          reportsByVideo[data.videoId].push({
            id: docSnap.id,
            reason: data.reason,
            additionalDetails: data.additionalDetails || '',
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : null,
            userId: data.userId,
          });
        }
      });

      const videoIds = Object.keys(reportsByVideo);
      if (videoIds.length === 0) {
        setVideos([]);
        setLoading(false);
        return;
      }

      // 2. Firestore 'in' queries have max 10 entries — batch query
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < videoIds.length; i += batchSize) {
        batches.push(videoIds.slice(i, i + batchSize));
      }

      let videosData = [];
      // 3. Query videos collection by documentId in batches
      for (const batch of batches) {
        const videosQuery = query(
          collection(db, 'videos'),
          where(documentId(), 'in', batch)
        );
        const videosSnap = await getDocs(videosQuery);
        videosData = videosData.concat(videosSnap.docs.map(docSnap => ({
          id: docSnap.id,
          caption: docSnap.data().caption || '(No caption)',
          uploaderId: docSnap.data().uploaderId || 'Unknown',
          uploadedAt: docSnap.data().uploadedAt?.toDate ? docSnap.data().uploadedAt.toDate() : null,
          views: docSnap.data().views || 0,
          reports: reportsByVideo[docSnap.id] || [],
        })));
      }

      setVideos(videosData);
    } catch (err) {
      setError('Failed to load reported videos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (videoId) => {
    setExpandedVideoId(expandedVideoId === videoId ? null : videoId);
  };

  const handleDeleteVideo = async (videoId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this video and all its reports? This action cannot be undone.'
      )
    )
      return;

    try {
      // Delete video document
      await deleteDoc(doc(db, 'videos', videoId));

      // Delete all reports related to this video
      const reportsSnapshot = await getDocs(
        query(collection(db, 'reports'), where('videoId', '==', videoId))
      );
      const deletePromises = reportsSnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, 'reports', docSnap.id))
      );
      await Promise.all(deletePromises);

      alert('Video and all associated reports deleted successfully.');

      // Refresh after deletion
      fetchReportedVideosWithReports();
    } catch (err) {
      console.error('Failed to delete video:', err);
      alert('Failed to delete video. Please try again.');
    }
  };

  if (loading) return <div className="main-content">Loading reported videos...</div>;
  if (error) return <div className="main-content error-message">{error}</div>;

  return (
    <div className="main-content">
      <h1>Reported Videos Management</h1>
      {videos.length === 0 ? (
        <p>No reported videos found.</p>
      ) : (
        <table className="videos-table">
          <thead>
            <tr>
              <th>Caption</th>
              <th>Uploader ID</th>
              <th>Uploaded At</th>
              <th>Views</th>
              <th>Reports Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <React.Fragment key={video.id}>
                <tr className="video-row" onClick={() => toggleExpanded(video.id)}>
                  <td>{video.caption}</td>
                  <td>{video.uploaderId}</td>
                  <td>{video.uploadedAt ? video.uploadedAt.toLocaleString() : 'Unknown'}</td>
                  <td>{video.views}</td>
                  <td>{video.reports.length}</td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVideo(video.id);
                      }}
                      title="Delete video and reports"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {expandedVideoId === video.id && (
                  <tr className="report-details-row">
                    <td colSpan="6">
                      <div className="report-list">
                        <h4>Reports for this video</h4>
                        {video.reports.length === 0 ? (
                          <p>No reports.</p>
                        ) : (
                          <table className="reports-table">
                            <thead>
                              <tr>
                                <th>Reason</th>
                                <th>Additional Details</th>
                                <th>Reported By (User ID)</th>
                                <th>Timestamp</th>
                              </tr>
                            </thead>
                            <tbody>
                              {video.reports.map((report) => (
                                <tr key={report.id}>
                                  <td>{report.reason}</td>
                                  <td>{report.additionalDetails || '-'}</td>
                                  <td>{report.userId}</td>
                                  <td>{report.timestamp ? report.timestamp.toLocaleString() : 'Unknown'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrderPage;
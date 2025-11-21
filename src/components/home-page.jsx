// home-page.jsx
import React from 'react';
import '../styles/home-page.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="home-header">
        <h1>Restaurant Dashboard</h1>
      </div>

      <div className="dashboard-content">
        {/* Quick Actions Section */}
        <div className="dashboard-section">
          <div className="section-card">
            <div className="section-icon menu-icon">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div className="section-content">
              <h2>Manage menu items</h2>
              <p>Create and organize dishes, categories, and pricing to keep your menu up-to-date.</p>
            </div>
            <div className="section-actions">
              <button className="btn-primary">Add a dish</button>
              <button className="btn-secondary">Review all</button>
            </div>
          </div>

          <div className="section-card">
            <div className="section-icon rules-icon">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="section-content">
              <h2>Create delivery zones</h2>
              <p>Set up delivery areas and assign orders based on location and availability.</p>
            </div>
            <div className="section-actions">
              <button className="btn-primary">Add a zone</button>
              <button className="btn-secondary">Review all</button>
            </div>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="dashboard-section full-width">
          <div className="section-card orders-card">
            <div className="card-header">
              <div className="header-icon">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <h2>Recent customer orders</h2>
            </div>
            
            <div className="alert-banner">
              <svg className="alert-icon" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>4 orders require immediate attention.</span>
              <button className="alert-action">PROCESS ORDERS</button>
            </div>

            <div className="orders-table">
              <div className="table-header">
                <div className="col-customer">Customer</div>
                <div className="col-status">Status</div>
                <div className="col-time">Order time</div>
              </div>

              <div className="table-row">
                <div className="col-customer">
                  <div className="customer-avatar">JS</div>
                  <span>John Smith</span>
                </div>
                <div className="col-status">
                  <span className="status-badge status-pending">Pending</span>
                </div>
                <div className="col-time">Order placed</div>
              </div>

              <div className="table-row">
                <div className="col-customer">
                  <div className="customer-avatar">EM</div>
                  <span>Emma Martinez</span>
                </div>
                <div className="col-status">
                  <span className="status-badge status-active">Preparing</span>
                </div>
                <div className="col-time">12 minutes ago</div>
              </div>

              <div className="table-row">
                <div className="col-customer">
                  <div className="customer-avatar">DW</div>
                  <span>David Wilson</span>
                </div>
                <div className="col-status">
                  <span className="status-badge status-inactive">Delayed</span>
                </div>
                <div className="col-time">45 minutes ago</div>
              </div>

              <div className="table-row">
                <div className="col-customer">
                  <div className="customer-avatar">SC</div>
                  <span>Sarah Chen</span>
                </div>
                <div className="col-status">
                  <span className="status-badge status-pending">Pending</span>
                </div>
                <div className="col-time">Order placed</div>
              </div>
            </div>

            <div className="card-footer">
              <button className="btn-secondary">Review all</button>
              <button className="btn-primary">Process orders</button>
            </div>
          </div>
        </div>

        {/* Learn How To Section */}
        <div className="dashboard-section full-width">
          <div className="learn-section">
            <h2 className="learn-title">Learn how to...</h2>
            
            <div className="learn-grid">
              <div className="learn-card">
                <div className="learn-icon orange-icon">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <div className="learn-content">
                  <h3>Speed up order processing</h3>
                  <p>Set alerts to meet prep time targets and ensure customer satisfaction.</p>
                </div>
              </div>

              <div className="learn-card">
                <div className="learn-icon purple-icon">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div className="learn-content">
                  <h3>Ensure menu items are available</h3>
                  <p>Update or remove menu items based on ingredient availability and customer demand.</p>
                </div>
              </div>

              <div className="learn-card">
                <div className="learn-icon purple-icon">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <div className="learn-content">
                  <h3>Manage peak hours efficiently</h3>
                  <p>Optimize staffing and ingredient preparation based on historical order data.</p>
                </div>
              </div>

              <div className="learn-card">
                <div className="learn-icon blue-icon">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </div>
                <div className="learn-content">
                  <h3>Rotate menu offerings</h3>
                  <p>Create seasonal menus and special dishes to keep customers engaged.</p>
                </div>
              </div>

              <div className="learn-card">
                <div className="learn-icon purple-icon">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="learn-content">
                  <h3>Reduce food waste</h3>
                  <p>Track ingredient usage and expiration dates to minimize waste and costs.</p>
                </div>
              </div>

              <div className="learn-card">
                <div className="learn-icon green-icon">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                </div>
                <div className="learn-content">
                  <h3>Handle customer feedback</h3>
                  <p>Collect and respond to reviews to improve service quality and build loyalty.</p>
                </div>
              </div>
            </div>

            <div className="learn-footer">
              <button className="btn-link">Show more</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
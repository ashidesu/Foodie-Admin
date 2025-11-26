import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/left-sidebar.css'; // Assuming the CSS is in a separate file

const LeftSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedOption, setSelectedOption] = useState('home');
  const navigate = useNavigate();

  useEffect(() => {
    // Load saved selection from localStorage
    const savedSelection = localStorage.getItem('selectedOption') || 'home';
    setSelectedOption(savedSelection);
  }, []);

  const handleHamburgerClick = () => {
    setCollapsed(false);
  };

  const handleLabelClick = () => {
    setCollapsed(true);
  };

  const handleLinkClick = (option, pageUrl) => {
    // Save selection to localStorage
    localStorage.setItem('selectedOption', option);
    setSelectedOption(option);
    // Redirect using React Router navigate (assuming paths are adjusted to routes like '/home')
    // If keeping original paths, use window.location.href = pageUrl;
    // But since "use paths for redirection", assuming React Router paths
    navigate(pageUrl.replace('../pages/', '/').replace('.html', ''));
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button className="hamburger" id="hamburger-btn" onClick={handleHamburgerClick}>
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
      <h2 id="sidebar-label" onClick={handleLabelClick}>Sidebar</h2>
      <ul>
        <li>
          <a
            href="#"
            id="home-link"
            data-option="home"
            data-page="../pages/home.html"
            className={selectedOption === 'home' ? 'selected' : ''}
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('home', '../pages/home.html');
            }}
          >
            <span className="icon">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </span>
            <span className="link-text">Home</span>
          </a>
        </li>
        <li>
          <a
            href="#"
            id="performance-link"
            data-option="performance"
            data-page="../pages/performance.html"
            className={selectedOption === 'performance' ? 'selected' : ''}
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('performance', '../pages/performance.html');
            }}
          >
            <span className="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><title>Ml-regression-job SVG Icon</title><path fill="currentColor" d="M24 0a8 8 0 1 1-4.906 14.32l-4.774 4.774a8 8 0 1 1-1.414-1.414l4.774-4.774A8 8 0 0 1 24 0M8 18a6 6 0 1 0 0 12a6 6 0 0 0 0-12M24 2a6 6 0 1 0 0 12a6 6 0 0 0 0-12" /><path fill="currentColor" d="M32 20v12H20V20zm-2 2h-8v8h8zM12 0v12H0V0zm-2 2H2v8h8z" class="ouiIcon__fillSecondary" /></svg>
            </span>
            <span className="link-text">Applications</span>
          </a>
        </li>
        <li>
          <a
            href="#"
            id="menu-link"
            data-option="menu"
            data-page="../pages/menu.html"
            className={selectedOption === 'menu' ? 'selected' : ''}
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('menu', '../pages/menu.html');
            }}
          >
            <span className="icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>


            </span>
            <span className="link-text">Statistics</span>
          </a>
        </li>
        <li>
          <a
            href="#"
            id="orders-link"
            data-option="orders"
            data-page="../pages/orders.html"
            className={selectedOption === 'orders' ? 'selected' : ''}
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('orders', '../pages/orders.html');
            }}
          >
            <span className="icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
              </svg>

            </span>
            <span className="link-text">Reports</span>
          </a>
        </li>
      </ul>
    </aside>
  );
};

export default LeftSidebar;
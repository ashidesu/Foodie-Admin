import React, { useState, useEffect } from 'react';
import '../styles/menu-page.css';
import AddDishOverlay from './add-dish-overlay';
import { db } from '../firebase'; // Assuming Firebase is configured
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import supabase from '../supabase'; // Assuming Supabase is configured

const MenuPage = () => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch dishes from Firestore on mount
  useEffect(() => {
    const fetchDishes = async () => {
      try {
        // Query dishes from Firestore, sorted by createdAt descending
        const dishesQuery = query(collection(db, 'dishes'), orderBy('createdAt', 'desc'));
        const dishesSnapshot = await getDocs(dishesQuery);
        const dishesList = [];

        for (const docSnap of dishesSnapshot.docs) {
          const dishData = docSnap.data();
          const { name, category, price, description, restaurantId, imageUrl, createdAt } = dishData;
          const dishId = docSnap.id;

          // Fetch restaurant name from 'users' collection (using restaurantId as UID)
          let restaurantName = 'Unknown Restaurant';
          if (restaurantId) {
            try {
              const restaurantDocRef = doc(db, 'users', restaurantId);
              const restaurantDocSnap = await getDoc(restaurantDocRef);
              if (restaurantDocSnap.exists()) {
                const restaurantData = restaurantDocSnap.data();
                restaurantName = restaurantData.displayname || restaurantData.name || 'Unknown Restaurant';
              }
            } catch (fetchError) {
              console.error('Error fetching restaurant:', fetchError);
            }
          }

          // Get image URL from Supabase if imageUrl is a path (e.g., file name)
          let publicImageUrl = '';
          if (imageUrl) {
            try {
              const { data: urlData } = supabase.storage.from('dishes').getPublicUrl(imageUrl);
              publicImageUrl = urlData?.publicUrl || '';
            } catch (urlError) {
              console.error('Error getting image URL:', urlError);
            }
          }

          dishesList.push({
            id: dishId,
            name,
            category,
            price,
            description,
            restaurantName,
            imageSrc: publicImageUrl,
            createdAt: createdAt?.toDate() ? createdAt.toDate().toLocaleDateString() : 'Unknown',
          });
        }

        setDishes(dishesList);
      } catch (fetchError) {
        console.error('Error fetching dishes:', fetchError);
        setError('Failed to load dishes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDishes();
  }, []);

  const handleAddDishClick = () => {
    setIsOverlayOpen(true);
  };

  const handleCloseOverlay = () => {
    setIsOverlayOpen(false);
    // Optionally, refetch dishes after adding a new one
    window.location.reload(); // Simple reload; or implement a refetch function
  };

  if (loading) return <div className="main-content">Loading dishes...</div>;
  if (error) return <div className="main-content"><p className="error-message">{error}</p></div>;

  return (
    <div className="main-content">
      <div className="gallery-header">
        <h1>Dish Management</h1>
        <div className="search-bar">
          <input type="text" placeholder="Search dishes..." />
          <button><i className="fas fa-search"></i></button>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="category-filter">Category</label>
          <select id="category-filter">
            <option value="">All Categories</option>
            <option value="appetizers">Appetizers</option>
            <option value="mains">Main Courses</option>
            <option value="desserts">Desserts</option>
            <option value="drinks">Drinks</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select id="status-filter">
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        <button className="add-dish-btn" onClick={handleAddDishClick}>
          <i className="fas fa-plus"></i> Add New Dish
        </button>
      </div>

      <div className="dish-grid">
        {dishes.length === 0 ? (
          <p>No dishes found. Add your first dish!</p>
        ) : (
          dishes.map((dish) => (
            <div className="dish-card" key={dish.id}>
              <div className="dish-image">
                <img
                  src={dish.imageSrc || 'https://via.placeholder.com/280x200?text=No+Image'}
                  alt={dish.name}
                />
              </div>
              <div className="dish-info">
                <h3 className="dish-title">{dish.name}</h3>
                <p className="dish-description">{dish.description}</p>
                <div className="dish-meta">
                  <span className="dish-price">${dish.price}</span>
                  <span className="dish-status status-available">Available</span> {/* Placeholder; add logic for status if needed */}
                </div>
                <div className="admin-actions">
                  <button className="admin-btn btn-edit"><i className="fas fa-edit"></i> Edit</button>
                  <button className="admin-btn btn-toggle"><i className="fas fa-ban"></i> Disable</button>
                  <button className="admin-btn btn-delete"><i className="fas fa-trash"></i></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Overlay Component */}
      <AddDishOverlay isOpen={isOverlayOpen} onClose={handleCloseOverlay} />
    </div>
  );
};

export default MenuPage;
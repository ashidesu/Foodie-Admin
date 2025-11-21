import React, { useState, useEffect, useRef } from 'react';
import '../styles/add-dish-overlay.css';
// Assuming Firebase is set up; replace with your actual import
import { getAuth } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore'; // Added updateDoc
import { db } from '../firebase'; // Replace with your Firebase config path
import supabase from '../supabase'; // Assuming Supabase is configured and exported

const AddDishOverlay = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    restaurantId: '', // Will be set to a valid string if fetched
    imageUrl: '', // This will store the image path (e.g., dishId), not the full URL
  });
  const [selectedImage, setSelectedImage] = useState(null); // For file preview
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const imageInputRef = useRef(null);

  // Fetch restaurant ID from users collection on mount
  useEffect(() => {
    const fetchRestaurantId = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const restaurantId = userDoc.data().restaurantId;
            if (restaurantId && typeof restaurantId === 'string' && restaurantId.trim() !== '') {
              setFormData((prev) => ({ ...prev, restaurantId }));
            } else {
              setError('Restaurant ID not found or invalid for this user.');
            }
          } else {
            setError('User data not found.');
          }
        } else {
          setError('User not authenticated.');
        }
      } catch (err) {
        console.error('Error fetching restaurant ID:', err);
        setError('Failed to fetch restaurant ID.');
      }
    };

    if (isOpen) {
      fetchRestaurantId();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Image upload handlers (similar to video upload example)
  const handleImageDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  const handleImageDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageSelection(files[0]);
    }
  };

  const handleImageSelection = (file) => {
    if (file && file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024) { // Max 10MB
      setSelectedImage(file);
    } else {
      setError('Please select a valid image file (max 10MB).');
    }
  };

  const handleImageButtonClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageSelection(files[0]);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.name || !formData.category || !formData.price || !formData.description || !formData.restaurantId) {
      setError('All fields, including Restaurant ID, are required.');
      setLoading(false);
      return;
    }

    try {
      // First, add the dish to Firestore to get the ID
      const dishData = {
        name: formData.name,
        category: formData.category,
        price: formData.price,
        description: formData.description,
        restaurantId: formData.restaurantId,
        createdAt: new Date(),
        // imageUrl will be added later
      };
      const docRef = await addDoc(collection(db, 'dishes'), dishData);
      const dishId = docRef.id;

      let imageUrl = '';

      // Upload image to Supabase if selected, using dishId as filename
      if (selectedImage) {
        const fileExtension = selectedImage.name.split('.').pop(); // Get file extension
        const imageFilename = `${dishId}.${fileExtension}`; // Filename = dishId + extension
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('dishes') // Bucket name set to 'dishes'
          .upload(imageFilename, selectedImage);

        if (uploadError) {
          throw uploadError;
        }

        // Store the image path (imageFilename) in Firestore
        imageUrl = imageFilename;
      }

      // Update the Firestore document with the imageUrl
      await updateDoc(docRef, { imageUrl });

      alert('Dish added successfully!');
      onClose(); // Close overlay on success
      setFormData({ name: '', category: '', price: '', description: '', restaurantId: '', imageUrl: '' }); // Reset form (restaurantId will be refetched on reopen)
      setSelectedImage(null);
    } catch (err) {
      console.error('Error adding dish:', err);
      setError('Failed to add dish. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
        <div className="overlay-header">
          <h2>Add New Dish</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="add-dish-form">
          {error && <p className="error-message">{error}</p>}
          <div className="form-group">
            <label htmlFor="name">Dish Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter dish name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              <option value="appetizers">Appetizers</option>
              <option value="mains">Main Courses</option>
              <option value="desserts">Desserts</option>
              <option value="drinks">Drinks</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Enter price (e.g., 16.99)"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter dish description"
              rows="4"
              required
            />
          </div>
          {/* Image Upload Section */}
          <div className="form-group">
            <label>Dish Image (Optional)</label>
            {!selectedImage ? (
              <div
                className={`image-upload-zone ${isDraggingImage ? 'dragging' : ''}`}
                onDragEnter={handleImageDragEnter}
                onDragOver={handleImageDragOver}
                onDragLeave={handleImageDragLeave}
                onDrop={handleImageDrop}
                onClick={handleImageButtonClick}
                style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDraggingImage ? '#f0f9ff' : '#f9fafb',
                }}
              >
                <p>Drag and drop an image here, or click to select</p>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageInputChange}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Dish Preview"
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="restaurantId">Restaurant ID</label>
            <input
              type="text"
              id="restaurantId"
              name="restaurantId"
              value={formData.restaurantId}
              readOnly // Fetched automatically
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Dish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDishOverlay;

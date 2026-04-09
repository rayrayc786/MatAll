import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getFullImageUrl } from '../utils/imageUrl';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, order }) => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product to rate');
      return;
    }
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/products/${selectedProduct._id || selectedProduct}/reviews`, {
        rating,
        comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Thank you for your review!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="location-modal-overlay" style={{ zIndex: 2000 }}>
      <div className="location-modal-content" style={{ maxWidth: '450px', padding: '20px' }}>
        <div className="modal-header" style={{ marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Rate your items</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {!selectedProduct ? (
          <div className="product-selector-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '12px' }}>Which item would you like to rate?</p>
            {order.items.map((item: any, idx: number) => {
              const prod = item.productId || item.product;
              return (
                <div 
                  key={idx} 
                  className="selector-item" 
                  style={{ display: 'flex', alignItems: 'center', padding: '10px', border: '1px solid #f1f5f9', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer' }}
                  onClick={() => setSelectedProduct(prod)}
                >
                  <img src={getFullImageUrl(prod?.imageUrl)} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain', marginRight: '12px' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{prod?.productName || prod?.name || 'Item'}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rating-form">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <img src={getFullImageUrl(selectedProduct?.imageUrl)} alt="" style={{ width: '50px', height: '50px', objectFit: 'contain', marginRight: '15px' }} />
              <div>
                <h4 style={{ margin: 0 }}>{selectedProduct?.productName || selectedProduct?.name}</h4>
                <button 
                  onClick={() => setSelectedProduct(null)} 
                  style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', padding: 0, cursor: 'pointer' }}
                >
                  Change item
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ marginBottom: '10px', fontWeight: 600 }}>Tap to rate</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={32} 
                    fill={star <= rating ? "#FFD700" : "none"} 
                    color={star <= rating ? "#FFD700" : "#cbd5e1"} 
                    onClick={() => setRating(star)}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </div>
            </div>

            <textarea 
              placeholder="What did you like or dislike about this product? (Optional)" 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', minHeight: '100px', marginBottom: '20px', fontSize: '0.9rem' }}
            />

            <button 
              className="confirm-loc-btn" 
              onClick={handleSubmit} 
              disabled={loading}
              style={{ height: '48px' }}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingModal;

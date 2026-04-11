import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getFullImageUrl } from '../utils/imageUrl';
import './locationModal.css';

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
    <div className="location-modal-overlay" style={{ zIndex: 100000 }} onClick={onClose}>
      <div className="location-modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
        <div className="location-modal-header">
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Rate your items</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="location-modal-body">
          {!selectedProduct ? (
            <div className="product-selector-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '12px' }}>Which item would you like to rate?</p>
              {order.items.map((item: any, idx: number) => {
                const prod = item.productId || item.product;
                return (
                  <div 
                    key={idx} 
                    className="selector-item" 
                    style={{ display: 'flex', alignItems: 'center', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '12px', marginBottom: '8px', cursor: 'pointer' }}
                    onClick={() => setSelectedProduct(prod)}
                  >
                    <img src={getFullImageUrl(prod?.imageUrl)} alt="" style={{ width: '45px', height: '45px', objectFit: 'contain', marginRight: '12px' }} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{prod?.productName || prod?.name || 'Item'}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rating-form">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <img src={getFullImageUrl(selectedProduct?.imageUrl)} alt="" style={{ width: '50px', height: '50px', objectFit: 'contain', marginRight: '15px' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>{selectedProduct?.productName || selectedProduct?.name}</h4>
                  <button 
                    onClick={() => setSelectedProduct(null)} 
                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', padding: 0, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Change item
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ marginBottom: '12px', fontWeight: 700, fontSize: '1rem' }}>Tap to rate</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={36} 
                      fill={star <= rating ? "#FFD700" : "none"} 
                      color={star <= rating ? "#FFD700" : "#cbd5e1"} 
                      onClick={() => setRating(star)}
                      style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                    />
                  ))}
                </div>
              </div>

              <textarea 
                placeholder="What did you like or dislike about this product? (Optional)" 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '120px', marginBottom: '20px', fontSize: '0.95rem', outline: 'none' }}
              />

              <button 
                className="confirm-loc-btn" 
                onClick={handleSubmit} 
                disabled={loading}
                style={{ height: '52px', fontSize: '1rem', fontWeight: 800 }}
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RatingModal;


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Star, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const ReviewManager: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(data);
    } catch (err) {
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Review deleted');
      setReviews(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <h2>Review Management</h2>
        <p>Manage all customer ratings and feedback</p>
      </div>

      <div className="admin-content-card">
        {loading ? (
          <div className="p-8 text-center">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
            <p>No reviews found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review._id}>
                    <td><strong>{review.productId?.productName || 'Deleted Product'}</strong></td>
                    <td>{review.userName}</td>
                    <td>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={14} fill={s <= review.rating ? "#FFD700" : "none"} color={s <= review.rating ? "#FFD700" : "#cbd5e1"} />
                        ))}
                      </div>
                    </td>
                    <td className="max-w-xs truncate">{review.comment || '--'}</td>
                    <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="text-red-500 hover:bg-red-50 p-2 rounded" onClick={() => handleDelete(review._id)}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewManager;

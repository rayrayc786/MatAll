import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart, Package, ArrowRight, ShoppingCart, Trash2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFavorites = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/auth/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [navigate]);

  const toggleFavorite = async (productId: string) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/favorites/toggle`, { productId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Removed from favorites');
      fetchFavorites();
    } catch (err) {
      toast.error('Failed to update favorites');
    }
  };

  if (loading) return <div className="content">Loading your favorites...</div>;

  return (
    <main className="content favorites-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900 }}>Favorite Materials</h1>
        <p style={{ color: '#64748b' }}>Quick access to your frequently ordered industrial products</p>
      </header>

      {favorites.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '5rem' }}>
          <Heart size={64} color="#e2e8f0" fill="#f8fafc" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>No favorites yet</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>Save products you frequently use for faster procurement.</p>
          <button onClick={() => navigate('/products')} className="btn-primary-lg" style={{ margin: '0 auto' }}>Explore Materials</button>
        </div>
      ) : (
        <div className="favorites-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {favorites.map(product => (
            <div key={product._id} className="fav-card card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: '200px', background: '#f1f5f9' }}>
                <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{product.name}</h3>
                  <button onClick={() => toggleFavorite(product._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                    <Heart size={20} fill="#ef4444" />
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '8px 0 1.5rem' }}>SKU: {product.sku} | CSI: {product.csiMasterFormat}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.25rem' }}>₹{product.price.toFixed(2)}</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => navigate(`/products/${product._id}`)} className="secondary-btn" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>Details</button>
                    <button onClick={() => navigate('/products')} className="primary-btn" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Favorites;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Star, MapPin, Phone } from 'lucide-react';

const SupplierStore: React.FC = () => {
  const { id } = useParams();
  const [supplier, setSupplier] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    // Mock supplier data fetch
    setSupplier({
      name: 'Industrial Supply Co.',
      rating: 4.8,
      location: 'Bangalore, India',
      expertise: ['Cement', 'Steel'],
      isVerified: true
    });
    
    // Fetch supplier's products
    const fetchSupplierProducts = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products?supplierId=${id}`);
        setProducts(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSupplierProducts();
  }, [id]);

  if (!supplier) return <div>Loading Store...</div>;

  return (
    <main className="content supplier-store">
      <header className="supplier-profile card">
        <div className="profile-info">
          <h1>{supplier.name} {supplier.isVerified && <ShieldCheck className="verified-icon" />}</h1>
          <div className="meta">
            <span className="rating"><Star size={16} /> {supplier.rating} (120+ Reviews)</span>
            <span><MapPin size={16} /> {supplier.location}</span>
          </div>
          <div className="expertise-tags">
            {supplier.expertise.map((e: string) => <span key={e} className="tag">{e}</span>)}
          </div>
        </div>
        <button className="contact-btn"><Phone size={18} /> Request Bulk Quote</button>
      </header>

      <section className="supplier-catalog">
        <h2>Supplied Materials</h2>
        <div className="product-grid">
          {products.map(product => (
            <div key={product._id} className="product-card">
              {/* Product card UI similar to ProductList */}
              <h3>{product.name}</h3>
              <p className="price">₹{product.price}</p>
              <button className="quick-add-btn">Add to Cart</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default SupplierStore;

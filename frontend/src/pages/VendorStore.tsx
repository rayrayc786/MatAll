import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Star, MapPin, Phone } from 'lucide-react';

const VendorStore: React.FC = () => {
  const { id } = useParams();
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    // Mock vendor data fetch
    setVendor({
      name: 'Industrial Supply Co.',
      rating: 4.8,
      location: 'Bangalore, India',
      expertise: ['Cement', 'Steel'],
      isVerified: true
    });
    
    // Fetch vendor's products
    const fetchVendorProducts = async () => {
      try {
        const { data } = await axios.get(`http://localhost:3000/api/products?vendorId=${id}`);
        setProducts(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchVendorProducts();
  }, [id]);

  if (!vendor) return <div>Loading Store...</div>;

  return (
    <main className="content vendor-store">
      <header className="vendor-profile card">
        <div className="profile-info">
          <h1>{vendor.name} {vendor.isVerified && <ShieldCheck className="verified-icon" />}</h1>
          <div className="meta">
            <span className="rating"><Star size={16} /> {vendor.rating} (120+ Reviews)</span>
            <span><MapPin size={16} /> {vendor.location}</span>
          </div>
          <div className="expertise-tags">
            {vendor.expertise.map((e: string) => <span key={e} className="tag">{e}</span>)}
          </div>
        </div>
        <button className="contact-btn"><Phone size={18} /> Request Bulk Quote</button>
      </header>

      <section className="vendor-catalog">
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

export default VendorStore;

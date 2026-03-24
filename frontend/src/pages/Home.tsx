import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Construction, Drill, Wrench, Layers, ArrowRight, ShieldCheck, Zap, CreditCard, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import './home.css';

const CATEGORIES = [
  { id: '03', name: 'Concrete', icon: <Layers size={24} />, color: '#eff6ff', textColor: '#2563eb', img: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=200' },
  { id: '04', name: 'Masonry', icon: <Construction size={24} />, color: '#fff7ed', textColor: '#d97706', img: 'https://images.unsplash.com/photo-1590059132218-22af239d53ea?auto=format&fit=crop&q=80&w=200' },
  { id: '05', name: 'Metals', icon: <Drill size={24} />, color: '#f0fdf4', textColor: '#16a34a', img: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=200' },
  { id: '06', name: 'Wood', icon: <Layers size={24} />, color: '#fafaf9', textColor: '#44403c', img: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=200' },
  { id: '22', name: 'Plumbing', icon: <Wrench size={24} />, color: '#f5f3ff', textColor: '#7c3aed', img: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=200' },
  { id: '26', name: 'Electrical', icon: <Zap size={24} />, color: '#fef2f2', textColor: '#dc2626', img: 'https://images.unsplash.com/photo-1558402529-d2638a7023e9?auto=format&fit=crop&q=80&w=200' },
];

const Home: React.FC = () => {
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products`);
        setTopProducts(data.slice(0, 8));
      } catch (err) {
        console.error('Error fetching top products:', err);
      }
    };
    fetchTopProducts();
  }, []);

  return (
    <main className="home-container">
      {/* Hero Banner - Blinkit style */}
      <section className="home-hero-banner">
         <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=1200" alt="B2B Materials" className="hero-bg" />
         <div className="hero-overlay">
            <div className="hero-tag">UP TO 40% OFF</div>
            <h2>Industrial Materials Delivered in 60 Mins</h2>
            <Link to="/products" className="hero-btn">Shop Now</Link>
         </div>
      </section>

      {/* Shop by Store / Categories */}
      <section className="home-section">
        <div className="home-section-header">
          <h3>Shop by store</h3>
        </div>
        <div className="blinkit-category-grid">
          {CATEGORIES.map(cat => (
            <Link to={`/products?category=${cat.id}`} key={cat.id} className="blinkit-category-item">
              <div className="cat-img-box">
                <img src={cat.img} alt={cat.name} />
              </div>
              <span>{cat.name} Store</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Hot Deals - Horizontal Scroll */}
      <section className="home-section">
        <div className="home-section-header">
          <h3>Hot deals</h3>
          <Link to="/products" className="see-all">see all</Link>
        </div>
        <div className="blinkit-product-scroll">
          {topProducts.length === 0 ? (
            <p>Loading deals...</p>
          ) : (
            topProducts.map(item => (
              <div key={item._id} className="scroll-item-wrap">
                <ProductCard product={item} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Daily Fresh Needs / Recent Materials */}
      <section className="home-section">
        <div className="home-section-header">
          <h3>Recent Materials</h3>
          <Link to="/products" className="see-all">see all</Link>
        </div>
        <div className="blinkit-product-grid">
          {topProducts.map(item => (
            <ProductCard key={item._id} product={item} />
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;

import React from 'react';
import { Link } from 'react-router-dom';
import { Construction, Drill, Wrench, Layers, ArrowRight, ShieldCheck, Zap, CreditCard } from 'lucide-react';

const CATEGORIES = [
  { id: '03', name: 'Concrete', icon: <Layers size={24} />, color: '#eff6ff', textColor: '#2563eb' },
  { id: '04', name: 'Masonry', icon: <Construction size={24} />, color: '#fff7ed', textColor: '#d97706' },
  { id: '05', name: 'Metals', icon: <Drill size={24} />, color: '#f0fdf4', textColor: '#16a34a' },
  { id: '06', name: 'Wood', icon: <Layers size={24} />, color: '#fafaf9', textColor: '#44403c' },
  { id: '22', name: 'Plumbing', icon: <Wrench size={24} />, color: '#f5f3ff', textColor: '#7c3aed' },
  { id: '26', name: 'Electrical', icon: <Zap size={24} />, color: '#fef2f2', textColor: '#dc2626' },
];

const TOP_MATERIALS = [
  { 
    id: '1', 
    name: 'TMT 500D Steel', 
    desc: 'Grade 500D | 12mm', 
    img: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?auto=format&fit=crop&q=80&w=400',
    price: '₹850.00 / Ton'
  },
  { 
    id: '2', 
    name: 'OPC 53 Cement', 
    desc: '50kg Bag | Birla', 
    img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400',
    price: '₹6.50 / Bag'
  },
  { 
    id: '3', 
    name: 'Washed M-Sand', 
    desc: 'Washed | 1 Ton', 
    img: 'https://images.unsplash.com/photo-1533062609701-2274b74bb881?auto=format&fit=crop&q=80&w=400',
    price: '₹18.00 / Ton'
  },
  { 
    id: '4', 
    name: 'Solid Blocks', 
    desc: '8" Load Bearing', 
    img: 'https://images.unsplash.com/photo-1590060417650-cc04b0608a63?auto=format&fit=crop&q=80&w=400',
    price: '₹0.85 / Block'
  }
];

const Home: React.FC = () => {
  return (
    <main className="home-page">
      <section className="hero-modern">
        <div className="hero-content">
          <div className="badge-promo">🚀 Fastest Jobsite Delivery in India</div>
          <h1>B2B Industrial Materials, <span>Delivered in 60 Mins.</span></h1>
          <p>Direct from 500+ verified manufacturers. Procurement simplified for contractors and developers.</p>
          <div className="hero-actions">
            <Link to="/products" className="btn-primary-lg">Browse Materials <ArrowRight size={20} /></Link>
          </div>
          <div className="hero-trust">
            <span>Trusted by:</span>
            <div className="trust-logos">
              <span className="trust-logo">L&T Construction</span>
              <span className="trust-logo">Tata Projects</span>
              <span className="trust-logo">Lodha Group</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800" alt="Construction Site" />
          <div className="floating-stat">
            <Zap size={20} color="#f59e0b" fill="#f59e0b" />
            <div>
              <strong>Instant Delivery</strong>
              <p>Under 60 mins</p>
            </div>
          </div>
        </div>
      </section>

      <div className="content">
        <section className="features-grid">
          <div className="feature-card">
            <div className="f-icon" style={{ background: '#dcfce7' }}><ShieldCheck color="#16a34a" /></div>
            <h3>100% Quality Insured</h3>
            <p>Every batch lab-tested and certified before dispatch.</p>
          </div>
          <div className="feature-card">
            <div className="f-icon" style={{ background: '#eff6ff' }}><Zap color="#2563eb" /></div>
            <h3>Real-time Tracking</h3>
            <p>Live GPS tracking for all your jobsite deliveries.</p>
          </div>
          <div className="feature-card">
            <div className="f-icon" style={{ background: '#fef2f2' }}><CreditCard color="#dc2626" /></div>
            <h3>BuildItQuick Pay</h3>
            <p>Buy now, pay later with 45-day interest-free credit.</p>
          </div>
        </section>

        <section className="section-header">
          <div>
            <h2>CSI MasterFormat Categories</h2>
            <p>Browse materials by industrial classification</p>
          </div>
          <Link to="/products" className="text-link">View All Categories <ArrowRight size={16} /></Link>
        </section>

        <div className="category-grid">
          {CATEGORIES.map(cat => (
            <Link to={`/products?category=${cat.id}`} key={cat.id} className="category-card-modern">
              <div className="cat-icon-wrap" style={{ background: cat.color, color: cat.textColor }}>{cat.icon}</div>
              <span className="cat-name">{cat.name}</span>
            </Link>
          ))}
        </div>

        <section className="section-header" style={{ marginTop: '4rem' }}>
          <div>
            <h2>Top Rated Materials</h2>
            <p>Most ordered items this week at best prices</p>
          </div>
          <Link to="/products" className="text-link">View All Materials <ArrowRight size={16} /></Link>
        </section>

        <div className="materials-grid">
          {TOP_MATERIALS.map(item => (
            <Link to="/products" key={item.id} className="material-card-modern">
              <div className="material-img">
                <img src={item.img} alt={item.name} />
                <div className="price-tag">{item.price}</div>
              </div>
              <div className="material-info">
                <h3>{item.name}</h3>
                <p>{item.desc}</p>
                <div className="card-footer-modern">
                  <span className="rating">⭐ 4.8</span>
                  <span className="delivery-tag">Fast Delivery</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Home;

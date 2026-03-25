import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  RotateCcw, 
  ShoppingCart, 
  Headphones, 
  Layers, 
  Construction, 
  Drill, 
  Wrench, 
  Zap, 
  Paintbrush,
  Hammer,
  Truck,
  Box
} from 'lucide-react';
import './home.css';

const CATEGORIES = [
  { id: '03', name: 'Wooden', icon: <Layers size={32} />, color: '#FFEA00' },
  { id: '04', name: 'Electrical', icon: <Zap size={32} />, color: '#FFEA00' },
  { id: '05', name: 'Plumbing', icon: <Wrench size={32} />, color: '#FFEA00' },
  { id: '06', name: 'Paint & POP', icon: <Paintbrush size={32} />, color: '#FFEA00' },
  { id: '22', name: 'Hardware', icon: <Hammer size={32} />, color: '#FFEA00' },
  { id: '26', name: 'Civil', icon: <Construction size={32} />, color: '#FFEA00' },
  { id: 'tiles', name: 'Tiles & Flooring', icon: <Box size={32} />, color: '#FFEA00' },
  { id: 'tools', name: 'Tools', icon: <Drill size={32} />, color: '#FFEA00' },
  { id: 'misc', name: 'Miscellaneous', icon: <Truck size={32} />, color: '#FFEA00' },
];

const OFFERS = [
  { id: 1, title: 'Plyboard + Modular Hardware', discount: 'Flat 20% OFF', img: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=200' },
  { id: 2, title: 'POP Channel + Mesh + POP', discount: 'Combo Deal ₹2999', img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=200' },
  { id: 3, title: 'Wire + Switch + Lamp', discount: 'Upto 40% OFF', img: 'https://images.unsplash.com/photo-1558402529-d2638a7023e9?auto=format&fit=crop&q=80&w=200' },
];

const Home: React.FC = () => {
  const { cartCount } = { cartCount: 0 }; // Placeholder

  return (
    <main className="landing-container">
      <div className="landing-content">
        {/* Categories Section */}
        <section className="landing-section">
          <div className="section-title-row">
            <h3>Categories</h3>
          </div>
          <div className="category-grid-3x3">
            {CATEGORIES.map(cat => (
              <Link to={`/category/${cat.id}`} key={cat.id} className="category-tile">
                <div className="tile-icon-box">
                  {cat.icon}
                </div>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Offers Section */}
        <section className="landing-section">
          <div className="section-title-row">
            <h3>Offers</h3>
          </div>
          <div className="offers-horizontal-scroll">
            {OFFERS.map(offer => (
              <div key={offer.id} className="offer-card">
                <div className="offer-img-box">
                  <img src={offer.img} alt={offer.title} />
                  <div className="offer-badge">{offer.discount}</div>
                </div>
                <div className="offer-details">
                  <h4>{offer.title}</h4>
                  <button className="shop-now-btn">Shop Now</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Fixed Footer */}
      <footer className="landing-footer">
        <Link to="/" className="footer-item active">
          <HomeIcon size={24} />
          <span>Home</span>
        </Link>
        <Link to="/orders" className="footer-item">
          <RotateCcw size={24} />
          <span>Repeat</span>
        </Link>
        <Link to="/cart" className="footer-item">
          <div className="footer-cart-icon">
            <ShoppingCart size={24} />
            {cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
          </div>
          <span>Cart</span>
        </Link>
        <Link to="/support" className="footer-item">
          <Headphones size={24} />
          <span>Support</span>
        </Link>
      </footer>
    </main>
  );
};

export default Home;

import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Home as HomeIcon,
  RotateCcw,
  ShoppingCart,
  Headphones,
  ChevronRight
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import './home.css';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const ENRICHED_CATEGORIES = [
  { id: '03', name: 'Wooden', brands: 12, from: 105, img: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400' },
  { id: '04', name: 'Electrical', brands: 8, from: 45, img: 'https://images.unsplash.com/photo-1558402529-d2638a7023e9?auto=format&fit=crop&q=80&w=400' },
  { id: '22', name: 'Hardware', brands: 15, from: 15, img: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=400' },
  { id: '06', name: 'Paint & POP', brands: 6, from: 250, img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400' },
  { id: 'tiles', name: 'Tiles', brands: 10, from: 35, img: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&q=80&w=400' },
  { id: 'tools', name: 'Tools', brands: 20, from: 99, img: 'https://images.unsplash.com/photo-1530124560676-4ce54490356c?auto=format&fit=crop&q=80&w=400' },
];

const BRANDS = [
  { name: 'Century Ply', logo: 'https://www.centuryply.com/assets/img/logo.png' },
  { name: 'Greenlam', logo: 'https://www.greenlam.com/india/wp-content/themes/greenlam/images/logo.png' },
  { name: 'Polycab', logo: 'https://polycab.com/wp-content/uploads/2023/09/polycab-logo.png' },
  { name: 'Havells', logo: 'https://www.havells.com/content/dam/havells/havells-logo.png' },
  { name: 'Asian Paints', logo: 'https://www.asianpaints.com/content/dam/asian_paints/logo/ap-logo-new.png' },
  { name: 'Astral', logo: 'https://www.astralpipes.com/wp-content/themes/astral/images/logo.png' },
  { name: 'Jaquar', logo: 'https://www.jaquar.com/images/logo.png' },
  { name: 'UltraTech', logo: 'https://www.ultratechcement.com/content/dam/ultratechcement/logo/ultratech-logo.png' },
];

const OFFERS = [
  { id: 1, title: 'Plyboard + Modular Hardware', discount: 'Flat 20% OFF', img: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=200' },
  { id: 2, title: 'POP Channel + Mesh + POP', discount: 'Combo Deal ₹2999', img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=200' },
  { id: 3, title: 'Wire + Switch + Lamp', discount: 'Upto 40% OFF', img: 'https://images.unsplash.com/photo-1558402529-d2638a7023e9?auto=format&fit=crop&q=80&w=200' },
];

const Home: React.FC = () => {
  const { cart } = useCart();
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isMounted = useRef(true);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products?isPopular=true`);
        if (isMounted.current) setPopularProducts(data);
      } catch (err) {
        console.error('Error fetching popular products:', err);
      }
    };
    fetchPopular();
    return () => { isMounted.current = false; };
  }, []);

  return (
    <main className="landing-container">
      <div className="landing-content main-content-responsive">

        {/* Categories Section */}
        <section className="landing-section">
          <div className="section-title-row">
            <h3>Shop by Category</h3>
          </div>
          <div className="category-modern-grid">
            {ENRICHED_CATEGORIES.map(cat => (
              <Link to={`/category/${cat.id}`} key={cat.name} className="category-modern-card">
                <div className="category-card-img-box">
                  <img src={cat.img} alt={cat.name} />
                </div>
                <div className="category-card-info">
                  <h4 className="cat-card-title">{cat.name}</h4>
                  <div className="cat-card-meta">
                    <span className="cat-brand-count">{cat.brands} Brands</span>
                    <span className="cat-price-from">From ₹{cat.from}</span>
                  </div>
                  <button className="cat-explore-btn">
                    Explore <ChevronRight size={14} />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Brands Section */}
        <section className="landing-section">
          <div className="section-title-row">
            <h3>Shop by Brand</h3>
          </div>
          <div className="brands-horizontal-scroll">
            {BRANDS.map(brand => (
              <Link to={`/brand/${brand.name}`} key={brand.name} className="brand-tile">
                <div className="brand-logo-box">
                  <img src={brand.logo} alt={brand.name} onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.name)}&background=f1f5f9&color=000&bold=true`;
                  }} />
                </div>
                <span>{brand.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular Demand Section */}
        {popularProducts.length > 0 && (
          <section className="landing-section">
            <div className="section-title-row space-between">
              <h3>Popular Demand</h3>
              <Link to="/products" className="see-all-link">
                See all <ChevronRight size={16} />
              </Link>
            </div>
            <div className="popular-horizontal-scroll">
              {popularProducts.map(product => (
                <div key={product._id} className="popular-item-wrapper">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}

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

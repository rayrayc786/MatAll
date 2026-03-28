import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight
} from 'lucide-react';
import './home.css';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const ENRICHED_CATEGORIES = [
  { id: '03', name: 'Wooden & Boards', brands: 12, from: 105, img: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=80&w=400', desc: 'Premium Plywood, Boards & Laminates' },
  { id: '04', name: 'Electricals', brands: 8, from: 45, img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400', desc: 'Wires, Switches & Lighting' },
  { id: '22', name: 'Hardware', brands: 15, from: 15, img: 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?auto=format&fit=crop&q=80&w=400', desc: 'Hinges, Locks & Modular Fittings' },
  { id: '06', name: 'Paint & POP', brands: 6, from: 250, img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400', desc: 'Wall Paints, POP & Tools' },
  { id: 'tiles', name: 'Tiles & Flooring', brands: 10, from: 35, img: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&q=80&w=400', desc: 'Floor Tiles & Wall Cladding' },
  { id: 'tools', name: 'Power Tools', brands: 20, from: 99, img: 'https://images.unsplash.com/photo-1504194103403-99b4561ed21d?auto=format&fit=crop&q=80&w=400', desc: 'Drills, Saws & Hand Tools' },
];

const BRANDS = [
  { name: 'Century Ply', logo: 'https://ui-avatars.com/api/?name=CP&background=1e293b&color=fff&bold=true' },
  { name: 'Greenlam', logo: 'https://ui-avatars.com/api/?name=GL&background=1e293b&color=fff&bold=true' },
  { name: 'Polycab', logo: 'https://ui-avatars.com/api/?name=PC&background=1e293b&color=fff&bold=true' },
  { name: 'Havells', logo: 'https://ui-avatars.com/api/?name=HV&background=1e293b&color=fff&bold=true' },
  { name: 'Asian Paints', logo: 'https://ui-avatars.com/api/?name=AP&background=1e293b&color=fff&bold=true' },
  { name: 'Astral', logo: 'https://ui-avatars.com/api/?name=AS&background=1e293b&color=fff&bold=true' },
  { name: 'Jaquar', logo: 'https://ui-avatars.com/api/?name=JQ&background=1e293b&color=fff&bold=true' },
  { name: 'UltraTech', logo: 'https://ui-avatars.com/api/?name=UT&background=1e293b&color=fff&bold=true' },
];

const OFFERS = [
  { id: 1, title: 'Plyboard + Modular Hardware', discount: 'Flat 20% OFF', img: 'https://images.unsplash.com/photo-1623057000739-386c8d66717a?auto=format&fit=crop&q=80&w=400' },
  { id: 2, title: 'POP Channel + Mesh + POP', discount: 'Combo Deal ₹2999', img: 'https://images.unsplash.com/photo-1589481169991-40ee028883cd?auto=format&fit=crop&q=80&w=400' },
  { id: 3, title: 'Wire + Switch + Lamp', discount: 'Upto 40% OFF', img: 'https://images.unsplash.com/photo-1558402529-d2638a7023e9?auto=format&fit=crop&q=80&w=400' },
];

const Home: React.FC = () => {
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
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
            {ENRICHED_CATEGORIES.map(cat => {
              const slug = cat.name.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-');
              return (
                <Link to={`/category/${slug}`} key={cat.name} className="category-modern-card">
                  <div className="category-card-img-box">
                    <img src={cat.img} alt={cat.name} />
                  </div>
                  <div className="category-card-info">
                    <h4 className="cat-card-title">{cat.name}</h4>
                    <div className="cat-card-meta">
                      <span className="cat-brand-count">{cat.brands} Brands</span>
                      <span className="cat-price-from">From ₹{cat.from}</span>
                    </div>
                    <span className="cat-explore-btn">
                      Explore <ChevronRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
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
    </main>
  );
};

export default Home;

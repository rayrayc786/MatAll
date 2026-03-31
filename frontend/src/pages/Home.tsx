import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight
} from 'lucide-react';
import './home.css';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { getFullImageUrl } from '../utils/imageUrl';

// Featured categories will be fetched from API

// Featured brands will be fetched from API



const Home: React.FC = () => {
  const navigate = useNavigate();
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const [featuredBrands, setFeaturedBrands] = useState<any[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<any[]>([]);
  const [dynamicOffers, setDynamicOffers] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const popRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products?isPopular=true`);
        setPopularProducts(popRes.data || []);
      } catch (err) {
        console.error('Error fetching popular products:', err);
      }

      try {
        const brandsRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/brands?isFeatured=true`);
        setFeaturedBrands(Array.isArray(brandsRes.data) ? brandsRes.data : []);
      } catch (err) {
        console.error('Error fetching featured brands:', err);
      }

      try {
        const catsRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/categories?isFeatured=true`);
        setFeaturedCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
      } catch (err) {
        console.error('Error fetching featured categories:', err);
      }

      try {
        const offersRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/offers`);
        setDynamicOffers(Array.isArray(offersRes.data) ? offersRes.data : []);
      } catch (err) {
        console.error('Error fetching dynamic offers:', err);
      }
    };
    fetchData();
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
            {featuredCategories.length > 0 ? (
              featuredCategories.map(cat => {
                const catImg = getFullImageUrl(cat.imageUrl);
                  
                return (
                  <Link to={`/products?category=${encodeURIComponent(cat.name)}`} key={cat._id} className="category-modern-card">
                    <div className="category-card-img-box">
                      <img src={catImg} alt={cat.name} />
                    </div>
                    <div className="category-card-info">
                      <h4 className="cat-card-title">{cat.name}</h4>
                      <div className="cat-card-meta">
                        <span className="cat-brand-count">Explore Quality</span>
                      </div>
                      <span className="cat-explore-btn">
                        Shop Now <ChevronRight size={14} />
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#64748b' }}>No featured categories set by admin</p>
            )}
          </div>
        </section>

        {/* Brands Section */}
        <section className="landing-section">
          <div className="section-title-row">
            <h3>Shop by Brand</h3>
          </div>
          <div className="brands-horizontal-scroll">
            {featuredBrands.length > 0 ? (
              featuredBrands.map(brand => (
                <Link to={`/brand/${brand.name}`} key={brand._id} className="brand-tile">
                  <div className="brand-logo-box">
                    <img src={getFullImageUrl(brand.logoUrl)} alt={brand.name} />
                  </div>
                  <span>{brand.name}</span>
                </Link>
              ))
            ) : (
              <p style={{ padding: '1rem', color: '#64748b' }}>No featured brands available</p>
            )}
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
            {dynamicOffers.length > 0 ? (
              dynamicOffers.map(offer => {
                const offerImg = getFullImageUrl(offer.imageUrl);
                  
                return (
                  <div key={offer._id} className="offer-card" onClick={() => offer.link && navigate(offer.link)} style={{ cursor: offer.link ? 'pointer' : 'default' }}>
                    <div className="offer-img-box">
                      <img src={offerImg} alt={offer.title} />
                      {offer.discount && <div className="offer-badge">{offer.discount}</div>}
                    </div>
                    <div className="offer-details">
                      <h4>{offer.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>{offer.description}</p>
                      <button className="shop-now-btn">Shop Now</button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ padding: '2rem', color: '#64748b' }}>No active offers at the moment.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Home;

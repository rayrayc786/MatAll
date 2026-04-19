import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight
} from 'lucide-react';
import './home.css';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { getFullImageUrl } from '../utils/imageUrl';
import SEO from '../components/SEO';

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
        const [popRes, brandsRes, catsRes, offersRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products?isPopular=true`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/brands?isFeatured=true`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/categories?isFeatured=true`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/offers`)
        ]);

        setPopularProducts(popRes.data.products || popRes.data || []);
        setFeaturedBrands(Array.isArray(brandsRes.data) ? brandsRes.data : []);
        setFeaturedCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
        setDynamicOffers(Array.isArray(offersRes.data) ? offersRes.data : []);
      } catch (err) {
        console.error('Error fetching home data:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="landing-container">
      <SEO 
        title="Home" 
        description="Your one-stop shop for home repair supplies, delivered within 60 mins." 
      />
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
                      <img 
                        src={catImg} 
                        alt={cat.name} 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
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
              <div className="brands-track">
                {[...featuredBrands, ...featuredBrands].map((brand, index) => (
                  <Link to={`/products?brand=${encodeURIComponent(brand.name)}`} key={`${brand._id}-${index}`} className="brand-tile">
                    <div className="brand-logo-box">
                      {brand.logoUrl && (
                        <img 
                          src={getFullImageUrl(brand.logoUrl)} 
                          alt={brand.name} 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            const fallback = parent?.querySelector('.brand-initials');
                            if (fallback) (fallback as HTMLElement).style.display = 'flex';
                          }}
                        />
                      )}
                      <div 
                        className="brand-initials"
                        style={{ display: brand.logoUrl ? 'none' : 'flex' }}
                      >
                        {brand.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <span>{brand.name}</span>
                  </Link>
                ))}
              </div>
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
                      <img 
                        src={offerImg} 
                        alt={offer.title} 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
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

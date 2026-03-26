import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Home, ChevronRight } from 'lucide-react';
import './sub-category.css';

const SubCategoryPage: React.FC = () => {
  const { id } = useParams();
  const [categoryName, setCategoryName] = useState('Category');
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [quickLinks, setQuickLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: products } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products?category=${id}`);
        
        if (products.length > 0) {
          setCategoryName(products[0].category || 'Category');
        }

        const uniqueSubs = Array.from(new Set(products.map((p: any) => p.subCategory))).filter(Boolean);
        
        const subData = uniqueSubs.map(sub => {
          const subProducts = products.filter((p: any) => p.subCategory === sub);
          const brands = new Set(subProducts.map((p: any) => p.brand));
          const minPrice = Math.min(...subProducts.map((p: any) => p.price));
          const unit = subProducts[0]?.unitLabel || 'sq.ft';
          
          return {
            name: sub,
            image: subProducts[0]?.imageUrl || 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400',
            brandCount: brands.size,
            startingRate: minPrice,
            unit: unit
          };
        });

        setSubCategories(subData);
        setQuickLinks(['Plywood', 'Hardware', 'Laminate', 'Tools', 'Electrical']);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  return (
    <div className="sub-category-page">
      <header className="sub-cat-header">
        <div className="header-nav">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title-box">
            <h2>{categoryName}</h2>
            <span>Material</span>
          </div>
          <Link to="/" className="home-btn-link">
            <Home size={24} />
          </Link>
        </div>

        <div className="quick-links-carousel">
          <div className="main-content-responsive ql-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: 0 }}>
            <span className="ql-label">Quick Links</span>
            <div className="ql-track">
              {quickLinks.map((link, idx) => (
                <div key={idx} className="ql-item">{link}</div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="sub-cat-content">
        {loading ? (
          <div className="loading-box">Finding best materials...</div>
        ) : (
          <div className="sub-cat-grid-3xN">
            {subCategories.map((sub, idx) => (
              <Link 
                to={`/products?category=${id}&subCategory=${sub.name}`} 
                key={idx} 
                className="sub-cat-card"
              >
                <div className="sub-cat-img-box">
                  <img src={sub.image} alt={sub.name} />
                </div>
                <div className="sub-cat-info">
                  <h3>{sub.name}</h3>
                  <div className="sub-cat-meta">
                    <span className="meta-brands">{sub.brandCount} Brands</span>
                    <span className="meta-rate">From ₹{sub.startingRate}</span>
                  </div>
                  <button className="explore-btn">
                    Explore <ChevronRight size={12} />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SubCategoryPage;

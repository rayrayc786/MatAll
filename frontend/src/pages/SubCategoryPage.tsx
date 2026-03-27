import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Home, ArrowUpDown, Filter } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import './sub-category.css';

const SubCategoryPage: React.FC = () => {
  const { id } = useParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubCat, setSelectedSubCat] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('default'); // 'price-low', 'price-high'
  const [categoryName, setCategoryName] = useState('Category');
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [quickLinks, setQuickLinks] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products?category=${id}`);
        setProducts(data);
        
        if (data.length > 0) {
          const catMap: {[key: string]: string} = {
            '03': 'Wooden & Boards',
            '04': 'Electricals',
            '22': 'Hardware',
            '06': 'Paint & POP',
            'tiles': 'Tiles & Flooring',
            'tools': 'Power Tools'
          };
          setCategoryName(catMap[id || ''] || data[0].category || 'Category');
        }

        // Extract unique subcategories from products
        const uniqueSubs = Array.from(new Set(data.map((p: any) => p.subCategory))).filter(Boolean);
        const subData = uniqueSubs.map(sub => {
          const firstProd = data.find((p: any) => p.subCategory === sub);
          return {
            name: sub,
            image: firstProd?.imageUrl || 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=400',
          };
        });
        setSubCategories(subData);

        setQuickLinks([
          { name: 'Hinges', link: '/products?category=22&subCategory=Hinges' },
          { name: 'Channels', link: '/products?category=22&subCategory=Channels' },
          { name: 'Adhesives', link: '/products?category=22&subCategory=Adhesives' },
          { name: 'Tools', link: '/products?category=tools' }
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const filteredProducts = useMemo(() => {
    let result = selectedSubCat 
      ? products.filter(p => p.subCategory === selectedSubCat)
      : [...products];
      
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    }
    
    return result;
  }, [products, selectedSubCat, sortBy]);

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

        {/* Similar Products (Shop by Category) Row */}
        <div className="quick-links-carousel">
          <div className="main-content-responsive ql-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: 0 }}>
            <span className="ql-label">Similar Products</span>
            <div className="ql-track">
              {quickLinks.map((item: any, idx) => (
                <Link key={idx} to={item.link} className="ql-item">{item.name}</Link>
              ))}
            </div>
          </div>
        </div>
        <div className="horizontal-filters-bar main-content-responsive">
          <div className="filter-group">
            <button 
              className={`filter-chip-pill ${sortBy !== 'default' ? 'active' : ''}`}
              onClick={() => setSortBy(sortBy === 'price-low' ? 'price-high' : 'price-low')}
            >
              <ArrowUpDown size={14} /> 
              Sort: {sortBy === 'price-low' ? 'Low to High' : sortBy === 'price-high' ? 'High to Low' : 'Price'}
            </button>
            <button className="filter-chip-pill">
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>
      </header>

      <main className="sub-cat-main-layout main-content-responsive">
        {/* Sidebar: Sub-Categories */}
        <aside className="cat-sidebar">
          <div 
            className={`cat-sidebar-item ${selectedSubCat === null ? 'active' : ''}`}
            onClick={() => setSelectedSubCat(null)}
          >
            <div className="cat-sidebar-img">
              <div className="cat-all-icon">All</div>
            </div>
            <span>All {categoryName}</span>
          </div>
          {subCategories.map((sub, idx) => (
            <div 
              key={idx} 
              className={`cat-sidebar-item ${selectedSubCat === sub.name ? 'active' : ''}`}
              onClick={() => setSelectedSubCat(sub.name)}
            >
              <div className="cat-sidebar-img">
                <img src={sub.image} alt={sub.name} />
              </div>
              <span>{sub.name}</span>
            </div>
          ))}
        </aside>

        {/* Main Content: Products */}
        <section className="cat-product-results">
          {loading ? (
            <div className="loading-box">Finding best deals...</div>
          ) : filteredProducts.length > 0 ? (
            <div className="cat-grid-standard">
              {filteredProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="no-products">No products found for this category.</div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SubCategoryPage;

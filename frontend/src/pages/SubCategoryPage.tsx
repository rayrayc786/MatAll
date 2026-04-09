import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Home, ArrowUpDown, Filter } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import './sub-category.css';
import SEO from '../components/SEO';
import { getFullImageUrl } from '../utils/imageUrl';
const SLUG_MAP: {[key: string]: string} = {
  'wooden-boards': 'Wooden & Boards',
  'electricals': 'Electricals',
  'hardware': 'Hardware',
  'paint-pop': 'Paint & POP',
  'tiles-flooring': 'Tiles & Flooring',
  'power-tools': 'Power Tools',
  'hand-tools': 'Hand Tools',
  'sanitaryware': 'Sanitaryware',
  'pipes-fittings': 'Pipes & Fittings',
  'safety-gear': 'Safety Gear',
  'kitchen-hardware': 'Kitchen Hardware',
  'adhesives-sealants': 'Adhesives & Sealants',
  'screws-nails': 'Screws & Nails',
  'modular-fittings': 'Modular Fittings',
  'garden-outdoor': 'Garden & Outdoor',
  'home-automation': 'Home Automation',
  'solar-products': 'Solar Products',
  'glass-glazing': 'Glass & Glazing',
  'wall-cladding': 'Wall Cladding',
  'door-window': 'Door & Window',
  'bath-fittings': 'Bath Fittings',
  'locks-security': 'Locks & Security',
  'wires-cables': 'Wires & Cables',
  'plumbing': 'Plumbing',
  'civil': 'Civil'
};

const SubCategoryPage: React.FC = () => {
  const { categoryName: slug } = useParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubCat, setSelectedSubCat] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('default');
  const [displayCategory, setDisplayCategory] = useState('Category');
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dbCategoryName = SLUG_MAP[slug || ''] || slug;
        const encodedCat = encodeURIComponent(dbCategoryName || '');
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products?category=${encodedCat}`);
        
        setProducts(data);
        setDisplayCategory(dbCategoryName || 'Category');

        // Extract unique subcategories
        const uniqueSubs = Array.from(new Set(data.map((p: any) => p.subCategory))).filter(Boolean);
        const subData = uniqueSubs.map(sub => {
          const firstProd = data.find((p: any) => p.subCategory === sub);
          return {
            name: sub,
            image: firstProd?.imageUrl ? getFullImageUrl(firstProd.imageUrl) : 'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?auto=format&fit=crop&q=80&w=200',
          };
        });
        setSubCategories(subData);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

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
      <SEO 
        title={displayCategory} 
        description={`Browse ${displayCategory} construction materials on MatAll. Quality supplies for your building needs, delivered in 60 minutes.`} 
      />
      <header className="sub-cat-header-v2">
        <div className="main-content-responsive header-content-box">
          <div className="header-nav-v2">
            <button className="back-btn-v2" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </button>
            <div className="title-section">
              <h2 className="main-category-title">{displayCategory}</h2>
              <p className="subtitle-material">Material Collection</p>
            </div>
            <Link to="/" className="home-btn-v2"><Home size={20} /></Link>
          </div>
          
          <div className="filter-row-v2">
            <button 
              className={`filter-pill ${sortBy !== 'default' ? 'active' : ''}`}
              onClick={() => setSortBy(sortBy === 'price-low' ? 'price-high' : 'price-low')}
            >
              <ArrowUpDown size={14} /> 
              {sortBy === 'price-low' ? 'Low to High' : sortBy === 'price-high' ? 'High to Low' : 'Price'}
            </button>
            <button className="filter-pill"><Filter size={14} /> Filters</button>
          </div>
        </div>
      </header>

      <main className="sub-cat-main-layout main-content-responsive" style={{ minHeight: '600px' }}>
        {/* Sidebar: Categories */}
        <aside className="cat-sidebar-v2">
          <div 
            className={`cat-sidebar-item-v2 ${selectedSubCat === null ? 'active' : ''}`}
            onClick={() => setSelectedSubCat(null)}
          >
            <div className="cat-img-v2">
              <div className="all-icon-v2">All</div>
            </div>
            <span className="cat-label-v2">All {displayCategory}</span>
          </div>
          
          {subCategories.map((sub, idx) => (
            <div 
              key={idx} 
              className={`cat-sidebar-item-v2 ${selectedSubCat === sub.name ? 'active' : ''}`}
              onClick={() => setSelectedSubCat(sub.name)}
            >
              <div className="cat-img-v2">
                <img src={sub.image} alt={sub.name} />
              </div>
              <span className="cat-label-v2">{sub.name}</span>
            </div>
          ))}
        </aside>

        {/* Results Area */}
        <section className="results-grid-v2">
          {loading ? (
            <div className="loading-state-v2">
              <div className="skeleton-grid">
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card"></div>)}
              </div>
              <p>Fetching best materials for you...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="product-grid-v2">
              {filteredProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-state-v2">
              <h3>No items found</h3>
              <p>We couldn't find any products in {displayCategory} at the moment.</p>
              <button onClick={() => navigate('/')} className="browse-home-btn">Browse Home</button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SubCategoryPage;

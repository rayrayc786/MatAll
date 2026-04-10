import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './site-footer.css';

const SiteFooter: React.FC = () => {
  const [categories, setCategories] = React.useState<any[]>([
    { _id: 'fallback-1', name: 'BATHROOM', isActive: true },
    { _id: 'fallback-2', name: 'CEILING', isActive: true },
    { _id: 'fallback-3', name: 'ELECTRICAL MATERIAL', isActive: true },
    { _id: 'fallback-4', name: 'MODULAR HARDWARE', isActive: true }
  ]);
  const [subCategories, setSubCategories] = React.useState<any[]>([
    { _id: 's1', name: 'Door Hook/ Cloth Hook', categoryId: 'fallback-1', isActive: true },
    { _id: 's2', name: 'Jet Spray', categoryId: 'fallback-1', isActive: true },
    { _id: 's3', name: 'Dry Wall Screw', categoryId: 'fallback-2', isActive: true },
    { _id: 's4', name: 'Fasteners', categoryId: 'fallback-2', isActive: true },
    { _id: 's5', name: 'GI Wire Mesh (Jaali)', categoryId: 'fallback-2', isActive: true },
    { _id: 's6', name: 'Gypsum Board', categoryId: 'fallback-2', isActive: true },
    { _id: 's7', name: 'POP', categoryId: 'fallback-2', isActive: true },
    { _id: 's8', name: 'COB Light', categoryId: 'fallback-3', isActive: true },
    { _id: 's9', name: 'Ceiling Lights', categoryId: 'fallback-3', isActive: true },
    { _id: 's10', name: 'Clip', categoryId: 'fallback-3', isActive: true },
    { _id: 's11', name: 'Fan', categoryId: 'fallback-3', isActive: true },
    { _id: 's12', name: 'Flexible Pipe', categoryId: 'fallback-3', isActive: true },
    { _id: 's13', name: 'Box Profile', categoryId: 'fallback-4', isActive: true },
    { _id: 's14', name: 'Cabinet Edge Profile', categoryId: 'fallback-4', isActive: true },
    { _id: 's15', name: 'Channels', categoryId: 'fallback-4', isActive: true },
    { _id: 's16', name: 'Common Accessories', categoryId: 'fallback-4', isActive: true },
    { _id: 's17', name: 'Door Edge Profile', categoryId: 'fallback-4', isActive: true }
  ]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, subsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/categories`),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/sub-categories`)
        ]);
        if (catsRes.data && catsRes.data.length > 0) {
          setCategories(catsRes.data.filter((c: any) => c.isActive));
        }
        if (subsRes.data && subsRes.data.length > 0) {
          setSubCategories(subsRes.data.filter((s: any) => s.isActive));
        }
      } catch (err) {
        console.error('Failed to fetch footer data', err);
      }
    };
    fetchData();
  }, []);

  const usefulLinks = [
    { label: 'Shop', path: '/products' },
    { label: 'Support', path: '/support' },
    { label: 'Wishlist', path: '/wishlist' },
    { label: 'Orders', path: '/orders' },
    { label: 'Profile', path: '/profile' },
    // Pages to be enabled later
    { label: 'About', path: '/about', hidden: true },
    { label: 'Team', path: '/team', hidden: true },
    { label: 'Careers', path: '/careers', hidden: true },
    { label: 'MatAll Policies', path: '/MatAll_Policies.pdf', isStatic: true },
    { label: 'Terms of Service', path: '/terms-of-service', hidden: true },
    { label: 'Refund Policy', path: '/refund-policy', hidden: true }
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        {/* Column 1: Useful Links */}
        <div className="footer-links-column">
          <h3 className="footer-sub-title">Useful Links</h3>
          <ul className="footer-links-list">
            {usefulLinks.filter(link => !link.hidden).map((link: any, idx) => (
              <li key={idx}>
                {link.isStatic ? (
                  <a href={link.path} target="_blank" rel="noopener noreferrer">{link.label}</a>
                ) : (
                  <Link to={link.path}>{link.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Dynamic Category Columns */}
        {categories.slice(0, 4).map(cat => {
          const catSubs = subCategories.filter(s => s.categoryId?._id === cat._id || s.categoryId === cat._id).slice(0, 5);
          return (
            <div key={cat._id} className="footer-links-column">
              <h3 className="footer-sub-title">{cat.name}</h3>
              <ul className="footer-links-list">
                {catSubs.map(sub => (
                  <li key={sub._id}>
                    <Link to={`/products?category=${encodeURIComponent(cat.name)}&subCategory=${encodeURIComponent(sub.name)}`}>
                      {sub.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to={`/products?category=${encodeURIComponent(cat.name)}`} className="see-more-link">See all {cat.name}</Link>
                </li>
              </ul>
            </div>
          );
        })}
      </div>
      
      <div className="footer-copyright-bar">
        <div className="footer-copyright-content">
          © 2026 | MatAll App by Adventitous Solutions Private Limited
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;

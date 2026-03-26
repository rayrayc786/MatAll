import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Share2 } from 'lucide-react';
import './footer.css';

const Footer: React.FC = () => {
  const categories = [
    { name: 'Wooden', id: '03' },
    { name: 'Electrical', id: '04' },
    { name: 'Plumbing', id: '05' },
    { name: 'Paint & POP', id: '06' },
    { name: 'Hardware', id: '22' },
    { name: 'Civil', id: '26' },
    { name: 'Tiles & Flooring', id: 'tiles' },
    { name: 'Tools', id: 'tools' },
    { name: 'Miscellaneous', id: 'misc' }
  ];

  const usefulLinks = [
    ['Blog', 'Privacy', 'Terms', 'FAQs', 'Security', 'Contact'],
    ['Partner', 'Franchise', 'Seller', 'Warehouse', 'Deliver', 'Resources']
  ];

  return (
    <footer className="main-site-footer">
      <div className="footer-container main-content-responsive">
        <div className="footer-top-section">
          <div className="footer-column useful-links-column">
            <h3>Useful Links</h3>
            <div className="useful-links-grid">
              {usefulLinks.map((group, gIdx) => (
                <ul key={gIdx}>
                  {group.map(link => (
                    <li key={link}><Link to={`/${link.toLowerCase()}`}>{link}</Link></li>
                  ))}
                </ul>
              ))}
            </div>
          </div>

          <div className="footer-column categories-column">
            <h3>Categories <Link to="/products" className="see-all-green">see all</Link></h3>
            <div className="categories-links-grid">
              <ul>
                {categories.slice(0, 5).map(cat => (
                  <li key={cat.id}><Link to={`/category/${cat.id}`}>{cat.name}</Link></li>
                ))}
              </ul>
              <ul>
                {categories.slice(5).map(cat => (
                  <li key={cat.id}><Link to={`/category/${cat.id}`}>{cat.name}</Link></li>
                ))}
              </ul>
              <ul>
                 <li><Link to="/products">All Materials</Link></li>
                 <li><Link to="/brands">Shop by Brand</Link></li>
                 <li><Link to="/offers">Special Offers</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="copyright-text">
            © MatAll Commerce Private Limited, 2024-2026
          </div>
          
          <div className="app-download-section">
            <span className="download-label">Download App</span>
            <div className="app-buttons">
              <a href="#" className="app-btn">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" />
              </a>
              <a href="#" className="app-btn">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" />
              </a>
            </div>
          </div>

          <div className="social-links">
            <a href="#" className="social-icon"><Facebook size={20} fill="currentColor" /></a>
            <a href="#" className="social-icon"><Twitter size={20} fill="currentColor" /></a>
            <a href="#" className="social-icon"><Instagram size={20} /></a>
            <a href="#" className="social-icon"><Linkedin size={20} fill="currentColor" /></a>
            <a href="#" className="social-icon"><Share2 size={20} /></a>
          </div>
        </div>

        <div className="footer-disclaimer">
          "MatAll" is owned & managed by "MatAll Commerce Private Limited" and is not related, linked or interconnected in whatsoever manner or nature, to any other industrial supply services business.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

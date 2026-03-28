import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, MessageCircle } from 'lucide-react';
import './site-footer.css';

const SiteFooter: React.FC = () => {
  const usefulLinks = [
    {
      title: 'Company',
      links: [
        { label: 'About Us', path: '/about' },
        { label: 'Blog', path: '/blog' },
        { label: 'Careers', path: '/careers' },
        { label: 'Contact', path: '/support' }
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', path: '/support' },
        { label: 'FAQs', path: '/support' },
        { label: 'Security', path: '/security' },
        { label: 'Mobile Apps', path: '/mobile-apps' }
      ]
    },
    {
      title: 'Policy',
      links: [
        { label: 'Privacy', path: '/privacy' },
        { label: 'Terms', path: '/terms' },
        { label: 'Delivery', path: '/delivery' },
        { label: 'Resources', path: '/resources' }
      ]
    }
  ];

  const categories = [
    { name: 'Wooden & Boards', slug: 'wooden-boards' },
    { name: 'Electricals', slug: 'electricals' },
    { name: 'Hardware', slug: 'hardware' },
    { name: 'Paint & POP', slug: 'paint-pop' },
    { name: 'Tiles & Flooring', slug: 'tiles-flooring' },
    { name: 'Power Tools', slug: 'power-tools' },
    { name: 'Hand Tools', slug: 'hand-tools' },
    { name: 'Sanitaryware', slug: 'sanitaryware' },
    { name: 'Pipes & Fittings', slug: 'pipes-fittings' },
    { name: 'Safety Gear', slug: 'safety-gear' },
    { name: 'Kitchen Hardware', slug: 'kitchen-hardware' },
    { name: 'Adhesives & Sealants', slug: 'adhesives-sealants' },
    { name: 'Screws & Nails', slug: 'screws-nails' },
    { name: 'Modular Fittings', slug: 'modular-fittings' },
    { name: 'Garden & Outdoor', slug: 'garden-outdoor' },
    { name: 'Home Automation', slug: 'home-automation' },
    { name: 'Solar Products', slug: 'solar-products' },
    { name: 'Glass & Glazing', slug: 'glass-glazing' },
    { name: 'Wall Cladding', slug: 'wall-cladding' },
    { name: 'Door & Window', slug: 'door-window' },
    { name: 'Bath Fittings', slug: 'bath-fittings' },
    { name: 'Locks & Security', slug: 'locks-security' },
    { name: 'Wires & Cables', slug: 'wires-cables' },
    { name: 'Plumbing', slug: 'plumbing' }
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        {/* Useful Links Section */}
        <div className="footer-useful-links">
          <h3 className="footer-section-title">Useful Links</h3>
          <div className="useful-links-grid">
            {usefulLinks.map((section, idx) => (
              <div key={idx} className="footer-links-column">
                <h4 className="footer-sub-title">{section.title}</h4>
                <ul className="footer-links-list">
                  {section.links.map(link => (
                    <li key={link.label}>
                      <Link to={link.path}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div className="footer-categories">
          <h3 className="footer-section-title">
            Categories <Link to="/products" className="see-all-btn">see all</Link>
          </h3>
          <div className="categories-grid">
            <ul className="footer-links-list">
              {categories.slice(0, 8).map(cat => (
                <li key={cat.slug}><Link to={`/category/${cat.slug}`}>{cat.name}</Link></li>
              ))}
            </ul>
            <ul className="footer-links-list">
              {categories.slice(8, 16).map(cat => (
                <li key={cat.slug}><Link to={`/category/${cat.slug}`}>{cat.name}</Link></li>
              ))}
            </ul>
            <ul className="footer-links-list">
              {categories.slice(16, 24).map(cat => (
                <li key={cat.slug}><Link to={`/category/${cat.slug}`}>{cat.name}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      {/* <div className="footer-bottom-bar">
        <div className="footer-copyright">
          © BuildItQuick Commerce, 2024-{new Date().getFullYear()}
        </div>

        <div className="footer-download-apps">
          <span className="footer-download-label">Download App</span>
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="app-badge" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" className="app-badge" />
        </div>

        <div className="footer-social-icons">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon-circle"><Facebook size={18} /></a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon-circle"><Twitter size={18} /></a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon-circle"><Instagram size={18} /></a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon-circle"><Linkedin size={18} /></a>
          <a href="https://threads.net" target="_blank" rel="noopener noreferrer" className="social-icon-circle"><MessageCircle size={18} /></a>
        </div>
      </div>

      <div className="footer-legal-disclaimer">
        "BuildItQuick" is a premium construction materials marketplace owned and managed by BuildItQuick Commerce Private Limited. All products are sourced from verified manufacturers and distributors.
      </div> */}
    </footer>
  );
};

export default SiteFooter;

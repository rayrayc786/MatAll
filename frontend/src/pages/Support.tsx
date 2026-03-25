import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Home, 
  User, 
  MessageSquare, 
  MessageCircle, 
  Phone, 
  FileText,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Send,
  Mic
} from 'lucide-react';
import './support.css';

const Support: React.FC = () => {
  const navigate = useNavigate();
  const [activeScreen, setActiveTab] = useState<'main' | 'chat' | 'policies'>('main');
  const [activePolicy, setActivePolicy] = useState<string | null>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const POLICIES = [
    { id: 'return', title: 'Returns and Exchange Policy' },
    { id: 'terms', title: 'Terms and Conditions' },
    { id: 'privacy', title: 'Privacy Policy' },
    { id: 'data', title: 'Data protection policy' },
    { id: 'anti', title: 'Whistleblowing & Anticorruption' },
    { id: 'work', title: 'Work with us' },
  ];

  if (activeScreen === 'chat') {
    return (
      <div className="genie-chat-screen">
        <header className="genie-header-sticky">
          <button className="back-btn" onClick={() => setActiveTab('main')}>
            <ArrowLeft size={24} />
          </button>
          <h2>MatAll Genie</h2>
          <Link to="/"><Home size={22} /></Link>
        </header>
        <div className="genie-messages-container">
           <div className="genie-msg bot">
              <div className="msg-bubble-bot">Hello! How can I help you today?</div>
           </div>
           <div className="genie-msg user">
              <div className="msg-bubble-user">I want to track my order</div>
           </div>
           <div className="genie-msg bot">
              <div className="msg-bubble-bot">Sure! Please provide your order ID or check the "History" section in your profile.</div>
           </div>
        </div>
        <footer className="genie-input-area">
           <div className="genie-input-wrapper">
              <input type="text" placeholder="Type your message here..." />
              <div className="input-actions-genie">
                 <Mic size={20} className="mic-icon-genie" />
                 <Send size={20} className="send-icon-genie" />
              </div>
           </div>
        </footer>
      </div>
    );
  }

  if (activeScreen === 'policies') {
    return (
      <div className="policies-screen">
        <header className="genie-header-sticky">
          <button className="back-btn" onClick={() => setActiveTab('main')}>
            <ArrowLeft size={24} />
          </button>
          <h2>Policies & Information</h2>
          <Link to="/"><Home size={22} /></Link>
        </header>
        <div className="policies-list-container">
           {POLICIES.map(p => (
             <div key={p.id} className={`policy-card-prd ${activePolicy === p.id ? 'open' : ''}`}>
                <div className="policy-card-header" onClick={() => setActivePolicy(activePolicy === p.id ? null : p.id)}>
                   <span>{p.title}</span>
                   {activePolicy === p.id ? <ChevronDown size={20} className="rotate-180" /> : <ChevronRight size={20} />}
                </div>
                {activePolicy === p.id && (
                  <div className="policy-card-body animate-fade-in">
                     <p>At MatAll, we prioritize industrial excellence. This {p.title} details our commitment to safety, quality, and transparent logistics for all our construction partners.</p>
                     <button className="read-more-btn-prd">Read full policy</button>
                  </div>
                )}
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="blinkit-support-page">
      <header className="support-header-prd">
        <div className="header-nav-support">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <Link to="/" className="home-btn-link"><Home size={24} /></Link>
        </div>
        
        <div className="support-hero-box">
           <div className="profile-icon-support">
              <User size={32} />
           </div>
           <div className="greeting-text-support">
              <span>Hello, {user.fullName || 'Guest'}</span>
              <h2 className="support-prompt-bold">How can we help?</h2>
           </div>
        </div>
      </header>

      <main className="support-content-prd">
        <div className="support-tiles-grid-prd">
           <div className="support-tile-card" onClick={() => setActiveTab('chat')}>
              <div className="tile-icon-prd yellow">
                 <MessageSquare size={32} />
              </div>
              <div className="tile-label-prd">
                 <span>Chat with us</span>
                 <ChevronRight size={18} />
              </div>
           </div>

           <div className="support-tile-card" onClick={() => window.open('https://wa.me/91XXXXXXXXXX')}>
              <div className="tile-icon-prd yellow">
                 <MessageCircle size={32} />
              </div>
              <div className="tile-label-prd">
                 <span>Chat with us (WhatsApp)</span>
                 <ChevronRight size={18} />
              </div>
           </div>

           <div className="support-tile-card">
              <div className="tile-icon-prd yellow">
                 <Phone size={32} />
              </div>
              <div className="tile-label-prd">
                 <span>Call us (only for bulk order)</span>
                 <ChevronRight size={18} />
              </div>
           </div>

           <div className="support-tile-card" onClick={() => setActiveTab('policies')}>
              <div className="tile-icon-prd yellow">
                 <FileText size={32} />
              </div>
              <div className="tile-label-prd">
                 <span>Read articles / insight</span>
                 <ChevronRight size={18} />
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default Support;

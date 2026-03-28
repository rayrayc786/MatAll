import React from 'react';
import { useNavigate } from 'react-router-dom';
import './reports.css';

interface ReportsProps {
  onTabChange?: (tab: 'dashboard' | 'reports' | 'actions') => void;
  contentOnly?: boolean;
}

const Reports: React.FC<ReportsProps> = ({ onTabChange, contentOnly }) => {
  const navigate = useNavigate();

  const handleNav = (tab: 'dashboard' | 'reports' | 'actions', path: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      navigate(path);
    }
  };

  const reportSections = [
    {
      title: 'Financial',
      reports: [
        {
          id: 'payout-reconciliation',
          type: 'Reports',
          title: 'Payout Reconciliation',
          description: 'Reports to reconcile all receivables and payouts. Reports collated from all payment methods.',
          highlight: true
        },
        {
          id: 'revenue-recognition',
          title: 'Revenue Recognition',
          description: 'Access revenue reports, track trends with charts, and forecast using data',
        }
      ]
    },
    {
      title: 'Analytics',
      reports: [
        {
          id: 'billing-analytics',
          title: 'Billing Analytics',
          description: 'Monitor key categories and invoice metrics like MRR, retention, collections, B2B Account revenue etc',
        },
        {
          id: 'revenue-analytics',
          title: 'Revenue Analytics',
          description: 'Reports about revenue generated per category, per product type, per brand, order size etc',
        }
      ]
    },
    {
      title: 'Support',
      reports: [
        {
          id: 'ticket-analytics',
          title: 'Ticket Analytics',
          description: 'Report on the support tickets or queries raised by customers',
        },
        {
          id: 'feedback-rating',
          title: 'Feedback and Rating',
          description: 'Report on what kind of queries, buying, suggestions, ratings etc.',
        }
      ]
    }
  ];

  const renderContent = () => (
    <main className={`reports-content ${contentOnly ? 'no-padding' : ''}`}>
      {!contentOnly && <h1 className="main-title">Reports</h1>}
      
      {reportSections.map((section, idx) => (
        <section key={idx} className="report-group">
          <h2 className="group-title">{section.title}</h2>
          <div className="reports-list">
            {section.reports.map((report) => (
              <div 
                key={report.id} 
                className={`report-card ${report.highlight ? 'highlighted' : ''}`}
              >
                {report.type && <span className="report-type">{report.type}</span>}
                <h3 className="report-title">{report.title}</h3>
                <p className="report-desc">{report.description}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );

  if (contentOnly) return renderContent();

  return (
    <div className="reports-page">
      <header className="reports-header">
        <span className="header-title">Reports</span>
        <div className="header-dot"></div>
      </header>

      {renderContent()}

      <nav className="reports-bottom-nav">
        <button className="nav-btn" onClick={() => handleNav('dashboard', '/admin')}>
          Dashboard
        </button>
        <button className="nav-btn active">
          Reports
        </button>
        <button className="nav-btn" onClick={() => handleNav('actions', '/actions')}>
          Actions
        </button>
      </nav>
    </div>
  );
};

export default Reports;

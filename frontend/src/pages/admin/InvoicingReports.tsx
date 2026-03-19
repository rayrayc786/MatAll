import React, { useState, useEffect } from 'react';
import { FileText, Download, CreditCard } from 'lucide-react';
import axios from 'axios';

const InvoicingReports: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/orders`);
        setOrders(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrders();
  }, []);

  const totalGMV = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalGST = totalGMV * 0.18; // 18% GST
  const pendingPayouts = orders.filter(o => o.status === 'delivered').length * 50; // ₹50 per delivery mock

  if (loading) return <div className="content">Loading financial reports...</div>;

  return (
    <main className="content invoicing-reports">
      <header className="admin-header space-between">
        <div className="title-group">
          <h1>Invoicing & Financial Reports</h1>
          <p>GST-compliant invoice generation & driver payouts</p>
        </div>
        <button className="secondary-btn"><Download size={16} /> Export Financial Year Report</button>
      </header>

      <div className="reports-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <section className="finance-summary card" style={{ display: 'flex', gap: '20px', padding: '20px' }}>
          <div className="finance-item" style={{ flex: 1 }}>
            <span className="label" style={{ fontSize: '12px', color: '#64748b' }}>Total Tax Collected (GST 18%)</span>
            <div className="value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>₹{totalGST.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="finance-item" style={{ flex: 1 }}>
            <span className="label" style={{ fontSize: '12px', color: '#64748b' }}>Driver Payouts (Est. Pending)</span>
            <div className="value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>₹{pendingPayouts.toLocaleString()}</div>
          </div>
          <div className="finance-item" style={{ flex: 1 }}>
            <span className="label" style={{ fontSize: '12px', color: '#64748b' }}>Gross Merch Value (GMV)</span>
            <div className="value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>₹{totalGMV.toLocaleString()}</div>
          </div>
        </section>

        <section className="payout-tracker card" style={{ padding: '20px' }}>
          <h3><CreditCard size={18} /> Driver Payout Tracker</h3>
          <div className="payout-list" style={{ marginTop: '15px' }}>
            {orders.filter(o => o.status === 'delivered').slice(0, 3).map(order => (
              <div key={order._id} className="payout-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <div className="driver-info">
                  <strong>Driver ID: {order._id.slice(-4)}</strong>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Order #BID-{order._id.slice(-6).toUpperCase()}</div>
                </div>
                <div className="amount" style={{ fontWeight: 'bold' }}>₹50.00</div>
                <button className="status-btn" style={{ padding: '4px 12px' }}>Settle</button>
              </div>
            ))}
          </div>
        </section>

        <section className="invoice-list card" style={{ gridColumn: '1 / span 2', padding: '20px' }}>
          <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3>Recent Automated Invoices</h3>
            <button className="secondary-btn" style={{ padding: '5px 10px', fontSize: '12px' }}><Download size={14} /> Export All (CSV)</button>
          </div>
          <div className="table-responsive">
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '12px' }}>Invoice ID</th>
                  <th style={{ padding: '12px' }}>Client / Jobsite</th>
                  <th style={{ padding: '12px' }}>Base Amount</th>
                  <th style={{ padding: '12px' }}>GST (18%)</th>
                  <th style={{ padding: '12px' }}>Total Amount</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>INV-{order._id.slice(-6).toUpperCase()}</td>
                    <td style={{ padding: '12px' }}>{order.deliveryAddress?.name || 'Standard Delivery'}</td>
                    <td style={{ padding: '12px' }}>₹{order.totalAmount.toFixed(2)}</td>
                    <td style={{ padding: '12px' }}>₹{(order.totalAmount * 0.18).toFixed(2)}</td>
                    <td style={{ padding: '12px' }}><strong>₹{(order.totalAmount * 1.18).toFixed(2)}</strong></td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge-status ${order.status}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', background: '#e0f2fe', color: '#0369a1' }}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button className="icon-btn" title="View PDF Invoice"><FileText size={16} /></button>
                      <button className="icon-btn" title="Email to Client"><Download size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
};

export default InvoicingReports;

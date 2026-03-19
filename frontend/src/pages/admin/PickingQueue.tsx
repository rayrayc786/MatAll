import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle2, Truck, Timer, Box, ListChecks } from 'lucide-react';
import axios from 'axios';

const PickingQueue: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get('http://localhost:3000/api/orders');
      setOrders(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10s poll
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'pending') nextStatus = 'picking';
    else if (currentStatus === 'picking') nextStatus = 'packing';
    else if (currentStatus === 'packing') nextStatus = 'handover-ready';
    else if (currentStatus === 'handover-ready') nextStatus = 'dispatched';
    else if (currentStatus === 'dispatched') nextStatus = 'delivered';

    if (!nextStatus) return;

    try {
      await axios.patch(`http://localhost:3000/api/admin/orders/${orderId}/status`, { status: nextStatus });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const getLaneOrders = (statuses: string[]) => orders.filter(o => statuses.includes(o.status));

  if (loading) return <div className="content">Loading fulfillment queue...</div>;

  return (
    <main className="content picking-queue">
      <header className="admin-header">
        <h1>Fulfillment/Picking Queue</h1>
        <p>Real-time order fulfillment pipeline across dark stores</p>
      </header>

      <div className="queue-lanes" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <div className="lane card">
          <h3><Timer size={18} /> New & Picking ({getLaneOrders(['pending', 'picking']).length})</h3>
          <div className="order-cards">
            {getLaneOrders(['pending', 'picking']).map(order => (
              <div key={order._id} className="order-pick-card">
                <div className="card-header">
                  <strong>#BID-{order._id.slice(-6).toUpperCase()}</strong>
                  <span className={`status-badge ${order.status}`}>{order.status}</span>
                </div>
                <div className="card-body">
                  <p><Package size={14} /> {order.items?.length} Items | {order.totalWeight}kg</p>
                  <p><Clock size={14} /> {new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>
                <button className="status-btn" onClick={() => updateStatus(order._id, order.status)}>
                  {order.status === 'pending' ? 'Start Picking' : 'Move to Packing'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lane card">
          <h3><Box size={18} /> Packing ({getLaneOrders(['packing']).length})</h3>
          <div className="order-cards">
            {getLaneOrders(['packing']).map(order => (
              <div key={order._id} className="order-pick-card packing">
                <div className="card-header">
                  <strong>#BID-{order._id.slice(-6).toUpperCase()}</strong>
                </div>
                <div className="card-body">
                  <p><Box size={14} /> Packing in progress...</p>
                </div>
                <button className="status-btn" onClick={() => updateStatus(order._id, order.status)}>
                  Handover Ready
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lane card">
          <h3><ListChecks size={18} /> Ready ({getLaneOrders(['handover-ready']).length})</h3>
          <div className="order-cards">
            {getLaneOrders(['handover-ready']).map(order => (
              <div key={order._id} className="order-pick-card ready">
                <div className="card-header">
                  <strong>#BID-{order._id.slice(-6).toUpperCase()}</strong>
                </div>
                <div className="card-body">
                  <p><CheckCircle2 size={14} /> Waiting for dispatch</p>
                </div>
                <button className="status-btn" onClick={() => updateStatus(order._id, order.status)}>
                  Dispatch
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lane card">
          <h3><Truck size={18} /> Dispatched ({getLaneOrders(['dispatched']).length})</h3>
          <div className="order-cards">
            {getLaneOrders(['dispatched']).map(order => (
              <div key={order._id} className="order-pick-card dispatched">
                <div className="card-header">
                  <strong>#BID-{order._id.slice(-6).toUpperCase()}</strong>
                </div>
                <div className="card-body">
                  <p><Truck size={14} /> In Transit ({order.vehicleClass})</p>
                </div>
                <button className="status-btn" onClick={() => updateStatus(order._id, order.status)}>
                  Mark Delivered
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default PickingQueue;

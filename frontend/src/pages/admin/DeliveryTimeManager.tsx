import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit3, Trash2, X, Clock } from 'lucide-react';

const DeliveryTimeManager: React.FC = () => {
  const [times, setTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTime, setEditingTime] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    isActive: true
  });

  const fetchTimes = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/delivery-times`);
      setTimes(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTimes();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTime) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/delivery-times/${editingTime._id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/delivery-times`, formData);
      }
      setShowModal(false);
      setEditingTime(null);
      fetchTimes();
    } catch (err) {
      console.error(err);
      alert('Failed to save delivery time');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/delivery-times/${id}`);
      fetchTimes();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (time: any) => {
    setEditingTime(time);
    setFormData({
      name: time.name,
      isActive: time.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingTime(null);
    setFormData({
      name: '',
      isActive: true
    });
    setShowModal(true);
  };

  const filteredTimes = times.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="admin-content">
      <header className="admin-header space-between" style={{ marginBottom: '2.5rem' }}>
        <div className="title-group">
          <h1>Delivery Time Options</h1>
          <p>Manage standard delivery slots and times shown to customers</p>
        </div>
        <button className="add-sku-btn" onClick={resetForm}>
          <Plus size={18} /> New Time Slot
        </button>
      </header>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-group" style={{ flex: '0 1 400px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search times..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
            />
          </div>
          <div className="quick-stats">
            <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>TOTAL OPTIONS</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{times.length}</span>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Time Label</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '3rem' }}>Loading...</td></tr>
            ) : filteredTimes.length === 0 ? (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '3rem' }}>No times defined</td></tr>
            ) : (
              filteredTimes.map(time => (
                <tr key={time._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={18} color="#64748b" />
                      </div>
                      <span style={{ fontWeight: 700 }}>{time.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                      background: time.isActive ? '#dcfce7' : '#fee2e2',
                      color: time.isActive ? '#16a34a' : '#ef4444'
                    }}>
                      {time.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn" onClick={() => openEdit(time)} title="Edit"><Edit3 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => handleDelete(time._id)} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '400px' }}>
            <div className="modal-header space-between" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{editingTime ? 'Edit Time Slot' : 'New Time Slot'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Delivery Time Label</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. 60 mins, 2 Hours, 1-2 Days" required />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="t-active" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                  <label htmlFor="t-active" style={{ marginBottom: 0 }}>Is Active</label>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Time Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default DeliveryTimeManager;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit3, Trash2, X, MapPin } from 'lucide-react';

const LocationManager: React.FC = () => {
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    pincode: '',
    city: '',
    state: '',
    isActive: true
  });

  const fetchAreas = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/serviceable-areas`);
      setAreas(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingArea) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/serviceable-areas/${editingArea._id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/serviceable-areas`, formData);
      }
      setShowModal(false);
      setEditingArea(null);
      fetchAreas();
    } catch (err) {
      console.error(err);
      alert('Failed to save location');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this serviceable pincode?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/serviceable-areas/${id}`);
      fetchAreas();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (area: any) => {
    setEditingArea(area);
    setFormData({
      pincode: area.pincode,
      city: area.city,
      state: area.state || '',
      isActive: area.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingArea(null);
    setFormData({
      pincode: '',
      city: '',
      state: '',
      isActive: true
    });
    setShowModal(true);
  };

  const filteredAreas = areas.filter(a => 
    a.pincode.includes(search) || a.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="admin-content">
      <header className="admin-header space-between" style={{ marginBottom: '2.5rem' }}>
        <div className="title-group">
          <h1>Location Management</h1>
          <p>Manage serviceable pincodes and areas where users can place orders</p>
        </div>
        <button className="add-sku-btn" onClick={resetForm}>
          <Plus size={18} /> Add Pincode
        </button>
      </header>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-group" style={{ flex: '0 1 400px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search by pincode or city..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
            />
          </div>
          <div className="quick-stats">
            <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>SERVICEABLE PINCODES</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{areas.length}</span>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Pincode</th>
              <th>City</th>
              <th>State</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Loading locations...</td></tr>
            ) : filteredAreas.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>No serviceable locations defined</td></tr>
            ) : (
              filteredAreas.map(area => (
                 <tr key={area._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} color="#6366f1" />
                      <span style={{ fontWeight: 700 }}>{area.pincode}</span>
                    </div>
                  </td>
                  <td>{area.city}</td>
                  <td style={{ color: '#64748b' }}>{area.state || 'N/A'}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                      background: area.isActive ? '#dcfce7' : '#fee2e2',
                      color: area.isActive ? '#16a34a' : '#ef4444'
                    }}>
                      {area.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn" onClick={() => openEdit(area)} title="Edit"><Edit3 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => handleDelete(area._id)} title="Delete"><Trash2 size={16} /></button>
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
          <div className="modal-content card" style={{ maxWidth: '500px' }}>
            <div className="modal-header space-between" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{editingArea ? 'Edit Location' : 'Add Serviceable Pincode'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Pincode</label>
                  <input 
                    type="text" 
                    value={formData.pincode} 
                    onChange={e => setFormData({...formData, pincode: e.target.value})} 
                    placeholder="e.g. 122001"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                    placeholder="e.g. Gurgaon"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input 
                    type="text" 
                    value={formData.state} 
                    onChange={e => setFormData({...formData, state: e.target.value})} 
                    placeholder="e.g. Haryana"
                  />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                   <input 
                    type="checkbox" 
                    id="area-active"
                    checked={formData.isActive} 
                    onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                    style={{ width: '20px', height: '20px' }}
                  />
                  <label htmlFor="area-active" style={{ marginBottom: 0 }}>Is Active</label>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Location</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default LocationManager;

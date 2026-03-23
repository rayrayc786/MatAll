import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit3, Trash2, X, Ruler } from 'lucide-react';

const UnitManager: React.FC = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  const fetchUnits = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/units`);
      setUnits(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUnit) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/units/${editingUnit._id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/units`, formData);
      }
      setShowModal(false);
      setEditingUnit(null);
      fetchUnits();
    } catch (err) {
      console.error(err);
      alert('Failed to save unit');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/units/${id}`);
      fetchUnits();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (unit: any) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      description: unit.description || '',
      isActive: unit.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingUnit(null);
    setFormData({
      name: '',
      description: '',
      isActive: true
    });
    setShowModal(true);
  };

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="admin-content">
      <header className="admin-header space-between" style={{ marginBottom: '2.5rem' }}>
        <div className="title-group">
          <h1>Manage Units</h1>
          <p>Define product measurement units (e.g., kg, bag, ton, meter)</p>
        </div>
        <button className="add-sku-btn" onClick={resetForm}>
          <Plus size={18} /> New Unit
        </button>
      </header>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-group" style={{ flex: '0 1 400px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search units..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
            />
          </div>
          <div className="quick-stats">
            <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>TOTAL UNITS</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{units.length}</span>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Unit Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>Loading Units...</td></tr>
            ) : filteredUnits.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>No units defined</td></tr>
            ) : (
              filteredUnits.map(unit => (
                <tr key={unit._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ruler size={18} color="#64748b" />
                      </div>
                      <span style={{ fontWeight: 700 }}>{unit.name}</span>
                    </div>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{unit.description || 'No description'}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                      background: unit.isActive ? '#dcfce7' : '#fee2e2',
                      color: unit.isActive ? '#16a34a' : '#ef4444'
                    }}>
                      {unit.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn" onClick={() => openEdit(unit)} title="Edit"><Edit3 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => handleDelete(unit._id)} title="Delete"><Trash2 size={16} /></button>
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
              <h2 style={{ margin: 0 }}>{editingUnit ? 'Edit Unit' : 'Create Unit'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Unit Label (e.g., kg, Bag)</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. 50kg Bag"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input 
                    type="text" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Optional details..."
                  />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="unit-active"
                    checked={formData.isActive} 
                    onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                    style={{ width: '20px', height: '20px' }}
                  />
                  <label htmlFor="unit-active" style={{ marginBottom: 0 }}>Is Active</label>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default UnitManager;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit3, Trash2, X, Award } from 'lucide-react';
import { getFullImageUrl } from '../../utils/imageUrl';

const BrandManager: React.FC = () => {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoUrl: '',
    isFeatured: false,
    isActive: true
  });

  const fetchBrands = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/brands`);
      setBrands(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/brands/${editingBrand._id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/brands`, formData);
      }
      setShowModal(false);
      setEditingBrand(null);
      fetchBrands();
    } catch (err) {
      console.error(err);
      alert('Failed to save brand');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/brands/${id}`);
      fetchBrands();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (brand: any) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || '',
      logoUrl: brand.logoUrl || '',
      isFeatured: brand.isFeatured || false,
      isActive: brand.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      description: '',
      logoUrl: '',
      isFeatured: false,
      isActive: true
    });
    setShowModal(true);
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="admin-content">
      <header className="admin-header space-between" style={{ marginBottom: '2.5rem' }}>
        <div className="title-group">
          <h1>Manage Brands</h1>
          <p>Register and manage manufacturing partners & brands</p>
        </div>
        <button className="add-sku-btn" onClick={resetForm}>
          <Plus size={18} /> New Brand
        </button>
      </header>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-group" style={{ flex: '0 1 400px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search brands..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
            />
          </div>
          <div className="quick-stats">
            <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>TOTAL BRANDS</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{brands.length}</span>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Brand Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>Loading Brands...</td></tr>
            ) : filteredBrands.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>No brands defined</td></tr>
            ) : (
              filteredBrands.map(brand => (
                 <tr key={brand._id}>
                  <td>
                    {brand.logoUrl ? (
                      <img src={getFullImageUrl(brand.logoUrl)} alt={brand.name} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Award size={18} color="#64748b" />
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{brand.name}</span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{brand.description || 'No description'}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                      background: brand.isActive ? '#dcfce7' : '#fee2e2',
                      color: brand.isActive ? '#16a34a' : '#ef4444'
                    }}>
                      {brand.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    {brand.isFeatured && (
                      <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                        <Award size={14} fill="#f59e0b" /> Featured
                      </span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn" onClick={() => openEdit(brand)} title="Edit"><Edit3 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => handleDelete(brand._id)} title="Delete"><Trash2 size={16} /></button>
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
              <h2 style={{ margin: 0 }}>{editingBrand ? 'Edit Brand' : 'Register Brand'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Brand Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Polycab, Birla, Tata"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input 
                    type="text" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Details about manufacturer..."
                  />
                </div>
                <div className="form-group">
                  <label>Logo URL</label>
                  <input 
                    type="text" 
                    value={formData.logoUrl} 
                    onChange={e => setFormData({...formData, logoUrl: e.target.value})} 
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                   <input 
                    type="checkbox" 
                    id="brand-active"
                    checked={formData.isActive} 
                    onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                    style={{ width: '20px', height: '20px' }}
                  />
                  <label htmlFor="brand-active" style={{ marginBottom: 0 }}>Is Active</label>
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="brand-featured"
                    checked={formData.isFeatured} 
                    onChange={e => setFormData({...formData, isFeatured: e.target.checked})} 
                    style={{ width: '20px', height: '20px' }}
                  />
                  <label htmlFor="brand-featured" style={{ marginBottom: 0 }}>Featured on Home Page</label>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Brand</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default BrandManager;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit3, Trash2, X, Store, CheckCircle2, MapPin } from 'lucide-react';

const VendorManager: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [masterCategories, setMasterCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    categories: [] as string[],
    contactPhone: '',
    isVerified: false
  });

  const [categoryInput, setCategoryInput] = useState('');

  const fetchVendors = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/vendors`);
      setVendors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMasterCategories = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories`);
      setMasterCategories(data.filter((c: any) => c.isActive));
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchVendors(), fetchMasterCategories()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/vendors/${editingVendor._id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/vendors`, formData);
      }
      setShowModal(false);
      setEditingVendor(null);
      fetchVendors();
    } catch (err) {
      console.error(err);
      alert('Failed to save vendor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/vendors/${id}`);
      fetchVendors();
    } catch (err) {
      console.error(err);
    }
  };

  const addCategory = () => {
    if (categoryInput.trim() && !formData.categories.includes(categoryInput.trim())) {
      setFormData({ ...formData, categories: [...formData.categories, categoryInput.trim()] });
      setCategoryInput('');
    }
  };

  const removeCategory = (cat: string) => {
    setFormData({ ...formData, categories: formData.categories.filter(c => c !== cat) });
  };

  const openEdit = (vendor: any) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      location: vendor.location,
      categories: vendor.categories || [],
      contactPhone: vendor.contactPhone || '',
      isVerified: vendor.isVerified || false
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingVendor(null);
    setFormData({
      name: '',
      location: '',
      categories: [],
      contactPhone: '',
      isVerified: false
    });
    setShowModal(true);
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    v.categories.some((c: string) => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="admin-content">
      <header className="admin-header space-between" style={{ marginBottom: '2.5rem' }}>
        <div className="title-group">
          <h1>Vendor Management</h1>
          <p>Manage verified partners and their product categories</p>
        </div>
        <button className="add-sku-btn" onClick={resetForm}>
          <Plus size={18} /> Add New Vendor
        </button>
      </header>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-group" style={{ flex: '0 1 400px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search by Vendor Name or Category..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
            />
          </div>
          <div className="quick-stats" style={{ display: 'flex', gap: '2rem' }}>
            <div className="q-stat">
              <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>TOTAL VENDORS</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{vendors.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Vendor Info</th>
              <th>Location</th>
              <th>Expertise Categories</th>
              <th>Verification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Loading Vendors...</td></tr>
            ) : filteredVendors.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>No vendors found</td></tr>
            ) : (
              filteredVendors.map(vendor => (
                <tr key={vendor._id}>
                  <td className="product-cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', background: '#FFEA00', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Store size={20} color="#000" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{vendor.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{vendor.contactPhone}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                      <MapPin size={14} color="#64748b" /> {vendor.location}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {vendor.categories?.map((cat: string, i: number) => (
                        <span key={i} style={{ fontSize: '0.7rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {vendor.isVerified ? (
                      <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '0.85rem' }}>
                        <CheckCircle2 size={16} /> Verified
                      </span>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Pending</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn" onClick={() => openEdit(vendor)} title="Edit"><Edit3 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => handleDelete(vendor._id)} title="Delete"><Trash2 size={16} /></button>
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
          <div className="modal-content card" style={{ maxWidth: '600px' }}>
            <div className="modal-header space-between" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{editingVendor ? 'Edit Vendor' : 'Register New Vendor'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Business Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Primary Location / Hub</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input type="text" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} />
                </div>
                
                <div className="form-group">
                  <label>Categories of Expertise</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <select 
                      value={categoryInput} 
                      onChange={e => setCategoryInput(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="">Select a category...</option>
                      {masterCategories
                        .filter(mc => !formData.categories.includes(mc.name))
                        .map(mc => (
                          <option key={mc._id} value={mc.name}>{mc.name}</option>
                        ))
                      }
                    </select>
                    <button 
                      type="button" 
                      onClick={addCategory} 
                      className="primary-btn" 
                      style={{ padding: '0 1.5rem' }}
                      disabled={!categoryInput}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px', padding: '10px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                    {formData.categories.length === 0 && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No categories added yet</span>}
                    {formData.categories.map((cat, i) => (
                      <span key={i} className="unit-badge" style={{ background: '#FFEA00', color: '#000', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}>
                        {cat} <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeCategory(cat)} />
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="verified"
                    checked={formData.isVerified} 
                    onChange={e => setFormData({...formData, isVerified: e.target.checked})} 
                    style={{ width: '20px', height: '20px' }}
                  />
                  <label htmlFor="verified" style={{ marginBottom: 0 }}>Verified Partner</label>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default VendorManager;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit3, Trash2, X, Store, CheckCircle2, MapPin } from 'lucide-react';
import './vendor.css';

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
      <header className="admin-header space-between vendor-header">
        <div className="title-group">
          <h1>Vendor Management</h1>
          <p>Manage verified partners and their product categories</p>
        </div>
        <button className="add-sku-btn" onClick={resetForm}>
          <Plus size={18} /> Add New Vendor
        </button>
      </header>

      <div className="card vendor-search-card">
        <div className="vendor-search-container">
          <div className="search-group vendor-search-group">
            <Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search by Vendor Name or Category..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="vendor-search-input"
            />
          </div>
          <div className="quick-stats vendor-stats">
            <div className="q-stat">
              <span className="q-stat-label">TOTAL VENDORS</span>
              <span className="q-stat-value">{vendors.length}</span>
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
              <tr><td colSpan={5} className="loading-cell">Loading Vendors...</td></tr>
            ) : filteredVendors.length === 0 ? (
              <tr><td colSpan={5} className="empty-cell">No vendors found</td></tr>
            ) : (
              filteredVendors.map(vendor => (
                <tr key={vendor._id}>
                  <td className="product-cell">
                    <div className="vendor-info-cell">
                      <div className="vendor-icon-container">
                        <Store size={20} color="#000" />
                      </div>
                      <div>
                        <div className="vendor-name">{vendor.name}</div>
                        <div className="vendor-phone">{vendor.contactPhone}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="vendor-location-container">
                      <MapPin size={14} color="#64748b" /> {vendor.location}
                    </div>
                  </td>
                  <td>
                    <div className="vendor-categories-container">
                      {vendor.categories?.map((cat: string, i: number) => (
                        <span key={i} className="vendor-category-badge">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {vendor.isVerified ? (
                      <span className="vendor-verified">
                        <CheckCircle2 size={16} /> Verified
                      </span>
                    ) : (
                      <span className="vendor-pending">Pending</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
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
          <div className="modal-content card vendor-modal">
            <div className="modal-header space-between vendor-modal-header">
              <h2 className="modal-title">{editingVendor ? 'Edit Vendor' : 'Register New Vendor'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-grid vendor-form-grid">
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
                  <div className="category-input-group">
                    <select 
                      value={categoryInput} 
                      onChange={e => setCategoryInput(e.target.value)}
                      className="category-select"
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
                      className="primary-btn category-add-btn" 
                      disabled={!categoryInput}
                    >
                      Add
                    </button>
                  </div>
                  <div className="categories-display-area">
                    {formData.categories.length === 0 && <span className="no-categories-text">No categories added yet</span>}
                    {formData.categories.map((cat, i) => (
                      <span key={i} className="unit-badge vendor-category-tag">
                        {cat} <X size={14} className="tag-close-icon" onClick={() => removeCategory(cat)} />
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-group verified-checkbox-group">
                  <input 
                    type="checkbox" 
                    id="verified"
                    checked={formData.isVerified} 
                    onChange={e => setFormData({...formData, isVerified: e.target.checked})} 
                    className="verified-checkbox"
                  />
                  <label htmlFor="verified" className="verified-label">Verified Partner</label>
                </div>
              </div>
              <div className="modal-footer vendor-modal-footer">
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

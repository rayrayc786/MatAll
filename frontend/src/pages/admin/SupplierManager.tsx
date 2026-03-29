import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit3, Trash2, X, Store, CheckCircle2, MapPin } from 'lucide-react';
import './supplier.css';

const SupplierManager: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [masterCategories, setMasterCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    categories: [] as string[],
    contactPhone: '',
    isVerified: false
  });

  const [categoryInput, setCategoryInput] = useState('');

  const fetchSuppliers = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/suppliers`);
      setSuppliers(data);
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
    await Promise.all([fetchSuppliers(), fetchMasterCategories()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/suppliers/${editingSupplier._id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/suppliers`, formData);
      }
      setShowModal(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      alert('Failed to save supplier');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/suppliers/${id}`);
      fetchSuppliers();
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

  const openEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      location: supplier.location,
      categories: supplier.categories || [],
      contactPhone: supplier.contactPhone || '',
      isVerified: supplier.isVerified || false
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      location: '',
      categories: [],
      contactPhone: '',
      isVerified: false
    });
    setShowModal(true);
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.categories.some((c: string) => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="admin-content">
      <header className="admin-header space-between supplier-header">
        <div className="title-group">
          <h1>Supplier Management</h1>
          <p>Manage verified partners and their product categories</p>
        </div>
        <button className="add-sku-btn" onClick={resetForm}>
          <Plus size={18} /> Add New Supplier
        </button>
      </header>

      <div className="card supplier-search-card">
        <div className="supplier-search-container">
          <div className="search-group supplier-search-group">
            <Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search by Supplier Name or Category..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="supplier-search-input"
            />
          </div>
          <div className="quick-stats supplier-stats">
            <div className="q-stat">
              <span className="q-stat-label">TOTAL SUPPLIERS</span>
              <span className="q-stat-value">{suppliers.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Supplier Info</th>
              <th>Location</th>
              <th>Expertise Categories</th>
              <th>Verification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="loading-cell">Loading Suppliers...</td></tr>
            ) : filteredSuppliers.length === 0 ? (
              <tr><td colSpan={5} className="empty-cell">No suppliers found</td></tr>
            ) : (
              filteredSuppliers.map(supplier => (
                <tr key={supplier._id}>
                  <td className="product-cell">
                    <div className="supplier-info-cell">
                      <div className="supplier-icon-container">
                        <Store size={20} color="#000" />
                      </div>
                      <div>
                        <div className="supplier-name">{supplier.name}</div>
                        <div className="supplier-phone">{supplier.contactPhone}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="supplier-location-container">
                      <MapPin size={14} color="#64748b" /> {supplier.location}
                    </div>
                  </td>
                  <td>
                    <div className="supplier-categories-container">
                      {supplier.categories?.map((cat: string, i: number) => (
                        <span key={i} className="supplier-category-badge">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {supplier.isVerified ? (
                      <span className="supplier-verified">
                        <CheckCircle2 size={16} /> Verified
                      </span>
                    ) : (
                      <span className="supplier-pending">Pending</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button className="icon-btn" onClick={() => openEdit(supplier)} title="Edit"><Edit3 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => handleDelete(supplier._id)} title="Delete"><Trash2 size={16} /></button>
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
          <div className="modal-content card supplier-modal">
            <div className="modal-header space-between supplier-modal-header">
              <h2 className="modal-title">{editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-grid supplier-form-grid">
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
                      <span key={i} className="unit-badge supplier-category-tag">
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
              <div className="modal-footer supplier-modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default SupplierManager;

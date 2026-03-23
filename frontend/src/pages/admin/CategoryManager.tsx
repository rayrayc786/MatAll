import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit3, Trash2, X, Tag } from 'lucide-react';

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories`);
      setCategories(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories/${editingCategory._id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories`, formData);
      }
      setShowModal(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure? This will affect product routing!')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories/${id}`);
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (cat: any) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      isActive: cat.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      isActive: true
    });
    setShowModal(true);
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="admin-content">
      <header className="admin-header space-between" style={{ marginBottom: '2.5rem' }}>
        <div className="title-group">
          <h1>Master Categories</h1>
          <p>Define product categories used for vendor matching and SKU grouping</p>
        </div>
        <button className="add-sku-btn" onClick={resetForm}>
          <Plus size={18} /> New Category
        </button>
      </header>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-group" style={{ flex: '0 1 400px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
            />
          </div>
          <div className="quick-stats">
            <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>TOTAL CATEGORIES</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{categories.length}</span>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>Loading Categories...</td></tr>
            ) : filteredCategories.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>No categories defined</td></tr>
            ) : (
              filteredCategories.map(cat => (
                <tr key={cat._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Tag size={18} color="#64748b" />
                      </div>
                      <span style={{ fontWeight: 700 }}>{cat.name}</span>
                    </div>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{cat.description || 'No description'}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                      background: cat.isActive ? '#dcfce7' : '#fee2e2',
                      color: cat.isActive ? '#16a34a' : '#ef4444'
                    }}>
                      {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn" onClick={() => openEdit(cat)} title="Edit"><Edit3 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => handleDelete(cat._id)} title="Delete"><Trash2 size={16} /></button>
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
              <h2 style={{ margin: 0 }}>{editingCategory ? 'Edit Category' : 'Create Category'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Category Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Electrical Material"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input 
                    type="text" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Brief details about this category..."
                  />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="cat-active"
                    checked={formData.isActive} 
                    onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                    style={{ width: '20px', height: '20px' }}
                  />
                  <label htmlFor="cat-active" style={{ marginBottom: 0 }}>Is Active</label>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default CategoryManager;

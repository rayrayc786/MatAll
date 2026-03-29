import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit3, Trash2, X, Layers } from 'lucide-react';

const SubCategoryManager: React.FC = () => {
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    parentSubCategoryId: '',
    isActive: true
  });

  const fetchData = async () => {
    try {
      const [subsRes, catsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sub-categories`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories`)
      ]);
      setSubCategories(subsRes.data);
      setCategories(catsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSub) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sub-categories/${editingSub._id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sub-categories`, formData);
      }
      setShowModal(false);
      setEditingSub(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save sub-category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sub-categories/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (sub: any) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      categoryId: sub.categoryId?._id || sub.categoryId,
      parentSubCategoryId: sub.parentSubCategoryId?._id || sub.parentSubCategoryId || '',
      isActive: sub.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingSub(null);
    setFormData({
      name: '',
      categoryId: '',
      parentSubCategoryId: '',
      isActive: true
    });
    setShowModal(true);
  };

  const filteredSubs = subCategories.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.categoryId?.name && s.categoryId.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="admin-content">
      <header className="admin-header space-between" style={{ marginBottom: '2.5rem' }}>
        <div className="title-group">
          <h1>Sub-Categories Management</h1>
          <p>Create and manage multi-level nested sub-categories</p>
        </div>
        <button className="add-sku-btn" onClick={resetForm}>
          <Plus size={18} /> New Sub-Category
        </button>
      </header>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-group" style={{ flex: '0 1 400px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search by name or category..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
            />
          </div>
          <div className="quick-stats">
            <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>TOTAL SUB-CATS</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{subCategories.length}</span>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Sub-Category Name</th>
              <th>Parent Hierarchy</th>
              <th>Master Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Loading...</td></tr>
            ) : filteredSubs.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>No sub-categories found</td></tr>
            ) : (
              filteredSubs.map(sub => (
                <tr key={sub._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', background: sub.parentSubCategoryId ? '#fef9c3' : '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Layers size={18} color={sub.parentSubCategoryId ? '#854d0e' : '#64748b'} />
                      </div>
                      <span style={{ fontWeight: 700 }}>{sub.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {sub.parentSubCategoryId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                           <span className="unit-badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.7rem' }}>
                            {sub.parentSubCategoryId?.name || 'Sub-category'}
                          </span>
                        </div>
                      ) : 'Root Level'}
                    </span>
                  </td>
                  <td>
                    <span className="unit-badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
                      {sub.categoryId?.name || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                      background: sub.isActive ? '#dcfce7' : '#fee2e2',
                      color: sub.isActive ? '#16a34a' : '#ef4444'
                    }}>
                      {sub.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn" onClick={() => openEdit(sub)} title="Edit"><Edit3 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => handleDelete(sub._id)} title="Delete"><Trash2 size={16} /></button>
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
              <h2 style={{ margin: 0 }}>{editingSub ? 'Edit Sub-Category' : 'Create Sub-Category'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Sub-Category Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Copper Wires" required />
                </div>
                
                <div className="form-group">
                  <label>Master Category</label>
                  <select 
                    value={formData.categoryId} 
                    onChange={e => {
                        const newCatId = e.target.value;
                        setFormData({...formData, categoryId: newCatId, parentSubCategoryId: ''});
                    }} 
                    required
                  >
                    <option value="">Select Master Category...</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Parent Sub-Category (Optional for nesting)</label>
                  <select 
                    value={formData.parentSubCategoryId} 
                    onChange={e => setFormData({...formData, parentSubCategoryId: e.target.value})}
                    disabled={!formData.categoryId}
                  >
                    <option value="">None (Top Level Sub-Category)</option>
                    {subCategories
                      .filter(s => {
                        // Prevent infinite loop: a sub-category cannot be its own parent
                        if (editingSub && s._id === editingSub._id) return false;
                        // Only show sub-categories belonging to the selected master category
                        return s.categoryId?._id === formData.categoryId || s.categoryId === formData.categoryId;
                      })
                      .map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="sub-active" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                  <label htmlFor="sub-active" style={{ marginBottom: 0 }}>Is Active</label>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Sub-Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default SubCategoryManager;

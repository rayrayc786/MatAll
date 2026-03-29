import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit3, Trash2, X, List } from 'lucide-react';

const FooterManager: React.FC = () => {
  const [footerLinks, setFooterLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    links: [
      { label: '', path: '', isActive: true }
    ],
    order: 0,
    isActive: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/footer-links`);
      setFooterLinks(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/footer-links/${editingGroup._id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/footer-links`, formData);
      }
      setShowModal(false);
      setEditingGroup(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save footer links');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this link group?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/footer-links/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (group: any) => {
    setEditingGroup(group);
    setFormData({
      title: group.title,
      links: group.links.map((l: any) => ({ ...l })),
      order: group.order || 0,
      isActive: group.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingGroup(null);
    setFormData({
      title: '',
      links: [{ label: '', path: '', isActive: true }],
      order: 0,
      isActive: true
    });
    setShowModal(true);
  };

  const addLinkField = () => {
    setFormData({
      ...formData,
      links: [...formData.links, { label: '', path: '', isActive: true }]
    });
  };

  const removeLinkField = (index: number) => {
    const newLinks = [...formData.links];
    newLinks.splice(index, 1);
    setFormData({ ...formData, links: newLinks });
  };

  const updateLinkField = (index: number, field: string, value: any) => {
    const newLinks = [...formData.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFormData({ ...formData, links: newLinks });
  };

  const filteredGroups = footerLinks.filter(g => 
    g.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="admin-content">
      <header className="admin-header space-between" style={{ marginBottom: '2.5rem' }}>
        <div className="title-group">
          <h1>Footer Link Management</h1>
          <p>Organize and manage link columns and secondary navigation in the site footer</p>
        </div>
        <button className="add-sku-btn" onClick={resetForm}>
          <Plus size={18} /> New Link Group
        </button>
      </header>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-group" style={{ flex: '0 1 400px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search link groups..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
            />
          </div>
          <div className="quick-stats">
            <div className="stat">
              <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600, display: 'block' }}>TOTAL GROUPS</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{footerLinks.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Group Title</th>
              <th>Links Count</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Loading Links...</td></tr>
            ) : filteredGroups.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>No footer links managed</td></tr>
            ) : (
              filteredGroups.map(group => (
                <tr key={group._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <List size={18} color="#64748b" />
                      </div>
                      <span style={{ fontWeight: 700 }}>{group.title}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{group.links.length} links</span>
                  </td>
                  <td>{group.order}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                      background: group.isActive ? '#dcfce7' : '#fee2e2',
                      color: group.isActive ? '#16a34a' : '#ef4444'
                    }}>
                      {group.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn" onClick={() => openEdit(group)} title="Edit"><Edit3 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => handleDelete(group._id)} title="Delete"><Trash2 size={16} /></button>
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
          <div className="modal-content card" style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header space-between" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{editingGroup ? 'Edit Link Group' : 'Create Link Group'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Group Title (e.g. Website, Company, etc.)</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="e.g. Useful Links"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Links
                    <button type="button" onClick={addLinkField} style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>
                      + ADD LINK
                    </button>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    {formData.links.map((link, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ flex: 1 }}>
                          <input 
                            type="text" 
                            placeholder="Label (e.g. Home)" 
                            value={link.label} 
                            onChange={e => updateLinkField(idx, 'label', e.target.value)}
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }}
                            required
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <input 
                            type="text" 
                            placeholder="Path (e.g. /)" 
                            value={link.path} 
                            onChange={e => updateLinkField(idx, 'path', e.target.value)}
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }}
                            required
                          />
                        </div>
                        <button type="button" onClick={() => removeLinkField(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="input-row-admin" style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Display Order</label>
                    <input 
                      type="number" 
                      value={formData.order} 
                      onChange={e => setFormData({...formData, order: Number(e.target.value)})} 
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '1.5rem' }}>
                    <input 
                      type="checkbox" 
                      id="group-active"
                      checked={formData.isActive} 
                      onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                      style={{ width: '18px', height: '18px' }}
                    />
                    <label htmlFor="group-active" style={{ marginBottom: 0 }}>Is Group Active</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Footer Configuration</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default FooterManager;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Search, Edit3, Trash2, X, Tag, ChevronDown, ChevronRight, Layers, Image, Menu } from 'lucide-react';
import { getFullImageUrl } from '../../utils/imageUrl';

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const [catFormData, setCatFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    isActive: true,
    isFeatured: false
  });

  const [subFormData, setSubFormData] = useState({
    name: '',
    categoryId: '',
    parentSubCategoryId: '',
    isActive: true,
    imageUrl: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catsRes, subsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sub-categories`)
      ]);
      setCategories(catsRes.data);
      setSubCategories(subsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/upload-image`, uploadData);
      setCatFormData({ ...catFormData, imageUrl: data.imageUrl });
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  const handleSubCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/upload-image`, uploadData);
      setSubFormData({ ...subFormData, imageUrl: data.imageUrl });
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  const handleCatSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const { data } = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories/${editingCategory._id}`, catFormData);
        if (data._image_processing) toast.success('Category saved & images downloaded!');
        else toast.success('Category updated');
      } else {
        const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories`, catFormData);
        if (data._image_processing) toast.success('Category created & images saved!');
        else toast.success('Category created');
      }
      setShowModal(false);
      setEditingCategory(null);
      fetchData();
      toast.success(editingCategory ? 'Category updated!' : 'Category created!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save category');
    }
  };

  const handleSubSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSub) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sub-categories/${editingSub._id}`, subFormData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sub-categories`, subFormData);
      }
      setShowSubModal(false);
      setEditingSub(null);
      fetchData();
      toast.success(editingSub ? 'Sub-category updated!' : 'Sub-category created!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save sub-category');
    }
  };

  const handleCatDelete = async (id: string) => {
    if (!confirm('Are you sure? This will affect product routing and linked sub-categories!')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories/${id}`);
      fetchData();
      toast.success('Category deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete category');
    }
  };

  const handleSubDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sub-category?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sub-categories/${id}`);
      fetchData();
      toast.success('Sub-category deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete sub-category');
    }
  };

  const openCatEdit = (cat: any) => {
    setEditingCategory(cat);
    setCatFormData({
      name: cat.name,
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      isActive: cat.isActive,
      isFeatured: !!cat.isFeatured
    });
    setShowModal(true);
  };

  const openSubEdit = (sub: any) => {
    setEditingSub(sub);
    setSubFormData({
      name: sub.name,
      categoryId: sub.categoryId?._id || sub.categoryId,
      parentSubCategoryId: sub.parentSubCategoryId?._id || sub.parentSubCategoryId || '',
      isActive: sub.isActive,
      imageUrl: sub.imageUrl || ''
    });
    setShowSubModal(true);
  };

  const openQuickAddSub = (parentId: string, type: 'category' | 'sub') => {
    if (type === 'category') {
      setSubFormData({
        name: '',
        categoryId: parentId,
        parentSubCategoryId: '',
        isActive: true,
        imageUrl: ''
      });
    } else {
      const parentSub = subCategories.find(s => s._id === parentId);
      setSubFormData({
        name: '',
        categoryId: parentSub?.categoryId?._id || parentSub?.categoryId || '',
        parentSubCategoryId: parentId,
        isActive: true,
        imageUrl: ''
      });
    }
    setEditingSub(null);
    setShowSubModal(true);
  };

  const resetCatForm = () => {
    setEditingCategory(null);
    setCatFormData({
      name: '',
      description: '',
      imageUrl: '',
      isActive: true,
      isFeatured: false
    });
    setShowModal(true);
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedCategories(newSet);
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const getSubCategoriesFor = (id: string, type: 'category' | 'sub') => {
    return subCategories.filter(s => {
      if (type === 'category') return (s.categoryId?._id === id || s.categoryId === id) && !s.parentSubCategoryId;
      return (s.parentSubCategoryId?._id === id || s.parentSubCategoryId === id);
    });
  };

  const renderSubTree = (parentId: string, level: number = 0) => {
    const subs = getSubCategoriesFor(parentId, level === 0 ? 'category' : 'sub');
    if (subs.length === 0) return null;

    return subs.map(sub => (
      <React.Fragment key={sub._id}>
        <tr className="sub-category-row" style={{ background: '#f8fafc' }}>
          <td style={{ paddingLeft: `${(level + 1) * 2.5 + 2}rem` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderLeft: '2px solid #e2e8f0', borderBottom: '2px solid #e2e8f0', marginRight: '4px', marginTop: '-8px' }}></div>
              <Layers size={14} color="#64748b" />
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{sub.name}</span>
            </div>
          </td>
          <td><span style={{ fontSize: '0.75rem', color: '#64748b' }}>Sub-category Level {level + 1}</span></td>
          <td>
            <span style={{ 
              padding: '2px 8px', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700,
              background: sub.isActive ? '#dcfce7' : '#fee2e2',
              color: sub.isActive ? '#16a34a' : '#ef4444'
            }}>
              {sub.isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </td>
          <td>
            {sub.imageUrl ? (
              <div style={{ width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <img src={getFullImageUrl(sub.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image size={14} color="#94a3b8" />
              </div>
            )}
          </td>
          <td className="actions-cell">
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="icon-btn xs" onClick={() => openQuickAddSub(sub._id, 'sub')} title="Add Sub-Sub-Category"><Plus size={14} /></button>
              <button className="icon-btn xs" onClick={() => openSubEdit(sub)} title="Edit"><Edit3 size={14} /></button>
              <button className="icon-btn xs delete" onClick={() => handleSubDelete(sub._id)} title="Delete"><Trash2 size={14} /></button>
            </div>
          </td>
        </tr>
        {renderSubTree(sub._id, level + 1)}
      </React.Fragment>
    ));
  };

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-admin-sidebar'));
  };

  return (
    <main className="admin-content">
      <header className="admin-header space-between" style={{ marginBottom: '2.5rem' }}>
        <div className="title-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="mobile-menu-trigger" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <div className="header-text">
            <h1>Category & Hierarchy Management</h1>
            <p>Define master categories and nested sub-categories for the dynamic marketplace</p>
          </div>
        </div>
        <button className="add-sku-btn" onClick={resetCatForm}>
          <Plus size={18} /> New Master Category
        </button>
      </header>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-group" style={{ flex: '0 1 400px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search master categories..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
            />
          </div>
          <div className="quick-stats" style={{ display: 'flex', gap: '2rem' }}>
            <div className="stat">
              <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600, display: 'block' }}>MASTER CATEGORIES</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{categories.length}</span>
            </div>
            <div className="stat">
              <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 600, display: 'block' }}>SUB-CATEGORIES</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{subCategories.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Category / Sub-Category Name</th>
              <th>Type / Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>Loading Hierarchy...</td></tr>
            ) : filteredCategories.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>No categories defined</td></tr>
            ) : (
              filteredCategories.map(cat => {
                const isExpanded = expandedCategories.has(cat._id);
                const subsCount = subCategories.filter(s => s.categoryId?._id === cat._id || s.categoryId === cat._id).length;
                
                return (
                  <React.Fragment key={cat._id}>
                    <tr className={isExpanded ? 'expanded-row' : ''}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <button 
                            className="icon-btn xs" 
                            style={{ padding: 0, width: '24px', height: '24px', visibility: subsCount > 0 ? 'visible' : 'hidden' }}
                            onClick={() => toggleExpand(cat._id)}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            background: '#f1f5f9', 
                            borderRadius: '8px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            overflow: 'hidden',
                            border: '1px solid #e2e8f0'
                          }}>
                            {cat.imageUrl ? (
                              <img src={getFullImageUrl(cat.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Tag size={18} color="#64748b" />
                            )}
                          </div>
                          <div>
                            <span style={{ fontWeight: 700, display: 'block' }}>{cat.name}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{subsCount} sub-categories defined</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{cat.description || 'Master Level Category'}</td>
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
                          <button className="icon-btn" onClick={() => openQuickAddSub(cat._id, 'category')} title="Add Sub-category"><Plus size={16} /></button>
                          <button className="icon-btn" onClick={() => openCatEdit(cat)} title="Edit"><Edit3 size={16} /></button>
                          <button className="icon-btn delete" onClick={() => handleCatDelete(cat._id)} title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && renderSubTree(cat._id)}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Master Category Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '500px' }}>
            <div className="modal-header space-between" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{editingCategory ? 'Edit Master Category' : 'Create Master Category'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCatSave} className="admin-form">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Category Name</label>
                  <input 
                    type="text" 
                    value={catFormData.name} 
                    onChange={e => setCatFormData({...catFormData, name: e.target.value})} 
                    placeholder="e.g. Electrical Material"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Blog Space / SEO Description (Multiple Paragraphs)</label>
                  <textarea 
                    value={catFormData.description} 
                    onChange={e => setCatFormData({...catFormData, description: e.target.value})} 
                    placeholder="Enter multiple paragraphs for the category blog section..."
                    rows={6}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0',
                      outline: 'none',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit'
                    }}
                  ></textarea>
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      id="cat-active"
                      checked={catFormData.isActive} 
                      onChange={e => setCatFormData({...catFormData, isActive: e.target.checked})} 
                      style={{ width: '18px', height: '18px' }}
                    />
                    <label htmlFor="cat-active" style={{ marginBottom: 0 }}>Is Active</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      id="cat-featured"
                      checked={catFormData.isFeatured} 
                      onChange={e => setCatFormData({...catFormData, isFeatured: e.target.checked})} 
                      style={{ width: '18px', height: '18px' }}
                    />
                    <label htmlFor="cat-featured" style={{ marginBottom: 0, color: '#f59e0b', fontWeight: 'bold' }}>Featured on Home</label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Category Image (Upload or Paste URL)</label>
                  <div style={{ marginBottom: '1rem' }}>
                    <input 
                      type="text" 
                      value={catFormData.imageUrl} 
                      onChange={e => setCatFormData({...catFormData, imageUrl: e.target.value})} 
                      placeholder="https://... or select file below"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', marginBottom: '10px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '12px', border: '2px dashed #e2e8f0', backgroundImage: catFormData.imageUrl ? `url(${getFullImageUrl(catFormData.imageUrl)})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {!catFormData.imageUrl && <Image size={24} color="#64748b" opacity={0.5} />}
                    </div>
                    <div>
                      <input type="file" id="cat-img-upload" hidden accept="image/*" onChange={handleCategoryImageUpload} />
                      <label htmlFor="cat-img-upload" className="secondary-btn" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>Change Image</label>
                      <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Recommended: 200x200px PNG/JPG</p>
                    </div>
                  </div>
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

      {/* Sub-Category Modal */}
      {showSubModal && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '500px' }}>
            <div className="modal-header space-between" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{editingSub ? 'Edit Sub-Category' : 'Create Sub-Category'}</h2>
              <button className="icon-btn" onClick={() => setShowSubModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubSave} className="admin-form">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Sub-Category Name</label>
                  <input type="text" value={subFormData.name} onChange={e => setSubFormData({...subFormData, name: e.target.value})} placeholder="e.g. Copper Wires" required />
                </div>
                
                <div className="form-group">
                  <label>Master Category</label>
                  <select 
                    value={subFormData.categoryId} 
                    onChange={e => setSubFormData({...subFormData, categoryId: e.target.value, parentSubCategoryId: ''})} 
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
                    value={subFormData.parentSubCategoryId} 
                    onChange={e => setSubFormData({...subFormData, parentSubCategoryId: e.target.value})}
                    disabled={!subFormData.categoryId}
                  >
                    <option value="">None (Top Level Sub-Category)</option>
                    {subCategories
                      .filter(s => {
                        if (editingSub && s._id === editingSub._id) return false;
                        return (s.categoryId?._id === subFormData.categoryId || s.categoryId === subFormData.categoryId);
                      })
                      .map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="form-group">
                  <label>Sub-Category Image (Optional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '4px' }}>
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '8px', 
                      border: '2px dashed #e2e8f0', 
                      backgroundImage: subFormData.imageUrl ? `url(${getFullImageUrl(subFormData.imageUrl)})` : 'none', 
                      backgroundSize: 'cover', 
                      backgroundPosition: 'center', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      {!subFormData.imageUrl && <Image size={20} color="#64748b" opacity={0.5} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input type="text" value={subFormData.imageUrl} onChange={e => setSubFormData({...subFormData, imageUrl: e.target.value})} placeholder="URL or upload below" style={{ marginBottom: '8px' }} />
                      <input type="file" id="sub-img-upload" hidden accept="image/*" onChange={handleSubCategoryImageUpload} />
                      <label htmlFor="sub-img-upload" className="secondary-btn xs" style={{ cursor: 'pointer', display: 'inline-block' }}>Upload File</label>
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" id="sub-active" checked={subFormData.isActive} onChange={e => setSubFormData({...subFormData, isActive: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                  <label htmlFor="sub-active" style={{ marginBottom: 0 }}>Is Active</label>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowSubModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Sub-Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default CategoryManager;

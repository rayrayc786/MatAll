import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Search, FileUp, Edit3, Trash2, X, CheckCircle2, AlertCircle } from 'lucide-react';
import './sku.css';

const SKUManager: React.FC = () => {
  const [skus, setSkus] = useState<any[]>([]);
  const [masterCategories, setMasterCategories] = useState<any[]>([]);
  const [masterSubCategories, setMasterSubCategories] = useState<any[]>([]);
  const [masterBrands, setMasterBrands] = useState<any[]>([]);
  const [masterUnits, setMasterUnits] = useState<any[]>([]);
  const [masterVariantTitles, setMasterVariantTitles] = useState<any[]>([]);
  const [masterDeliveryTimes, setMasterDeliveryTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSku, setEditingSku] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ active: boolean; percentage: number }>({ active: false, percentage: 0 });
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    unitType: 'individual',
    unitLabel: 'unit',
    weightPerUnit: 0,
    volumePerUnit: 0,
    price: 0,
    imageUrl: '',
    csiMasterFormat: '',
    category: '',
    subCategory: '',
    brand: '',
    mrp: 0,
    salePrice: 0,
    deliveryTime: '',
    size: '',
    subVariants: [] as any[]
  });

  const getFullImageUrl = (url?: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=100';
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
  };

  const fetchSKUs = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products`);
      setSkus(data);
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

  const fetchMasterBrands = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/brands`);
      setMasterBrands(data.filter((b: any) => b.isActive));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMasterUnits = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/units`);
      setMasterUnits(data.filter((u: any) => u.isActive));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMasterSubCategories = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sub-categories`);
      setMasterSubCategories(data.filter((s: any) => s.isActive));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMasterVariantTitles = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/variant-titles`);
      setMasterVariantTitles(data.filter((v: any) => v.isActive));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMasterDeliveryTimes = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/delivery-times`);
      setMasterDeliveryTimes(data.filter((d: any) => d.isActive));
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchSKUs(), 
      fetchMasterCategories(), 
      fetchMasterBrands(), 
      fetchMasterUnits(),
      fetchMasterSubCategories(),
      fetchMasterVariantTitles(),
      fetchMasterDeliveryTimes()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress({ active: true, percentage: 0 });
      setUploadResult(null);

      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/bulk-upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress({ active: true, percentage: percentCompleted });
        }
      });
      
      setUploadResult(response.data);
      console.log('Bulk Upload Response:', response.data);
      fetchSKUs();
    } catch (err) {
      console.error(err);
      alert('Failed to upload products');
    } finally {
      setUploadProgress({ active: false, percentage: 0 });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('WARNING: This will delete ALL products in the database. Are you sure?')) return;
    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/clear-all`);
      fetchSKUs();
      alert('All products cleared');
    } catch (err) {
      console.error(err);
      alert('Failed to clear products');
    } finally {
      setLoading(false);
    }
  };

  const filteredSkus = skus.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.sku.toLowerCase().includes(search.toLowerCase()) ||
    (s.csiMasterFormat && s.csiMasterFormat.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSku) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/${editingSku._id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products`, formData);
      }
      setShowModal(false);
      setEditingSku(null);
      fetchSKUs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/${id}`);
      fetchSKUs();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (sku: any) => {
    setEditingSku(sku);
    setFormData({
      name: sku.name || '',
      sku: sku.sku || '',
      unitType: sku.unitType || 'individual',
      unitLabel: sku.unitLabel || 'unit',
      weightPerUnit: sku.weightPerUnit || 0,
      volumePerUnit: sku.volumePerUnit || 0,
      price: sku.price || 0,
      imageUrl: sku.imageUrl || '',
      csiMasterFormat: sku.csiMasterFormat || '',
      category: sku.category || '',
      subCategory: sku.subCategory || '',
      brand: sku.brand || '',
      mrp: sku.mrp || 0,
      salePrice: sku.salePrice || 0,
      deliveryTime: sku.deliveryTime || '',
      size: sku.size || sku.subVariants?.[0]?.title || '',
      subVariants: sku.subVariants || []
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingSku(null);
    setFormData({
      name: '',
      sku: '',
      unitType: 'individual',
      unitLabel: 'unit',
      weightPerUnit: 0,
      volumePerUnit: 0,
      price: 0,
      imageUrl: '',
      csiMasterFormat: '',
      category: '',
      subCategory: '',
      brand: '',
      mrp: 0,
      salePrice: 0,
      deliveryTime: '',
      size: '',
      subVariants: []
    });
    setShowModal(true);
  };

  return (
    <main className="admin-content">
      <header className="admin-header space-between" style={{ marginBottom: '2.5rem' }}>
        <div className="title-group">
          <h1>SKU & Inventory Manager</h1>
          <p>Master database for industrial materials & Smart Units</p>
        </div>
        <div className="action-group" style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
          />
          <button className="secondary-btn" onClick={() => fileInputRef.current?.click()}>
            <FileUp size={18} /> Bulk Upload (Excel)
          </button>
          <button className="secondary-btn" onClick={handleClearAll} style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>
            <Trash2 size={18} /> Clear All
          </button>
          <button className="add-sku-btn" onClick={resetForm}>
            <Plus size={18} /> New Product SKU
          </button>
        </div>
      </header>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-group" style={{ flex: '0 1 400px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search by SKU, Name, Brand, or Category..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
            />
          </div>
          <div className="quick-stats" style={{ display: 'flex', gap: '2rem' }}>
            <div className="q-stat">
              <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>TOTAL SKUS</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{skus.length}</span>
            </div>
            <div className="q-stat">
              <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>FILTERED</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{filteredSkus.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Product Info</th>
              <th>Brand & Category</th>
              <th>SKU ID</th>
              <th>Prices (MRP/Sale)</th>
              <th>Delivery</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>Loading Inventory...</td></tr>
            ) : filteredSkus.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>No products found matching "{search}"</td></tr>
            ) : (
              filteredSkus.map(sku => (
                <tr key={sku._id}>
                  <td className="product-cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img 
                        src={getFullImageUrl(sku.imageUrl)} 
                        alt="" 
                        className="sku-image"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=100';
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{sku.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                          {sku.subVariants?.map((v: any, i: number) => (
                            <span key={i} style={{ marginRight: '8px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                              {v.title}: {v.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sku.brand || 'N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sku.category} / {sku.subCategory}</div>
                  </td>
                  <td className="sku-id" style={{ fontFamily: 'monospace', fontWeight: 600, color: '#64748b' }}>{sku.sku}</td>
                  <td>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textDecoration: 'line-through' }}>MRP: ₹{sku.mrp || 0}</div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Sale: ₹{sku.salePrice || sku.price}</div>
                  </td>
                  <td><span style={{ fontSize: '0.85rem' }}>{sku.deliveryTime || 'N/A'}</span></td>
                  <td>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{sku.stock || 240} {sku.unitLabel}s</span>
                  </td>
                  <td className="actions-cell">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn" onClick={() => openEdit(sku)} title="Edit"><Edit3 size={16} /></button>
                      <button className="icon-btn delete" onClick={() => handleDelete(sku._id)} title="Delete"><Trash2 size={16} /></button>
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
          <div className="modal-content card" style={{ maxWidth: '900px' }}>
            <div className="modal-header space-between" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{editingSku ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Product Name</label>
                  <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>SKU / Product Code</label>
                  <input type="text" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} required />
                </div>
                
                <div className="form-group">
                  <label>Brand</label>
                  <select 
                    value={formData.brand || ''} 
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                  >
                    <option value="">Select Brand...</option>
                    {masterBrands.map(b => (
                      <option key={b._id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={formData.category || ''} 
                    onChange={e => setFormData({...formData, category: e.target.value, subCategory: ''})}
                  >
                    <option value="">Select Category...</option>
                    {masterCategories.map(mc => (
                      <option key={mc._id} value={mc.name}>{mc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sub Category</label>
                  <select 
                    value={formData.subCategory || ''} 
                    onChange={e => setFormData({...formData, subCategory: e.target.value})}
                  >
                    <option value="">Select Sub-Category...</option>
                    {masterSubCategories
                      .filter(sc => {
                        const parentCat = masterCategories.find(mc => mc.name === formData.category);
                        return !formData.category || (sc.categoryId?._id === parentCat?._id || sc.categoryId === parentCat?._id);
                      })
                      .map(sc => (
                        <option key={sc._id} value={sc.name}>{sc.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="form-group">
                  <label>Primary Attribute (Size/Color/etc)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      value={formData.size || ''} 
                      onChange={e => setFormData({...formData, size: e.target.value})}
                      style={{ flex: 1 }}
                    >
                      <option value="">Select Title...</option>
                      {masterVariantTitles.map(t => (
                        <option key={t._id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                    <input 
                      type="text" 
                      placeholder="Value" 
                      value={formData.subVariants?.[0]?.value || ''} 
                      onChange={e => {
                        const newSubs = [...(formData.subVariants || [])];
                        if (newSubs.length === 0) newSubs.push({ title: formData.size, value: e.target.value });
                        else newSubs[0].value = e.target.value;
                        setFormData({...formData, subVariants: newSubs});
                      }}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label>Additional Attributes</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                    {(formData.subVariants || []).slice(1).map((sv, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '4px' }}>
                        <select 
                          value={sv.title} 
                          onChange={e => {
                            const newSubs = [...formData.subVariants];
                            newSubs[idx + 1].title = e.target.value;
                            setFormData({...formData, subVariants: newSubs});
                          }}
                        >
                          {masterVariantTitles.map(t => (
                            <option key={t._id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                        <input 
                          type="text" 
                          value={sv.value} 
                          onChange={e => {
                            const newSubs = [...formData.subVariants];
                            newSubs[idx + 1].value = e.target.value;
                            setFormData({...formData, subVariants: newSubs});
                          }}
                        />
                        <button type="button" onClick={() => setFormData({...formData, subVariants: formData.subVariants.filter((_, i) => i !== idx + 1)})} className="icon-btn delete"><X size={14} /></button>
                      </div>
                    ))}
                    <button type="button" className="secondary-btn" onClick={() => setFormData({...formData, subVariants: [...(formData.subVariants || []), { title: masterVariantTitles[0]?.name || '', value: '' }]})} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                      <Plus size={14} /> Add Attribute
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Delivery Time</label>
                  <select 
                    value={formData.deliveryTime || ''} 
                    onChange={e => setFormData({...formData, deliveryTime: e.target.value})}
                  >
                    <option value="">Select Delivery Time...</option>
                    {masterDeliveryTimes.map(dt => (
                      <option key={dt._id} value={dt.name}>{dt.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Unit Type</label>
                  <select value={formData.unitType || 'individual'} onChange={e => setFormData({...formData, unitType: e.target.value})}>
                    <option value="individual">Individual</option>
                    <option value="weight-based">Weight Based</option>
                    <option value="pack">Pack</option>
                    <option value="bundle">Bundle</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit Label</label>
                  <select 
                    value={formData.unitLabel || ''} 
                    onChange={e => setFormData({...formData, unitLabel: e.target.value})}
                  >
                    <option value="">Select Unit...</option>
                    {masterUnits.map(u => (
                      <option key={u._id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>CSI Code</label>
                  <input type="text" value={formData.csiMasterFormat || ''} onChange={e => setFormData({...formData, csiMasterFormat: e.target.value})} />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 3' }}>
                  <label>Image URL</label>
                  <input type="text" placeholder="/images/..." value={formData.imageUrl || ''} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Progress Indicator */}
      {uploadProgress.active && (
        <div className="upload-progress-container">
          <div className="space-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Uploading Excel...</span>
            <span style={{ fontWeight: 800, color: '#3b82f6' }}>{uploadProgress.percentage}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${uploadProgress.percentage}%` }}></div>
          </div>
        </div>
      )}

      {/* Upload Results Modal */}
      {uploadResult && uploadResult.summary && (
        <div className="modal-overlay">
          <div className="modal-content card results-modal">
            <div className="modal-header space-between" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 color="#22c55e" size={24} />
                <h2 style={{ margin: 0 }}>Upload Summary</h2>
              </div>
              <button className="icon-btn" onClick={() => setUploadResult(null)}><X size={20} /></button>
            </div>

            <div className="summary-grid">
              <div className="summary-card">
                <span className="value">{uploadResult.summary.totalRows}</span>
                <span className="label">Total Rows</span>
              </div>
              <div className="summary-card">
                <span className="value" style={{ color: '#22c55e' }}>{uploadResult.summary.extracted}</span>
                <span className="label">Processed</span>
              </div>
              <div className="summary-card">
                <span className="value" style={{ color: '#ef4444' }}>{uploadResult.summary.skipped}</span>
                <span className="label">Skipped</span>
              </div>
              <div className="summary-card">
                <span className="value" style={{ color: '#3b82f6' }}>{uploadResult.summary.upserted}</span>
                <span className="label">New/Updated</span>
              </div>
            </div>

            {uploadResult.skippedDetails && uploadResult.skippedDetails.length > 0 && (
              <div className="skipped-section">
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} color="#ef4444" /> Skipped Rows Reasons
                </h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table className="skipped-table">
                    <thead>
                      <tr>
                        <th>Row #</th>
                        <th>Product Name</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.skippedDetails.map((detail: any, i: number) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 700 }}>{detail.row}</td>
                          <td>{detail.name}</td>
                          <td><span className="badge-error">{detail.reason}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="modal-footer" style={{ marginTop: '2rem', textAlign: 'right' }}>
              <button className="primary-btn" onClick={() => setUploadResult(null)}>Close Results</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default SKUManager;

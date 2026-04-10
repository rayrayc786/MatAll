import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, FileUp, Edit3, Trash2, X, CheckCircle2, AlertCircle, Star, Menu, Eye, EyeOff, Truck } from 'lucide-react';
import { getFullImageUrl } from '../../utils/imageUrl';
import './sku.css';

const SKUManager: React.FC = () => {
  const navigate = useNavigate();
  const [skus, setSkus] = useState<any[]>([]);
  const [masterCategories, setMasterCategories] = useState<any[]>([]);
  const [masterSubCategories, setMasterSubCategories] = useState<any[]>([]);
  const [masterBrands, setMasterBrands] = useState<any[]>([]);
  const [masterUnits, setMasterUnits] = useState<any[]>([]);
  const [masterDeliveryTimes, setMasterDeliveryTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSku, setEditingSku] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ active: boolean; percentage: number }>({ active: false, percentage: 0 });
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productTab, setProductTab] = useState<'general' | 'variants' | 'images'>('general');

  const [formData, setFormData] = useState({
    productName: '',
    name: '',
    sku: '',
    productCode: '',
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
    subVariants: [] as any[],
    isPopular: false,
    isActive: true,
    infoPara: '',
    description: '',
    bulkPricing: [] as any[],
    variants: [] as any[],
    images: [] as any[]
  });

  const fetchSKUs = async () => {
    try {
      // Use the Admin-specific products endpoint to see individual entries (ungrouped)
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products`);
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

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/upload-image`, uploadData);
      setFormData({
        ...formData,
        images: [...(formData.images || []), data.imageUrl]
      });
    } catch (err) {
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVariantImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/upload-image`, uploadData);
      const newV = [...formData.variants];
      newV[idx].images = [...(newV[idx].images || []), data.imageUrl];
      // For fallback/compatibility, if variant has no primary imageUrl set, use the first one
      if (!newV[idx].imageUrl) newV[idx].imageUrl = data.imageUrl;
      setFormData({
        ...formData,
        variants: newV
      });
    } catch (err) {
      alert('Upload failed');
    } finally {
      setLoading(false);
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

  const filteredSkus = skus.filter(s => {
    const searchLower = search.toLowerCase();
    const matchesMain = (s.productName || s.name || '').toLowerCase().includes(searchLower) || 
      (s.sku || '').toLowerCase().includes(searchLower) ||
      (s.brand || '').toLowerCase().includes(searchLower) ||
      (s.category || '').toLowerCase().includes(searchLower) ||
      (s.subCategory || '').toLowerCase().includes(searchLower) ||
      (s.csiMasterFormat && s.csiMasterFormat.toLowerCase().includes(searchLower));

    if (matchesMain) return true;

    // Search in variants
    if (s.variants && Array.isArray(s.variants)) {
      return s.variants.some((v: any) => 
        (v.name || '').toLowerCase().includes(searchLower) || 
        (v.sku || '').toLowerCase().includes(searchLower)
      );
    }

    return false;
  });

  const totalVariantCount = skus.reduce((sum, s) => sum + (s.variants?.length || 1), 0);
  const filteredVariantCount = filteredSkus.reduce((sum, s) => sum + (s.variants?.length || 1), 0);

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
      toast.success(editingSku ? 'Product updated successfully!' : 'New product created!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save product');
    }
  };

  const handleTogglePopular = async (id: string) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/${id}/toggle-popular`);
      fetchSKUs();
      toast.success('Product status updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update product status');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/${id}/toggle-active`);
      fetchSKUs();
      toast.success('Visibility updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update visibility');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/${id}`);
      fetchSKUs();
      toast.success('Product deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete product');
    }
  };

  const openEdit = (sku: any) => {
    setEditingSku(sku);
    setFormData({
      productName: sku.productName || sku.name || '',
      name: sku.name || '',
      sku: sku.sku || '',
      productCode: sku.productCode || '',
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
      mrp: sku.mrp || sku.variants?.[0]?.pricing?.mrp || 0,
      salePrice: sku.salePrice || sku.price || sku.variants?.[0]?.pricing?.salePrice || 0,
      deliveryTime: sku.deliveryTime || '',
      size: sku.size || sku.subVariants?.[0]?.title || '',
      subVariants: sku.subVariants || [],
      isPopular: sku.isPopular || false,
      isActive: sku.isActive !== false,
      infoPara: sku.infoPara || '',
      description: sku.description || '',
      bulkPricing: sku.bulkPricing || [],
      variants: (sku.variants || []).map((v: any) => ({
        ...v,
        productCode: v.productCode || sku.productCode || ''
      })),
      images: sku.images || [sku.imageUrl].filter(Boolean)
    });
    setProductTab('general');
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingSku(null);
    setFormData({
      productName: '',
      name: '',
      sku: '',
      productCode: '',
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
      subVariants: [],
      isPopular: false,
      isActive: true,
      infoPara: '',
      description: '',
      bulkPricing: [],
      variants: [],
      images: []
    });
    setProductTab('general');
    setShowModal(true);
  };

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-admin-sidebar'));
  };

  return (
    <main className="admin-content">
      <header className="admin-header space-between sku-header">
        <div className="title-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="mobile-menu-trigger" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <div className="header-text">
            <h1>SKU & Inventory Manager</h1>
            <p>Master database for industrial materials & Smart Units</p>
          </div>
        </div>
        <div className="action-group sku-action-group">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden-file-input" 
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
          />
          <button className="secondary-btn" onClick={() => fileInputRef.current?.click()}>
            <FileUp size={18} /> Bulk Upload (Excel)
          </button>
          <button className="secondary-btn sku-clear-all-btn" onClick={handleClearAll}>
            <Trash2 size={18} /> Clear All
          </button>
          <button className="secondary-btn" onClick={() => navigate('/admin?tab=actions&sub=settings')}>
             <Truck size={18} /> Global Fees
           </button>
           <button className="add-sku-btn" onClick={resetForm}>
             <Plus size={18} /> New Product SKU
           </button>
        </div>
      </header>

      <div className="card sku-search-card">
        <div className="sku-search-container">
          <div className="search-group sku-search-group">
            <Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search by SKU, Name, Brand, or Category..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sku-search-input"
            />
          </div>
          <div className="quick-stats sku-quick-stats">
            <div className="q-stat">
              <span className="q-stat-label">TOTAL LISTINGS</span>
              <span className="q-stat-value">{skus.length}</span>
            </div>
            <div className="q-stat">
              <span className="q-stat-label">TOTAL SKUS</span>
              <span className="q-stat-value" style={{ color: '#0369a1' }}>{totalVariantCount}</span>
            </div>
            <div className="q-stat">
              <span className="q-stat-label">FILTERED</span>
              <span className="q-stat-value">{filteredSkus.length} Items ({filteredVariantCount} SKUs)</span>
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
              <tr><td colSpan={7} className="loading-cell">Loading Inventory...</td></tr>
            ) : filteredSkus.length === 0 ? (
              <tr><td colSpan={7} className="empty-cell">No products found matching "{search}"</td></tr>
            ) : (
              filteredSkus.map(sku => (
                <tr key={sku._id} className={!sku.isActive ? 'sku-row-inactive' : ''}>
                  <td className="product-cell">
                    <div className="sku-product-info">
                      <img 
                        src={getFullImageUrl(sku.imageUrl)} 
                        alt="" 
                        className="sku-image"
                        // onError={(e) => {
                        //   (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=100';
                        // }}
                      />
                      <div>
                        <div className="sku-product-name">{sku.productName || sku.name}</div>
                        <div className="sku-variant-badges">
                          {sku.variants && sku.variants.length > 0 ? (
                            <div className="sku-grouped-info">
                              <span className="sku-variant-badge group-count">
                                {sku.variants.length} SKU{sku.variants.length > 1 ? 's' : ''} Linked
                              </span>
                              <div className="sku-variant-preview">
                                {sku.variants.slice(0, 3).map((v: any, i: number) => (
                                  <span key={i} className="preview-tag">{v.name || v.sku}</span>
                                ))}
                                {sku.variants.length > 3 && <span className="preview-tag">+{sku.variants.length - 3} more</span>}
                              </div>
                            </div>
                          ) : (
                            sku.subVariants?.map((v: any, i: number) => (
                              <span key={i} className="sku-variant-badge">
                                {v.title}: {v.value}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="sku-brand-name">{sku.brand || 'N/A'}</div>
                    <div className="sku-category-path">{sku.category} / {sku.subCategory}</div>
                  </td>
                  <td className="sku-id sku-id-text">
                    {sku.variants && sku.variants.length > 1 ? 'Multiple SKUs' : sku.sku}
                  </td>
                  <td>
                    {sku.variants && sku.variants.length > 1 ? (
                      <div className="sku-sale-price">Multiple Prices</div>
                    ) : (
                      <>
                        <div className="sku-mrp-text">MRP: ₹{(sku.mrp || 0).toFixed(2)}</div>
                        <div className="sku-sale-price">Sale: ₹{(sku.salePrice || sku.price || 0).toFixed(2)}</div>
                      </>
                    )}
                  </td>
                  <td><span className="sku-delivery-text">{sku.deliveryTime || 'N/A'}</span></td>
                  <td>
                    <span className="sku-stock-text">{sku.stock || 240} {sku.unitLabel}s</span>
                  </td>
                  <td className="actions-cell">
                    <div className="sku-actions-container">
                      <button 
                        className={`icon-btn visibility-btn ${!sku.isActive ? 'is-inactive' : ''}`} 
                        onClick={() => handleToggleActive(sku._id)} 
                        title={sku.isActive ? "Hide from Store" : "Show on Store"}
                      >
                        {sku.isActive ? <Eye size={16} /> : <EyeOff size={16} color="#ef4444" />}
                      </button>
                      <button 
                        className={`icon-btn star-btn ${sku.isPopular ? 'is-popular' : ''}`} 
                        onClick={() => handleTogglePopular(sku._id)} 
                        title={sku.isPopular ? "Remove from Popular" : "Mark as Popular"}
                      >
                        <Star size={16} fill={sku.isPopular ? "#FFEA00" : "none"} />
                      </button>
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
          <div className="modal-content card sku-modal-content">
            <div className="modal-header space-between sku-modal-header">
              <h2 className="sku-modal-title">{editingSku ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="admin-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <button type="button" className={`pill ${productTab === 'general' ? 'active font-bold' : 'text-gray-500'}`} onClick={() => setProductTab('general')}>General Info</button>
                <button type="button" className={`pill ${productTab === 'variants' ? 'active font-bold' : 'text-gray-500'}`} onClick={() => setProductTab('variants')}>Product Variants</button>
                <button type="button" className={`pill ${productTab === 'images' ? 'active font-bold' : 'text-gray-500'}`} onClick={() => setProductTab('images')}>Media/Images</button>
              </div>

              <div className="form-grid sku-form-grid">
                {productTab === 'general' && (
                  <>
                    <div className="form-group sku-form-span-2">
                      <label>Product Name</label>
                      <input type="text" value={formData.productName || formData.name || ''} onChange={e => setFormData({...formData, productName: e.target.value, name: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Product Code</label>
                      <input type="text" value={formData.productCode || ''} onChange={e => setFormData({...formData, productCode: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>SKU (for variants)</label>
                      <input type="text" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} />
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
                      <label>Weight (kg)</label>
                      <input type="number" value={formData.weightPerUnit || 0} onChange={e => setFormData({...formData, weightPerUnit: Number(e.target.value)})} />
                    </div>
                    <div className="form-group">
                      <label>Volume (m³)</label>
                      <input type="number" value={formData.volumePerUnit || 0} onChange={e => setFormData({...formData, volumePerUnit: Number(e.target.value)})} />
                    </div>
                    <div className="form-group">
                      <label>CSI Code</label>
                      <input type="text" value={formData.csiMasterFormat || ''} onChange={e => setFormData({...formData, csiMasterFormat: e.target.value})} />
                    </div>

                    <div className="form-group">
                      <label>MRP (₹)</label>
                      <input type="number" value={formData.mrp || 0} onChange={e => setFormData({...formData, mrp: Number(e.target.value)})} />
                    </div>
                    <div className="form-group">
                      <label>Sale Price (₹)</label>
                      <input type="number" value={formData.salePrice || formData.price || 0} onChange={e => setFormData({...formData, salePrice: Number(e.target.value), price: Number(e.target.value)})} />
                    </div>

                    <div className="form-group sku-form-span-3">
                      <label>Short Description (Technical)</label>
                      <textarea 
                        rows={2}
                        placeholder="Technical specs, brief summary..."
                        value={formData.description || ''} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '10px' }}
                      />
                    </div>

                    <div className="form-group sku-form-span-3">
                      <label>Information Paragraph (Dynamic)</label>
                      <textarea 
                        rows={3}
                        placeholder="Enter product detailed information..." 
                        value={formData.infoPara || ''} 
                        onChange={e => setFormData({...formData, infoPara: e.target.value})}
                        style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '10px' }}
                      />
                    </div>

                    <div className="form-group sku-form-span-3">
                      <h4 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Bulk Pricing Tiers</h4>
                      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                        {(formData.bulkPricing || []).map((tier: any, i: number) => (
                          <React.Fragment key={i}>
                            <div className="form-group">
                              <label>Min Qty</label>
                              <input type="number" value={tier.minQty} onChange={e => {
                                const newBulk = [...formData.bulkPricing];
                                newBulk[i].minQty = Number(e.target.value);
                                setFormData({...formData, bulkPricing: newBulk});
                              }} />
                            </div>
                            <div className="form-group">
                              <label>Discount (%)</label>
                              <input type="number" value={tier.discount} onChange={e => {
                                const newBulk = [...formData.bulkPricing];
                                newBulk[i].discount = Number(e.target.value);
                                setFormData({...formData, bulkPricing: newBulk});
                              }} />
                            </div>
                            <button type="button" className="icon-btn delete" onClick={() => {
                              const newBulk = formData.bulkPricing.filter((_: any, idx: number) => idx !== i);
                              setFormData({...formData, bulkPricing: newBulk});
                            }} style={{ marginBottom: '8px' }}><Trash2 size={16} /></button>
                          </React.Fragment>
                        ))}
                      </div>
                      <button type="button" className="secondary-btn" onClick={() => {
                        setFormData({...formData, bulkPricing: [...(formData.bulkPricing || []), { minQty: 0, discount: 0 }]});
                      }} style={{ marginTop: '1rem' }}>+ Add Pricing Tier</button>
                    </div>

                    <div className="form-group sku-form-span-3">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={formData.isPopular} 
                          onChange={e => setFormData({...formData, isPopular: e.target.checked})} 
                        />
                        Mark as Popular Demand
                      </label>
                      <label className="checkbox-label" style={{ marginLeft: '2rem' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.isActive} 
                          onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                        />
                        Product Active (Visible on App)
                      </label>
                    </div>
                  </>
                )}

                {productTab === 'variants' && (
                  <div className="form-group sku-form-span-3">
                    <h4 style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>Manage Variants</h4>
                    {(formData.variants || []).map((v: any, idx: number) => (
                      <div key={idx} style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.5rem', background: '#f8fafc' }}>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label>Variant Name (e.g. 10mm thickness, 8x4 size)</label>
                          <input type="text" value={v.name || ''} onChange={(e) => {
                            const newV = [...formData.variants];
                            newV[idx].name = e.target.value;
                            setFormData({...formData, variants: newV});
                          }} />
                        </div>
                        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                          <div className="form-group">
                            <label>Price (₹)</label>
                            <input type="number" value={v.price || v.pricing?.salePrice || 0} onChange={(e) => {
                              const newV = [...formData.variants];
                              newV[idx].price = Number(e.target.value);
                              // Sync with pricing object if it exists
                              if (newV[idx].pricing) {
                                newV[idx].pricing.salePrice = Number(e.target.value);
                              } else {
                                newV[idx].pricing = { salePrice: Number(e.target.value), mrp: v.mrp || 0 };
                              }
                              setFormData({...formData, variants: newV});
                            }} />
                          </div>
                          <div className="form-group">
                            <label>Product Code</label>
                            <input type="text" value={v.productCode || ''} onChange={(e) => {
                              const newV = [...formData.variants];
                              newV[idx].productCode = e.target.value;
                              setFormData({...formData, variants: newV});
                            }} />
                          </div>
                          <div className="form-group">
                            <label>SKU Number</label>
                            <input type="text" value={v.sku || ''} onChange={(e) => {
                              const newV = [...formData.variants];
                              newV[idx].sku = e.target.value;
                              setFormData({...formData, variants: newV});
                            }} />
                          </div>
                        </div>

                        {/* Variant Image Manager */}
                        <div style={{ marginTop: '1.5rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Variant Specific Images</label>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {(v.images || []).map((img: string, i: number) => (
                              <div key={i} style={{ position: 'relative', width: '60px', height: '60px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                <img src={getFullImageUrl(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button type="button" onClick={() => {
                                  const newV = [...formData.variants];
                                  newV[idx].images = newV[idx].images.filter((_: any, idx2: number) => idx2 !== i);
                                  setFormData({...formData, variants: newV});
                                }} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: '#fff', fontSize: '10px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                              </div>
                            ))}
                            <label style={{ width: '60px', height: '60px', border: '2px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff' }}>
                              <Plus size={20} color="#64748b" />
                              <input type="file" hidden onChange={(e) => handleVariantImageUpload(idx, e)} accept="image/*" />
                            </label>
                          </div>
                        </div>

                        <button type="button" className="secondary-btn" style={{ marginTop: '1rem', background: '#fee2e2', color: '#ef4444', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setFormData({...formData, variants: formData.variants.filter((_, i) => i !== idx)})}>
                           <Trash2 size={16} /> Remove Variant
                        </button>
                      </div>
                    ))}
                    <button type="button" className="secondary-btn" style={{ width: '100%', padding: '15px', borderStyle: 'dashed', background: 'transparent' }} onClick={() => setFormData({...formData, variants: [...(formData.variants || []), { name: '', price: 0, sku: '', images: [], pricing: { salePrice: 0, mrp: 0 } }]})}>
                      <Plus size={18} /> Add New Variant SKU
                    </button>
                  </div>
                )}

                {productTab === 'images' && (
                  <div className="form-group sku-form-span-3">
                    <h4 style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>Product Media Gallery</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      {(formData.images || []).map((imgUrl: string, idx: number) => (
                        <div key={idx} style={{ position: 'relative', aspectRatio: '1/1', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                          <img src={getFullImageUrl(imgUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => setFormData({...formData, images: formData.images.filter((_, i) => i !== idx)})} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <X size={16} color="#ef4444" />
                          </button>
                        </div>
                      ))}
                      <label style={{ aspectRatio: '1/1', border: '3px dashed #cbd5e1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', background: '#f1f5f9', transition: 'all 0.2s' }}>
                        <Plus size={32} />
                        <span style={{ fontSize: '0.9rem', marginTop: '4px', fontWeight: 'bold' }}>Upload Media</span>
                        <input type="file" hidden onChange={handleProductImageUpload} accept="image/*" />
                      </label>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Upload high-resolution product images. Safe to upload up to 5 images.</p>
                  </div>
                )}
              </div>
              <div className="modal-footer sku-modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save {productTab === 'general' ? 'Basic Info' : (productTab === 'variants' ? 'Variants' : 'Product Media')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Progress Indicator */}
      {uploadProgress.active && (
        <div className="upload-progress-container">
          <div className="space-between sku-upload-progress-info">
            <span className="sku-upload-status">Uploading Excel...</span>
            <span className="sku-upload-percentage">{uploadProgress.percentage}%</span>
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
            <div className="modal-header space-between sku-modal-header">
              <div className="sku-results-header-info">
                <CheckCircle2 color="#22c55e" size={24} />
                <h2 className="sku-results-title">Upload Summary</h2>
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
                <h3 className="skipped-section-title">
                  <AlertCircle size={18} color="#ef4444" /> Skipped Rows Reasons
                </h3>
                <div className="skipped-table-container">
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

            <div className="modal-footer sku-results-footer">
              <button className="primary-btn" onClick={() => setUploadResult(null)}>Close Results</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default SKUManager;

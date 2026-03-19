import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Search, FileUp, Edit3, Trash2, X } from 'lucide-react';

const SKUManager: React.FC = () => {
  const [skus, setSkus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSku, setEditingSku] = useState<any>(null);
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
    csiMasterFormat: ''
  });

  const fetchSKUs = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products`);
      setSkus(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSKUs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/bulk-upload`, formData);
      alert('Products uploaded successfully');
      fetchSKUs();
    } catch (err) {
      console.error(err);
      alert('Failed to upload products');
    } finally {
      setLoading(false);
    }
  };

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
      name: sku.name,
      sku: sku.sku,
      unitType: sku.unitType,
      unitLabel: sku.unitLabel,
      weightPerUnit: sku.weightPerUnit,
      volumePerUnit: sku.volumePerUnit,
      price: sku.price,
      imageUrl: sku.imageUrl || '',
      csiMasterFormat: sku.csiMasterFormat || ''
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
      csiMasterFormat: ''
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
          <button className="add-sku-btn" onClick={resetForm}>
            <Plus size={18} /> New Product SKU
          </button>
        </div>
      </header>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-group" style={{ flex: '0 1 400px', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Search size={18} color="#64748b" />
            <input type="text" placeholder="Search by SKU, Name, or CSI code..." style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} />
          </div>
          <div className="quick-stats" style={{ display: 'flex', gap: '2rem' }}>
            <div className="q-stat">
              <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>TOTAL SKUS</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{skus.length}</span>
            </div>
            <div className="q-stat">
              <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>LOW STOCK</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>5</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="sku-table">
          <thead>
            <tr>
              <th>Product Info</th>
              <th>SKU ID</th>
              <th>Smart Unit</th>
              <th>Unit Weight</th>
              <th>Base Price</th>
              <th>Stock Level</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>Loading Inventory...</td></tr>
            ) : (
              skus.map(sku => (
                <tr key={sku._id}>
                  <td className="product-cell">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={sku.imageUrl || 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecb?auto=format&fit=crop&q=80&w=100'} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{sku.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>CSI: {sku.csiMasterFormat || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="sku-id" style={{ fontFamily: 'monospace', fontWeight: 600, color: '#64748b' }}>{sku.sku}</td>
                  <td><span className="unit-badge">{sku.unitType}</span></td>
                  <td style={{ fontWeight: 600 }}>{sku.weightPerUnit} kg</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>₹{sku.price.toFixed(2)}</td>
                  <td>
                    <div className="stock-bar-mini">
                      <div className="fill" style={{ width: '85%' }}></div>
                    </div>
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
          <div className="modal-content card">
            <div className="modal-header space-between" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{editingSku ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>SKU ID</label>
                  <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Unit Type</label>
                  <select value={formData.unitType} onChange={e => setFormData({...formData, unitType: e.target.value})}>
                    <option value="individual">Individual</option>
                    <option value="weight-based">Weight Based</option>
                    <option value="pack">Pack</option>
                    <option value="bundle">Bundle</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit Label (e.g. kg, lbs, bag)</label>
                  <input type="text" value={formData.unitLabel} onChange={e => setFormData({...formData, unitLabel: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} required />
                </div>
                <div className="form-group">
                  <label>Weight per Unit (kg)</label>
                  <input type="number" step="0.1" value={formData.weightPerUnit} onChange={e => setFormData({...formData, weightPerUnit: parseFloat(e.target.value)})} required />
                </div>
                <div className="form-group">
                  <label>Volume per Unit</label>
                  <input type="number" step="0.1" value={formData.volumePerUnit} onChange={e => setFormData({...formData, volumePerUnit: parseFloat(e.target.value)})} required />
                </div>
                <div className="form-group">
                  <label>CSI Code</label>
                  <input type="text" value={formData.csiMasterFormat} onChange={e => setFormData({...formData, csiMasterFormat: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                  <label>Image URL</label>
                  <input type="text" placeholder="https://images.unsplash.com/..." value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
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
    </main>
  );
};

export default SKUManager;

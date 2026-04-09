import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Package, 
  Layers, 
  Clock,
  Search,
  Edit2,
  ChevronRight,
  User,
  Plus,
  Trash2,
  X,
  FileUp,
  Image,
  Menu
} from 'lucide-react';
import { getFullImageUrl } from '../../utils/imageUrl';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './admin-dashboard.css';
import Reports from '../Reports';
import FooterManager from './FooterManager';
import ServiceSettings from './ServiceSettings';
import ReviewManager from './ReviewManager';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { adminSocket, connectSocket } from '../../socket';
import './admin-dashboard.css';

function ManagementModal({ 
  showModal, setShowModal, editingItem, activeActionTab, formData, setFormData, 
  handleAction, userTab, setUserTab, productTab, setProductTab, 
  userOrders, fetchUserOrders, handleProductImageUpload, handleCategoryImageUpload 
}: any) {
  if (!showModal) return null;
  const isEditing = !!editingItem;
  const type = activeActionTab;

  return (
    <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
      <div className="admin-modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? 'Edit' : 'Add New'} {type === 'users' ? 'User' : (type === 'categories' ? 'Category' : 'Product')}</h3>
          <button type="button" className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
        </div>
        
        <div className="modal-body">
          {type === 'products' && (
            <div className="modal-scroll-area">
              <div className="admin-modal-tabs">
                <button type="button" className={productTab === 'general' ? 'active' : ''} onClick={() => setProductTab('general')}>General</button>
                <button type="button" className={productTab === 'variants' ? 'active' : ''} onClick={() => setProductTab('variants')}>Variants</button>
                <button type="button" className={productTab === 'images' ? 'active' : ''} onClick={() => setProductTab('images')}>Images</button>
              </div>

              {productTab === 'general' && (
                <>
                  <div className="input-group-admin">
                    <label>Product Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Century Ply Sainik 710"
                      value={formData.name || ''} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>
                  <div className="input-row-admin">
                     <div className="input-group-admin">
                        <label>SKU (Product Code)</label>
                        <input 
                          type="text" 
                          placeholder="FLY-CEN-710" 
                          value={formData.sku || ''} 
                          onChange={e => setFormData({...formData, sku: e.target.value})} 
                        />
                     </div>
                     <div className="input-group-admin">
                        <label>Brand</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Century" 
                          value={formData.brand || ''} 
                          onChange={e => setFormData({...formData, brand: e.target.value})} 
                        />
                     </div>
                  </div>
                  <div className="input-row-admin">
                     <div className="input-group-admin">
                        <label>Category</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Plywood" 
                          value={formData.category || ''} 
                          onChange={e => setFormData({...formData, category: e.target.value})} 
                        />
                     </div>
                     <div className="input-group-admin">
                        <label>Sub Category</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Marine Grade" 
                          value={formData.subCategory || ''} 
                          onChange={e => setFormData({...formData, subCategory: e.target.value})} 
                        />
                     </div>
                  </div>
                  <div className="input-row-admin">
                     <div className="input-group-admin">
                        <label>Price (₹)</label>
                        <input 
                          type="number" 
                          value={formData.price || ''} 
                          onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                        />
                     </div>
                     <div className="input-group-admin">
                        <label>MRP (₹)</label>
                        <input 
                          type="number" 
                          value={formData.mrp || ''} 
                          onChange={e => setFormData({...formData, mrp: Number(e.target.value)})} 
                        />
                     </div>
                  </div>
                  <div className="input-row-admin">
                     <div className="input-group-admin">
                        <label>Weight (kg)</label>
                        <input 
                          type="number" 
                          value={formData.weightPerUnit || 0} 
                          onChange={e => setFormData({...formData, weightPerUnit: Number(e.target.value)})} 
                        />
                     </div>
                     <div className="input-group-admin">
                        <label>Volume (m³)</label>
                        <input 
                          type="number" 
                          value={formData.volumePerUnit || 0} 
                          onChange={e => setFormData({...formData, volumePerUnit: Number(e.target.value)})} 
                        />
                     </div>
                  </div>
                  <div className="input-group-admin">
                    <label>Short Description (Technical)</label>
                    <textarea 
                      rows={2}
                      placeholder="Technical specs, brief summary..."
                      value={formData.description || ''} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                    />
                  </div>
                  <div className="input-group-admin">
                    <label>Detailed Information Paragraph (SEO / Marketing)</label>
                    <textarea 
                      rows={3}
                      placeholder="Enter full marketing or informational text..."
                      value={formData.infoPara || ''} 
                      onChange={e => setFormData({...formData, infoPara: e.target.value})} 
                    />
                  </div>
                  
                  <div className="input-group-admin bulk-pricing-section">
                     <h5 style={{ marginTop: '1rem', marginBottom: '0.8rem', fontWeight: '800' }}>Bulk Pricing Tiers</h5>
                     {(formData.bulkPricing || []).map((tier: any, i: number) => (
                       <div key={i} className="input-row-admin bulk-row">
                         <input 
                           type="number" 
                           placeholder="Min Qty" 
                           value={tier.minQty} 
                           onChange={e => {
                             const newBulk = [...formData.bulkPricing];
                             newBulk[i].minQty = Number(e.target.value);
                             setFormData({...formData, bulkPricing: newBulk});
                           }} 
                         />
                         <input 
                           type="number" 
                           placeholder="Discount %" 
                           value={tier.discount} 
                           onChange={e => {
                             const newBulk = [...formData.bulkPricing];
                             newBulk[i].discount = Number(e.target.value);
                             setFormData({...formData, bulkPricing: newBulk});
                           }} 
                         />
                         <button type="button" className="remove-row" onClick={() => {
                           const newBulk = formData.bulkPricing.filter((_: any, idx: number) => idx !== i);
                           setFormData({...formData, bulkPricing: newBulk});
                         }}><X size={16} /></button>
                       </div>
                     ))}
                     <button type="button" onClick={() => {
                       setFormData({...formData, bulkPricing: [...(formData.bulkPricing || []), { minQty: 0, discount: 0 }]});
                     }} className="add-tier-btn">+ Add Pricing Tier</button>
                  </div>
                  <div className="input-row-admin">
                     <div className="input-group-admin checkbox">
                        <input 
                          type="checkbox" 
                          id="prodActive"
                          checked={formData.isActive !== false} 
                          onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                        />
                        <label htmlFor="prodActive">Is Active</label>
                     </div>
                     <div className="input-group-admin checkbox">
                        <input 
                          type="checkbox" 
                          id="prodPopular"
                          checked={!!formData.isPopular} 
                          onChange={e => setFormData({...formData, isPopular: e.target.checked})} 
                        />
                        <label htmlFor="prodPopular">Mark as Popular</label>
                     </div>
                  </div>
                </>
              )}

              {productTab === 'variants' && (
                <div>
                  <h4 style={{ marginBottom: '1.25rem', fontWeight: '800' }}>Product Variants</h4>
                  {(formData.variants || []).map((v: any, idx: number) => (
                    <div key={idx} className="variant-item-card">
                      <div className="input-group-admin">
                        <label>Variant Name (e.g. 10mm thickness, 8x4 size)</label>
                        <input type="text" value={v.name || ''} onChange={(e) => {
                          const newV = [...(formData.variants || [])];
                          newV[idx].name = e.target.value;
                          setFormData({...formData, variants: newV});
                        }} />
                      </div>
                      <div className="input-row-admin">
                        <div className="input-group-admin">
                          <label>Price (₹)</label>
                          <input type="number" value={v.price || 0} onChange={(e) => {
                            const newV = [...(formData.variants || [])];
                            newV[idx].price = Number(e.target.value);
                            setFormData({...formData, variants: newV});
                          }} />
                        </div>
                        <div className="input-group-admin">
                          <label>SKU</label>
                          <input type="text" value={v.sku || ''} onChange={(e) => {
                            const newV = [...(formData.variants || [])];
                            newV[idx].sku = e.target.value;
                            setFormData({...formData, variants: newV});
                          }} />
                        </div>
                      </div>
                      <button type="button" className="remove-variant-btn" onClick={() => {
                        const newV = formData.variants.filter((_: any, i: number) => i !== idx);
                        setFormData({...formData, variants: newV});
                      }}><Trash2 size={16} /> Remove Variant</button>
                    </div>
                  ))}
                  <button type="button" className="add-variant-btn" onClick={() => {
                    const newV = { name: '', price: 0, sku: '', weight: 0, volume: 0 };
                    setFormData({...formData, variants: [...(formData.variants || []), newV]});
                  }}>+ Add Variant</button>
                </div>
              )}

              {productTab === 'images' && (
                <div>
                  <h4 style={{ marginBottom: '1.25rem', fontWeight: '800' }}>Product Images</h4>
                  <div className="modal-images-grid">
                    {(formData.images || []).map((imgUrl: string, idx: number) => (
                      <div key={idx} className="modal-image-item">
                        <img src={getFullImageUrl(imgUrl)} alt="" />
                        <button type="button" className="remove-img" onClick={() => {
                          const newImgs = formData.images.filter((_: string, i: number) => i !== idx);
                          setFormData({...formData, images: newImgs});
                        }}><X size={14} /></button>
                      </div>
                    ))}
                    <label className="upload-image-label">
                      <Image size={24} />
                      <span>Add Image</span>
                      <input type="file" hidden accept="image/*" onChange={handleProductImageUpload} />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {type === 'users' && (
            <div className="modal-scroll-area">
              {isEditing && (
                <div className="admin-modal-tabs">
                  <button type="button" className={userTab === 'profile' ? 'active' : ''} onClick={() => setUserTab('profile')}>Profile</button>
                  <button type="button" className={userTab === 'addresses' ? 'active' : ''} onClick={() => setUserTab('addresses')}>Addresses</button>
                  <button type="button" className={userTab === 'orders' ? 'active' : ''} onClick={() => { setUserTab('orders'); fetchUserOrders(editingItem._id); }}>Orders</button>
                </div>
              )}
              
              {userTab === 'profile' && (
                <>
                  <div className="input-group-admin">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Rahul Arora"
                      value={formData.fullName || ''} 
                      onChange={e => setFormData({...formData, fullName: e.target.value})} 
                    />
                  </div>
                  <div className="input-group-admin">
                    <label>Phone Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 9988776655" 
                      value={formData.phoneNumber || ''} 
                      onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                    />
                  </div>
                  <div className="input-group-admin">
                    <label>Role</label>
                    <select 
                      value={formData.role || 'End User'} 
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="End User">End User</option>
                      <option value="Admin">Admin</option>
                      <option value="Supplier">Supplier</option>
                      <option value="Rider">Rider</option>
                    </select>
                  </div>
                </>
              )}

              {userTab === 'addresses' && (
                <div className="addresses-management">
                  <h4 style={{ marginBottom: '1.25rem', fontWeight: '800' }}>Manage Jobsites / Addresses</h4>
                  {(formData.jobsites || []).map((site: any, idx: number) => (
                    <div key={`site-card-${idx}`} className="site-item-card">
                      <div className="input-group-admin">
                        <label>Site / Address Name</label>
                        <input 
                          key={`site-name-${idx}`}
                          type="text" 
                          placeholder="e.g. Home, Site A" 
                          value={site.name || ''} 
                          onChange={(e) => {
                            const newSites = [...(formData.jobsites || [])];
                            newSites[idx] = { ...newSites[idx], name: e.target.value };
                            setFormData({...formData, jobsites: newSites});
                          }} 
                        />
                      </div>
                      <div className="input-group-admin">
                        <label>Full Address Text</label>
                        <input 
                          key={`site-addr-${idx}`}
                          type="text" 
                          placeholder="Complete address details" 
                          value={site.addressText || ''} 
                          onChange={(e) => {
                            const newSites = [...(formData.jobsites || [])];
                            newSites[idx] = { ...newSites[idx], addressText: e.target.value };
                            setFormData({...formData, jobsites: newSites});
                          }} 
                        />
                      </div>
                      <button type="button" className="remove-site-btn" onClick={() => {
                        const newSites = formData.jobsites.filter((_: any, i: number) => i !== idx);
                        setFormData({...formData, jobsites: newSites});
                      }}><Trash2 size={16} /> Remove Site</button>
                    </div>
                  ))}
                  <button type="button" className="add-site-btn" onClick={() => {
                    const newSite = { name: '', addressText: '', location: { type: 'Point', coordinates: [77.5946, 12.9716] } };
                    setFormData({...formData, jobsites: [...(formData.jobsites || []), newSite]});
                  }}>+ Add Address</button>
                </div>
              )}

              {userTab === 'orders' && (
                <div className="user-orders-preview">
                  <h4 style={{ marginBottom: '1.25rem', fontWeight: '800' }}>Order History</h4>
                  {userOrders.length === 0 ? <p className="empty-msg">No orders found for this user.</p> : userOrders.map((o: any) => (
                    <div key={o._id} className="user-order-item">
                      <div className="order-main">
                         <strong>Order #{o._id.slice(-6).toUpperCase()}</strong>
                         <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="order-status">
                         <div className="order-amt">₹{o.totalAmount}</div>
                         <span className={`status-badge ${o.status}`}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {type === 'gst' && (
            <div className="modal-scroll-area">
              <div className="input-group-admin">
                <label>Category</label>
                <input type="text" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="input-group-admin">
                <label>Sub Category</label>
                <input type="text" value={formData.subCategory || ''} onChange={e => setFormData({...formData, subCategory: e.target.value})} />
              </div>
              <div className="input-row-admin">
                <div className="input-group-admin">
                  <label>GST Rate (%)</label>
                  <input type="number" value={formData.gst || 0} onChange={e => setFormData({...formData, gst: Number(e.target.value)})} />
                </div>
                <div className="input-group-admin">
                  <label>HSN Code</label>
                  <input type="text" value={formData.hsnCode || ''} onChange={e => setFormData({...formData, hsnCode: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {type === 'categories' && (
            <div className="modal-scroll-area">
              <div className="input-group-admin">
                <label>Category Name</label>
                <input 
                  type="text" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div className="input-group-admin">
                <label>Blog Space / Description (HTML allowed)</label>
                <textarea 
                  rows={4}
                  value={formData.description || ''} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              <div className="input-row-admin">
                 <div className="input-group-admin checkbox">
                    <input 
                      type="checkbox" 
                      id="catActive"
                      checked={formData.isActive !== false} 
                      onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                    />
                    <label htmlFor="catActive">Is Active</label>
                 </div>
                 <div className="input-group-admin checkbox">
                    <input 
                      type="checkbox" 
                      id="catFeatured"
                      checked={!!formData.isFeatured} 
                      onChange={e => setFormData({...formData, isFeatured: e.target.checked})} 
                    />
                    <label htmlFor="catFeatured" style={{ color: '#f59e0b', fontWeight: 'bold' }}>Featured</label>
                 </div>
              </div>
              <div className="input-group-admin">
                  <label>Category Image (Upload or Paste URL)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      backgroundImage: formData.imageUrl ? `url(${getFullImageUrl(formData.imageUrl)})` : 'none', 
                      backgroundSize: 'cover', 
                      backgroundPosition: 'center', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      {!formData.imageUrl && <Image size={20} color="#64748b" opacity={0.5} />}
                    </div>
                    <div className="image-upload-wrapper" style={{ flex: 1 }}>
                       <input type="text" value={formData.imageUrl || ''} placeholder="https://..." onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                       <label className="upload-mini-btn">
                         <Image size={18} />
                         <input type="file" hidden accept="image/*" onChange={handleCategoryImageUpload} />
                       </label>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
          <button 
            type="button"
            className="modal-btn save" 
            onClick={() => handleAction(
              isEditing ? 'put' : 'post', 
              `/admin/${type}${isEditing ? `/${editingItem._id}` : ''}`, 
              formData
            )}
          >
            {isEditing ? 'Save Changes' : 'Create Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderDetailsModal({ viewingOrder, setViewingOrder }: any) {
  if (!viewingOrder) return null;
  const order = viewingOrder;

  return (
    <div className="admin-modal-overlay" onClick={() => setViewingOrder(null)}>
      <div className="admin-modal-content order-details-modal animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Order Details #{order?._id.slice(-6).toUpperCase()}</h3>
          <button type="button" className="close-btn" onClick={() => setViewingOrder(null)}><X size={20} /></button>
        </div>
        
        <div className="modal-body">
           <div className="order-meta-info">
              <div className="meta-item">
                 <label>Customer</label>
                 <span>{order.userId?.fullName || 'Guest'}</span>
              </div>
              <div className="meta-item">
                 <label>Contact</label>
                 <span>{order.userId?.phoneNumber || 'N/A'}</span>
              </div>
              <div className="meta-item">
                 <label>Payment</label>
                 <span className="uppercase">{order.paymentMethod || 'COD'}</span>
              </div>
              <div className="meta-item">
                 <label>Order Time</label>
                 <span>{new Date(order.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="meta-item full-width">
                 <label>Delivery Address</label>
                 <span>{order.shippingAddress || order.deliveryAddress?.addressText || order.deliveryAddress?.name || 'No address provided'}</span>
              </div>
           </div>

           <div className="order-items-list">
              <h4>Items ({order.items?.length || 0})</h4>
              {order.items?.map((item: any, idx: number) => (
                 <div key={idx} className="order-item-row">
                    <div className="item-img">
                       <img src={item.productId?.images?.[0] || item.product?.images?.[0] || 'https://via.placeholder.com/50'} alt="" />
                    </div>
                    <div className="item-info">
                       <span className="item-name">{item.productId?.name || item.product?.name || 'Unknown Product'}</span>
                       <span className="item-sub">Qty: {item.quantity} × ₹{item.unitPrice}</span>
                    </div>
                    <div className="item-total">
                       ₹{item.quantity * item.unitPrice}
                    </div>
                 </div>
              ))}
           </div>

           <div className="order-summary-box">
              <div className="summary-row">
                 <span>Subtotal</span>
                 <span>₹{order.totalAmount}</span>
              </div>
              <div className="summary-row total">
                 <span>Grand Total</span>
                 <span>₹{order.totalAmount}</span>
              </div>
           </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-btn save" onClick={() => setViewingOrder(null)}>Close</button>
        </div>
      </div>
    </div>
  );
}

const REVENUE_DATA = [
  { day: 'S', revenue: 10000 },
  { day: 'M', revenue: 11000 },
  { day: 'T', revenue: 12000 },
  { day: 'W', revenue: 13000 },
  { day: 'T', revenue: 16000 },
  { day: 'F', revenue: 14000 },
  { day: 'S', revenue: 15000 },
];

const ORDERS_STATS_DATA = [
  { week: 'Mar\'25 W1', orders: 25, fulfilled: 25, delayed: 5 },
  { week: 'Mar\'25 W2', orders: 32, fulfilled: 30, delayed: 2 },
  { week: 'Mar\'25 W3', orders: 16, fulfilled: 16, delayed: 5 },
  { week: 'Mar\'25 W4', orders: 20, fulfilled: 20, delayed: 5 },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'actions'>((tabParam as any) || 'dashboard');
  const subParam = searchParams.get('sub');
  const [activeActionTab, setActiveActionTab] = useState<'list' | 'users' | 'orders' | 'categories' | 'products' | 'tickets' | 'userRequests' | 'footer-links' | 'gst' | 'settings' | 'reviews' | 'searchLogs'>((subParam as any) || 'list');
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [searchLogs, setSearchLogs] = useState<any[]>([]);
  const [gstClassifications, setGstClassifications] = useState<any[]>([]);

  // Management State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  const [userTab, setUserTab] = useState<'profile' | 'addresses' | 'orders'>('profile');
  const [productTab, setProductTab] = useState<'general' | 'variants' | 'images'>('general');
  const [userOrders, setUserOrders] = useState<any[]>([]);

  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000') + '/api';

  const fetchData = async () => {
    setLoading(true);
    try {
      const results = await Promise.all([
        axios.get(`${API_BASE}/admin/users`),
        axios.get(`${API_BASE}/orders`),
        axios.get(`${API_BASE}/admin/categories`),
        axios.get(`${API_BASE}/admin/products`),
        axios.get(`${API_BASE}/user-requests`),
        axios.get(`${API_BASE}/admin/stats`),
        axios.get(`${API_BASE}/admin/search-logs`)
      ]);
      
      const [uRes, oRes, cRes, pRes, urRes, statsRes, searchRes] = results;
      
      if (uRes.data) setUsers(uRes.data);
      if (oRes.data) setOrders(oRes.data);
      if (cRes.data) setCategories(cRes.data);
      if (pRes.data) setProducts(pRes.data);
      if (urRes.data) setUserRequests(urRes.data);
      if (statsRes.data) setDashboardStats(statsRes.data);
      if (searchRes && searchRes.data) setSearchLogs(searchRes.data);

      const gstRes = await axios.get(`${API_BASE}/admin/gst-classifications`);
      if (gstRes.data) setGstClassifications(gstRes.data);
    } catch (err: any) {
      console.error('Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (tabParam && ['dashboard', 'reports', 'actions'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    if (subParam) {
      setActiveActionTab(subParam as any);
    } else {
      setActiveActionTab('list');
    }
  }, [tabParam, subParam]);

  // Real-time socket logic
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    connectSocket(adminSocket);

    const onConnect = () => console.log('Admin Socket Connected');
    const onNewOrder = (order: any) => {
       console.log('Received socket new-order payload:', order);
       const refId = String(order?._id || order?.id || 'UNKNOWN').slice(-6).toUpperCase();
       
       // Play notification sound
       const audio = new Audio('/sounds/New Order.mpeg');
       audio.play().catch(e => console.error('Audio play failed:', e));
       
       toast.success(`🎉 New Order Received! (#${refId})`);
       fetchData(); // Auto-refresh all stats and orders
    };


    const onNewUserRequest = (request: any) => {
       // Play notification sound
       const audio = new Audio('/sounds/New request.mpeg');
       audio.play().catch(e => console.error('Audio play failed:', e));

       toast.success(`📸 New Material Request from ${request.name}!`);
       fetchData();
    };


    adminSocket.on('connect', onConnect);
    adminSocket.on('new-order', onNewOrder);
    adminSocket.on('new-user-request', onNewUserRequest);

    return () => {
      adminSocket.off('connect', onConnect);
      adminSocket.off('new-order', onNewOrder);
      adminSocket.off('new-user-request', onNewUserRequest);
      // NOTE: Removed adminSocket.disconnect() to prevent breaking the singleton connection on quick re-renders
    };
  }, []);

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/admin/products/upload-image`, uploadData);
      setFormData({ ...formData, imageUrl: data.imageUrl });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (method: 'post' | 'put' | 'patch' | 'delete', endpoint: string, data?: any) => {
    try {
      const url = `${API_BASE}${endpoint}`;
      let response;
      if (method === 'delete') {
         response = await axios.delete(url);
      } else if (method === 'post') {
         response = await axios.post(url, data);
      } else if (method === 'patch') {
         response = await axios.patch(url, data);
      } else {
         response = await axios.put(url, data);
      }

      if (response && response.data && response.data._image_processing) {
        toast.success(`Done! ${response.data._image_processing}`);
      } else {
        const successMsg = method === 'delete' ? 'Item deleted successfully' : (method === 'post' ? 'New item created!' : 'Changes saved successfully!');
        toast.success(successMsg);
      }
      
      setShowModal(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const openForm = (item: any = null) => {
     setEditingItem(item);
     setFormData(item || {});
     setUserTab('profile');
     setProductTab('general');
     setUserOrders([]);
     setShowModal(true);
  };

  const fetchUserOrders = async (userId: string) => {
     try {
        const { data } = await axios.get(`${API_BASE}/admin/users/${userId}/orders`);
        setUserOrders(data);
     } catch (err) {
        toast.error('Failed to load user orders');
     }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    await handleAction('patch', `/admin/orders/${orderId}/status`, { status });
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/admin/products/upload-image`, uploadData);
      setFormData({
        ...formData,
        images: [...(formData.images || []), data.imageUrl]
      });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/admin/products/bulk-upload`, formData);
      toast.success('Bulk upload successful');
      fetchData();
    } catch (err) {
      toast.error('Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };



  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggle-admin-sidebar'));
  };

  const TILES = [
    { label: 'Active Orders', val: dashboardStats?.activeOrders ?? '0', icon: <Package size={20} />, color: '#FFEA00', tab: 'orders' },
    { label: 'Active Products', val: dashboardStats?.totalProducts ?? products.length ?? '0', icon: <Layers size={20} />, color: '#DEDEDE', tab: 'products' },
    { label: 'Active Categories', val: dashboardStats?.activeCategories ?? '0', icon: <Layers size={20} />, color: '#DEDEDE', tab: 'categories' },
    { label: 'User Material Requests', val: userRequests.length ?? '0', icon: <Clock size={20} />, color: '#DEDEDE', tab: 'userRequests' },
  ];

  const ACTION_ITEMS = [
    { 
      id: 'users', 
      name: 'User Management', 
      sub: 'Enter basic details of a user, that send the user a SMS and WhatsApp message to download the app and start using MatAll', 
      color: '#DEDEDE' 
    },
    { 
      id: 'orders', 
      name: 'Order Management', 
      sub: 'Access revenue reports, track trends with charts, and forecast using data', 
      color: '#DEDEDE' 
    },
    { 
      id: 'categories', 
      name: 'Category & Sub-Category', 
      sub: 'Manage master categories and nested hierarchical sub-categories in a tree view', 
      color: '#DEDEDE',
      path: '/admin/categories'
    },
    { 
      id: 'products', 
      name: 'SKU & Inventory', 
      sub: 'Manage 30,000+ construction items, technical pricing, SKU generation and variants', 
      color: '#DEDEDE',
      path: '/admin/inventory'
    },
    { 
      id: 'tickets', 
      name: 'Review Support Tickets', 
      sub: 'Reports about revenue generated per category, per product type, per brand, order size etc', 
      color: '#DEDEDE' 
    },
    { 
      id: 'brands', 
      name: 'Brand Management', 
      sub: 'Manage manufacturing partners, logos, and featured brands for the homepage', 
      color: '#DEDEDE',
      path: '/admin/brands'
    },
    { 
      id: 'userRequests', 
      name: 'User Material Requests', 
      sub: 'View uploaded images, handwritten lists, and BOQs from Users', 
      color: '#FFEA00' 
    },
    {
      id: 'offers',
      name: 'Offer Management',
      sub: 'Manage promotional banners, discounts, and landing page deals',
      color: '#DEDEDE',
      path: '/admin/offers'
    },
    {
      id: 'footer-links',
      name: 'Footer Navigation',
      sub: 'Manage grouped links, helpful resources, and sub-category listings in the website footer',
      color: '#FFEA00'
    },
    {
      id: 'gst',
      name: 'GST & Classification',
      sub: 'Manage HSN Codes and GST rates by Category & Sub Category',
      color: '#DEDEDE'
    },
    {
      id: 'locations',
      name: 'Location Management',
      sub: 'Manage serviceable pincodes and areas for user orders',
      color: '#FFEA00',
      path: '/admin/locations'
    },
    {
      id: 'settings',
      name: 'Service Settings',
      sub: 'Manage availability, delivery charges, platform fees and offline messages',
      color: '#DEDEDE'
    },
    {
      id: 'reviews',
      name: 'Review Management',
      sub: 'Manage customer reviews for products, approve or reject them',
      color: '#FFEA00'
    },
    {
      id: 'searchLogs',
      name: 'Search History / Logs',
      sub: 'Monitor what users are searching for to improve inventory',
      color: '#DEDEDE'
    }
  ];


  const renderDashboard = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="admin-tiles-grid">
          {TILES.map((tile, idx) => (
            <div 
              key={idx} 
              className="admin-metric-tile" 
              style={{ backgroundColor: tile.color, cursor: 'pointer' }}
              onClick={() => {
                if (tile.tab === 'products') navigate('/admin/inventory');
                else if (tile.tab === 'categories') navigate('/admin/categories');
                else navigate(`/admin?tab=actions&sub=${tile.tab}`);
              }}
            >
               <div className="tile-top">
                  <span className="tile-val">{tile.val}</span>
                  {tile.icon}
               </div>
               <span className="tile-label">{tile.label}</span>
            </div>
          ))}
      </div>

      <section className="admin-section-box">
         <div className="section-header">
            <h3>Revenue</h3>
            <div className="filter-pills-row">
               <button className="pill">Monthly</button>
               <button className="pill active">Weekly</button>
               <button className="pill">Today</button>
            </div>
         </div>
         <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dashboardStats?.revenueData || REVENUE_DATA}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4d4d" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ff4d4d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis hide domain={[0, 20000]} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#000" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
         </div>
      </section>

      <section className="admin-section-box">
         <div className="section-header">
            <h3>Orders</h3>
            <div className="filter-pills-row">
               <button className="pill">Monthly</button>
               <button className="pill active">Weekly</button>
               <button className="pill">Today</button>
            </div>
         </div>
         <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dashboardStats?.ordersStatsData || ORDERS_STATS_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconType="rect" wrapperStyle={{ fontSize: 12, paddingBottom: 10 }} />
                <Bar dataKey="orders" fill="#FFEA00" radius={[4, 4, 0, 0]} name="Orders" />
                <Bar dataKey="fulfilled" fill="#000000" radius={[4, 4, 0, 0]} name="Fulfilled" />
                <Bar dataKey="delayed" fill="#DEDEDE" radius={[4, 4, 0, 0]} name="Delayed" />
              </BarChart>
            </ResponsiveContainer>
         </div>
      </section>

      <section className="admin-section-box">
         <div className="section-header">
            <h3>Latest Orders</h3>
            <div className="filter-pills-row">
               <button className="pill">Monthly</button>
               <button className="pill active">Weekly</button>
               <button className="pill">Today</button>
            </div>
         </div>
         
         <div className="b2b-orders-list">
            {orders.length === 0 ? (
               <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No orders yet</div>
            ) : (
               orders.slice(0, 10).map((order: any, idx: number) => (
                  <div key={order._id || idx} className="b2b-order-row" onClick={() => setViewingOrder(order)} style={{ cursor: 'pointer' }}>
                     <div className="b2b-avatar">{order.userId?.fullName?.slice(0, 2).toUpperCase() || 'GU'}</div>
                     <div className="b2b-info">
                        <h4>{order.userId?.fullName || 'Guest User'}</h4>
                        <span>{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                     <div className="b2b-amount-group">
                        <span className="amount-val">₹{order.totalAmount}</span>
                        <button className="new-order-badge" style={{
                           background: order.status === 'Accepted' ? '#FFEA00' : '#f1f5f9',
                           color: order.status === 'Accepted' ? '#000' : '#64748b'
                        }}>
                           {order.status || 'Active'}
                        </button>
                     </div>
                  </div>
               ))
            )}
          </div>
      </section>
    </div>
  );

  // renderReports removed, using imported Reports component directly

  const renderUserManagement = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="management-header-card yellow">
        <div className="header-info">
          <h2>User Management</h2>
        </div>
        <div className="search-bar-admin">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search Name/Mobile..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="add-action-btn" onClick={() => openForm()}>
           <Plus size={20} />
        </button>
      </div>
      
      <div className="admin-list-container">
        {users.filter(u => 
          (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (u.phoneNumber || '').includes(searchTerm) ||
          (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).length === 0 ? <p className="text-center py-4">No users found.</p> : 
        users.filter(u => 
          (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (u.phoneNumber || '').includes(searchTerm) ||
          (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).map((user, i) => (
          <div key={user._id || i} className="admin-list-row-item">
            <div className="row-user-avatar"><User size={20} /></div>
            <div className="row-user-info">
              <span className="row-name">{user.fullName || 'No Name'}</span>
              <span className="row-sub">{user.phoneNumber || user.email || 'No Mobile'}</span>
            </div>
            <div className="row-actions-btns">
              <button className="list-icon-btn" onClick={() => openForm(user)}><Edit2 size={16} /></button>
              <button className="list-icon-btn danger" onClick={() => handleAction('delete', `/admin/users/${user._id}`)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOrderManagement = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="management-header-card grey">
        <div className="header-info">
          <h2>Order Management</h2>
        </div>
        <div className="search-bar-admin">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search ID/Customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="admin-list-container">
        {orders.filter(o => 
          (o.userId?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (o._id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (o.userId?.phoneNumber || '').includes(searchTerm) ||
          (o.status || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).length === 0 ? <p className="text-center py-4">No orders found.</p> : 
        orders.filter(o => 
          (o.userId?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (o._id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (o.userId?.phoneNumber || '').includes(searchTerm) ||
          (o.status || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).map((order, i) => (
          <div key={order._id || i} className="admin-list-row-item order-variant">
            <div className="row-left-info" onClick={() => setViewingOrder(order)}>
               <span className="row-name">{order.userId?.fullName || 'Guest'}</span>
               <span className="row-sub">{order.userId?.phoneNumber || 'No Contact'}</span>
            </div>
            <div className="row-mid-info" onClick={() => setViewingOrder(order)}>
               <span className="row-name">Order #{order._id.slice(-6).toUpperCase()}</span>
               <span className="row-sub">₹{order.totalAmount || 0} • {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
               <span className="row-sub" style={{ fontSize: '0.65rem' }}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="row-status-select">
               <select 
                 className={`status-select-pill ${order.status?.replace(/\s+/g, '-').toLowerCase()}`}
                 value={order.status}
                 onChange={(e) => updateOrderStatus(order._id, e.target.value)}
               >
                 <option value="Accepted">Accepted</option>
                 <option value="Order Ready to Ship">Order Ready to Ship</option>
                 <option value="Rider at hub for pickup">Rider at hub for pickup</option>
                 <option value="Order Picked">Order Picked</option>
                 <option value="Order on way">Order on way</option>
                 <option value="Order Delivered">Order Delivered</option>
                 <option value="Cancelled">Cancelled</option>
               </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCategoryManagement = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="management-header-card grey">
        <div className="header-info">
          <h2>Category Management</h2>
        </div>
        <button className="add-action-btn" onClick={() => openForm()}>
           <Plus size={20} />
        </button>
      </div>
      <div className="admin-list-container">
        {categories.length === 0 ? <p className="text-center py-4">No categories found.</p> : categories.map((cat, i) => (
          <div key={cat._id || i} className="admin-list-row-item">
            <div className="row-left-info">
              <span className="row-name">{cat.name}</span>
              <span className="row-sub">{cat.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="row-actions-btns">
              <button className="list-icon-btn" onClick={() => openForm(cat)}><Edit2 size={16} /></button>
              <button className="list-icon-btn danger" onClick={() => handleAction('delete', `/admin/categories/${cat._id}`)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProductManagement = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="management-header-card grey">
        <div className="header-info">
          <h2>Product Management</h2>
        </div>
        <div className="management-actions-row">
           <div className="search-bar-admin compact">
              <input 
                type="text" 
                placeholder="Search Material/SKU..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <input 
             type="file" 
             ref={fileInputRef} 
             style={{ display: 'none' }} 
             accept=".xlsx, .xls"
             onChange={handleBulkUpload} 
           />
           <button className="add-action-btn secondary" onClick={() => fileInputRef.current?.click()} title="Bulk Upload">
              <FileUp size={20} />
           </button>
           <button className="add-action-btn" onClick={() => openForm()}>
              <Plus size={20} />
           </button>
        </div>
      </div>
      <div className="admin-list-container">
        {products.filter(p => 
          (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.subCategory || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).length === 0 ? <p className="text-center py-4">No products found.</p> : 
        products.filter(p => 
          (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.subCategory || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).map((prod, i) => (
          <div key={prod._id || i} className="admin-list-row-item">
            <div className="row-left-info">
              <span className="row-name">{prod.name}</span>
              <span className="row-sub">{prod.brand} | {prod.category}</span>
            </div>
            <div className="row-mid-info">
               <span className="row-name">₹{prod.price}</span>
               <span className="row-sub">SKU: {prod.sku || 'N/A'}</span>
            </div>
            <div className="row-actions-btns">
              <button className="list-icon-btn" onClick={() => openForm(prod)}><Edit2 size={16} /></button>
              <button className="list-icon-btn danger" onClick={() => handleAction('delete', `/admin/products/${prod._id}`)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTicketManagement = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="management-header-card grey">
        <div className="header-info">
          <h2>Material Requests</h2>
        </div>
      </div>
      <div className="admin-list-container">
        <p className="text-center py-10" style={{ fontFamily: 'monospace' }}>
          Ticket System Implementation Pending Backend Integration.
        </p>
      </div>
    </div>
  );

  const renderUserRequestsManagement = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="management-header-card grey">
        <div className="header-info">
          <h2>User Material Requests</h2>
        </div>
      </div>
      <div className="admin-list-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', padding: '1rem' }}>
        {userRequests.length === 0 ? <p className="text-center py-4" style={{ gridColumn: '1 / -1' }}>No requests found.</p> : userRequests.map((req, i) => (
          <div key={req._id || i} className="admin-list-row-item card" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '1rem', border: '1px solid #eee', borderRadius: '12px', background: '#fff', position: 'relative' }}>
            <div className="row-left-info" style={{ marginBottom: '1rem', paddingRight: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span className={`status-badge-mini ${(req.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                  {req.status || 'Pending'}
                </span>
                <span className="row-name" style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>{req.name}</span>
              </div>
              <span className="row-sub">{req.phone}</span>
              <span className="row-sub" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(req.createdAt).toLocaleString()}</span>
              
              <div className="status-selector-container" style={{ marginTop: '12px' }}>
                <select 
                  className="admin-status-select"
                  value={req.status || 'Pending'}
                  onChange={(e) => handleAction('patch', `/user-requests/${req._id}/status`, { status: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  <option value="Pending">Pending</option>
                  <option value="User Contacted">User Contacted</option>
                  <option value="Query Resolved">Query Resolved</option>
                  <option value="Converted to Order">Converted to Order</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>
            <button 
              className="list-icon-btn danger" 
              style={{ position: 'absolute', top: '15px', right: '15px' }}
              onClick={() => {
                if(window.confirm('Delete this request?')) {
                  handleAction('delete', `/user-requests/${req._id}`);
                }
              }}
            >
              <Trash2 size={18} />
            </button>
            <div className="row-mid-info" style={{ flex: 1, display: 'flex', justifyContent: 'center', background: '#f8fafc', borderRadius: '8px', padding: '0.5rem' }}>
               <img 
                  src={getFullImageUrl(req.imageUrl)} 
                  alt="Request" 
                  style={{ maxWidth: '100%', maxHeight: '250px', objectFit: 'contain', cursor: 'pointer' }} 
                  onClick={() => window.open(getFullImageUrl(req.imageUrl), '_blank')} 
                />
            </div>
          </div>
        ))}
      </div>
    </div>
  );



  const renderSearchLogsManagement = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="management-header-card grey">
        <div className="header-info">
          <h2>Search History / Logs</h2>
        </div>
        <div className="search-bar-admin">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Filter Queries..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="admin-list-container">
        {searchLogs.filter(log => 
          (log.query || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.user?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).length === 0 ? <p className="text-center py-4">No search logs found.</p> : 
        <div className="search-logs-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Query</th>
                <th>Results</th>
                <th>User</th>
                <th>IP Address</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {searchLogs.filter(log => 
                (log.query || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.user?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
              ).map((log, i) => (
                <tr key={log._id || i}>
                  <td className="font-bold">{log.query}</td>
                  <td>{log.resultsCount}</td>
                  <td>{log.user ? `${log.user.fullName} (${log.user.phoneNumber})` : 'Guest'}</td>
                  <td>{log.ip || 'N/A'}</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        }
      </div>
    </div>
  );

  const renderGstManagement = () => (
    <div className="admin-scroll-content animate-fade-in">
      <div className="management-header-card grey">
        <div className="header-info">
          <h2>GST & Classification</h2>
        </div>
        <div className="search-bar-admin">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search Category/Sub..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="add-action-btn" onClick={() => openForm()}>
           <Plus size={20} />
        </button>
      </div>
      
      <div className="admin-list-container">
        {gstClassifications.filter(g => 
          (g.category || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (g.subCategory || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).length === 0 ? <p className="text-center py-4">No GST mappings found.</p> : 
        gstClassifications.filter(g => 
          (g.category || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (g.subCategory || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).map((item, i) => (
          <div key={item._id || i} className="admin-list-row-item">
            <div className="row-left-info">
              <span className="row-name">{item.category} → {item.subCategory}</span>
              <span className="row-sub">GST: {item.gst}% • HSN: {item.hsnCode || 'N/A'}</span>
            </div>
            <div className="row-actions-btns">
              <button className="list-icon-btn" onClick={() => openForm(item)}><Edit2 size={16} /></button>
              <button className="list-icon-btn danger" onClick={() => handleAction('delete', `/admin/gst-classifications/${item._id}`)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActions = () => {
    if (activeActionTab === 'users') return renderUserManagement();
    if (activeActionTab === 'orders') return renderOrderManagement();
    if (activeActionTab === 'categories') return renderCategoryManagement();
    if (activeActionTab === 'products') return renderProductManagement();
    if (activeActionTab === 'gst') return renderGstManagement();
    if (activeActionTab === 'tickets') return renderTicketManagement();
    if (activeActionTab === 'userRequests') return renderUserRequestsManagement();
    if (activeActionTab === 'footer-links') return <FooterManager />;
    if (activeActionTab === 'settings') return <ServiceSettings />;
    if (activeActionTab === 'reviews') return <ReviewManager />;
    if (activeActionTab === 'searchLogs') return renderSearchLogsManagement();

    return (
      <div className="admin-scroll-content animate-fade-in">
        <div className="actions-screen-container">
          {ACTION_ITEMS.map((item, idx) => (
            <div 
              key={idx} 
              className="action-category-card" 
              style={{ backgroundColor: item.color }}
              onClick={() => {
                if ((item as any).path) navigate((item as any).path);
                else setActiveActionTab(item.id as any);
              }}
            >
              <div className="card-content">
                <h4>{item.name}</h4>
                <p>{item.sub}</p>
              </div>
              <ChevronRight size={20} className="arrow-icon" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20" style={{ height: '70vh', fontFamily: 'monospace' }}>
      Loading Dashboard Data...
    </div>
  );

  return (
    <div className="matall-admin-dashboard">
      <div className="admin-main-wrapper">
        <header className="admin-dash-header">
          <div className="header-left">
            <button className="mobile-menu-trigger" onClick={toggleSidebar}>
               <Menu size={24} />
            </button>
            <h1>{activeActionTab !== 'list' ? (ACTION_ITEMS.find(i => i.id === activeActionTab)?.name || activeActionTab.charAt(0).toUpperCase() + activeActionTab.slice(1)) : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          </div>
          <div className="header-right-actions">
             <div className="admin-profile-logo-box">
                <span className="logo-text">MatAll</span>
             </div>
          </div>
        </header>

        <div className="admin-content-pad">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'reports' && (
            <div className="admin-scroll-content animate-fade-in">
              <Reports contentOnly={true} />
            </div>
          )}
          {activeTab === 'actions' && renderActions()}
        </div>
      </div>
      <ManagementModal 
        showModal={showModal}
        setShowModal={setShowModal}
        editingItem={editingItem}
        activeActionTab={activeActionTab}
        formData={formData}
        setFormData={setFormData}
        handleAction={handleAction}
        userTab={userTab}
        setUserTab={setUserTab}
        productTab={productTab}
        setProductTab={setProductTab}
        userOrders={userOrders}
        fetchUserOrders={fetchUserOrders}
        handleProductImageUpload={handleProductImageUpload}
        handleCategoryImageUpload={handleCategoryImageUpload}
        API_BASE={API_BASE}
      />
      <OrderDetailsModal 
        viewingOrder={viewingOrder}
        setViewingOrder={setViewingOrder}
        API_BASE={API_BASE}
      />
    </div>
  );
};

export default AdminDashboard;

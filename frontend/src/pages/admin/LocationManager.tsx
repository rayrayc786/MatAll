import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit3, Trash2, X, MapPin, Globe } from 'lucide-react';
import GeofenceEditor from '../../components/admin/GeofenceEditor';

const LocationManager: React.FC = () => {
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grouped' | 'geofence'>('grouped');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCity, setBulkCity] = useState('');
  const [bulkPincodes, setBulkPincodes] = useState<any[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [bulkTab, setBulkTab] = useState<'lookup' | 'manual' | 'excel'>('lookup');
  const [manualPincodes, setManualPincodes] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    pincode: '',
    city: '',
    state: '',
    isActive: true
  });

  const fetchAreas = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/serviceable-areas`);
      setAreas(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingArea) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/serviceable-areas/${editingArea._id}`, formData);
      } else {
        // Check for multiple pincodes in the single field
        const pins = formData.pincode.split(',').map(p => p.trim()).filter(p => p.length > 0);
        
        if (pins.length > 1) {
          const areasToCreate = pins.map(p => ({
            pincode: p,
            city: formData.city,
            state: formData.state,
            isActive: formData.isActive
          }));
          await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/bulk-create-serviceable-areas`, {
            areas: areasToCreate
          });
        } else {
          await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/serviceable-areas`, formData);
        }
      }
      setShowModal(false);
      setEditingArea(null);
      fetchAreas();
    } catch (err) {
      console.error(err);
      alert('Failed to save location');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this serviceable pincode?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/serviceable-areas/${id}`);
      fetchAreas();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (area: any) => {
    setUpdatingId(area._id);
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/serviceable-areas/${area._id}`, {
        ...area,
        isActive: !area.isActive
      });
      // Update local state for immediate feedback
      setAreas(prev => prev.map(a => a._id === area._id ? { ...a, isActive: !a.isActive } : a));
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleAllInCity = async (city: string, shouldActivate: boolean) => {
    const cityAreas = areas.filter(a => a.city === city);
    if (!cityAreas.length) return;

    if (!window.confirm(`Are you sure you want to ${shouldActivate ? 'activate' : 'deactivate'} ALL ${cityAreas.length} pincodes in ${city}?`)) return;

    try {
      setLoading(true);
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/bulk-update-serviceable-areas`, {
        city: city,
        isActive: shouldActivate
      });
      fetchAreas();
    } catch (err) {
      console.error(err);
      alert('Failed to update all pincodes');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (area: any) => {
    setEditingArea(area);
    setFormData({
      pincode: area.pincode,
      city: area.city,
      state: area.state || '',
      isActive: area.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingArea(null);
    setFormData({
      pincode: '',
      city: '',
      state: '',
      isActive: true
    });
    setShowModal(true);
  };

  const filteredAreas = areas.filter(a => 
    a.pincode.includes(search) || a.city.toLowerCase().includes(search.toLowerCase())
  );

  const cityGroups = areas.reduce((acc: any, area) => {
    if (!acc[area.city]) acc[area.city] = [];
    acc[area.city].push(area);
    return acc;
  }, {});

  const sortedCities = Object.keys(cityGroups).sort();

  // Highlight effect for the selected city or searched city
  useEffect(() => {
    if (search && sortedCities.length > 0) {
      const foundCity = sortedCities.find(c => c.toLowerCase().includes(search.toLowerCase()));
      if (foundCity && !selectedCity) setSelectedCity(foundCity);
    }
  }, [search, sortedCities, selectedCity]);

  return (
    <main className="admin-content">
      <header className="admin-header space-between" style={{ marginBottom: '2.5rem' }}>
        <div className="title-group">
          <h1>Location Management</h1>
          <p>Manage serviceable pincodes and areas where users can place orders</p>
        </div>
        <div className="admin-header-actions" style={{ display: 'flex', gap: '1rem' }}>
          <button className="secondary-btn" onClick={() => setShowBulkModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Bulk Add Pincodes
          </button>
          <button className="add-sku-btn" onClick={resetForm}>
            <Plus size={18} /> Add Pincode
          </button>
        </div>
      </header>

      <div className="view-mode-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setViewMode('grouped')} 
          style={{ 
            padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.9rem', color: viewMode === 'grouped' ? '#000' : '#64748b',
            borderBottom: viewMode === 'grouped' ? '2px solid var(--primary)' : '2px solid transparent'
          }}
        >
          Group by City
        </button>
        <button 
          onClick={() => setViewMode('list')} 
          style={{ 
            padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.9rem', color: viewMode === 'list' ? '#000' : '#64748b',
            borderBottom: viewMode === 'list' ? '2px solid var(--primary)' : '2px solid transparent'
          }}
        >
          Flat List View
        </button>
        <button 
          onClick={() => setViewMode('geofence')} 
          style={{ 
            padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.9rem', color: viewMode === 'geofence' ? '#000' : '#64748b',
            borderBottom: viewMode === 'geofence' ? '2px solid var(--primary)' : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Globe size={16} /> Visual Geofencing
        </button>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="search-group" style={{ flex: '1 1 400px', maxWidth: '100%', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search pincode or city..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
            />
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div className="quick-stats">
              <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Unique Cities</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{sortedCities.length}</span>
            </div>
            <div className="quick-stats">
              <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Active Locations</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>{areas.filter(a => a.isActive).length}</span>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'grouped' ? (
        <div className="grouped-city-layout" style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', height: 'auto', minHeight: '500px' }}>
          {/* City Sidebar */}
          <div className="city-sidebar card" style={{ padding: '1rem', overflowY: 'auto', maxHeight: '70vh' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase' }}>Serviceable Cities</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sortedCities.map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  style={{
                    padding: '0.75rem 1rem', borderRadius: '10px', textAlign: 'left', border: 'none', cursor: 'pointer',
                    background: selectedCity === city ? '#f1f5f9' : 'transparent',
                    color: selectedCity === city ? '#000' : '#64748b',
                    fontWeight: selectedCity === city ? 800 : 600,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <span>{city}</span>
                  <span style={{ fontSize: '0.7rem', background: selectedCity === city ? '#fff' : '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                    {cityGroups[city].length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Pincodes Grid area */}
          <div className="pincodes-active-area">
            {selectedCity ? (
              <div className="card" style={{ padding: '1.5rem' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MapPin size={24} color="#6366f1" />
                      {selectedCity}
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Manage service status for {cityGroups[selectedCity].length} locations</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="secondary-btn" 
                      onClick={() => toggleAllInCity(selectedCity, true)}
                      style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                    >
                      Enable All
                    </button>
                    <button 
                      className="secondary-btn" 
                      onClick={() => toggleAllInCity(selectedCity, false)}
                      style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid #fee2e2', color: '#ef4444' }}
                    >
                      Disable All
                    </button>
                  </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  {cityGroups[selectedCity].map((area: any) => (
                    <div 
                      key={area._id}
                      className="pincode-card"
                      style={{
                        padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0',
                        background: area.isActive ? '#fff' : '#f8fafc',
                        transition: 'all 0.2s',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: area.isActive ? '#1e293b' : '#94a3b8' }}>{area.pincode}</span>
                        <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', marginTop: '2px' }}>
                          {area.isActive ? 'SERVICEABLE' : 'INACTIVE'}
                        </span>
                      </div>
                      <div className="toggle-switch" onClick={() => toggleStatus(area)} style={{
                        width: '44px', height: '24px', background: area.isActive ? '#16a34a' : '#cbd5e1',
                        borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.3s'
                      }}>
                        <div style={{
                          width: '18px', height: '18px', background: '#fff', borderRadius: '50%',
                          position: 'absolute', top: '3px', left: area.isActive ? '23px' : '3px',
                          transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }} />
                        {updatingId === area._id && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.5)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>...</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state card" style={{ padding: '5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '50%' }}>
                  <MapPin size={48} color="#cbd5e1" />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>Select a City</h3>
                  <p style={{ color: '#64748b', maxWidth: '300px', fontSize: '0.9rem', marginTop: '8px' }}>Select a city from the list on the left to manage individual pincode availability.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="admin-table-container">
          <table className="sku-table">
            <thead>
              <tr>
                <th>Pincode</th>
                <th>City</th>
                <th>State</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Loading locations...</td></tr>
              ) : filteredAreas.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>No serviceable locations defined</td></tr>
              ) : (
                filteredAreas.map(area => (
                   <tr key={area._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="#6366f1" />
                        <span style={{ fontWeight: 700 }}>{area.pincode}</span>
                      </div>
                    </td>
                    <td>{area.city}</td>
                    <td style={{ color: '#64748b' }}>{area.state || 'N/A'}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                        background: area.isActive ? '#dcfce7' : '#fee2e2',
                        color: area.isActive ? '#16a34a' : '#ef4444'
                      }}>
                        {area.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="icon-btn" onClick={() => openEdit(area)} title="Edit"><Edit3 size={16} /></button>
                        <button className="icon-btn delete" onClick={() => handleDelete(area._id)} title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <GeofenceEditor />
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '500px' }}>
            <div className="modal-header space-between" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{editingArea ? 'Edit Location' : 'Add Serviceable Pincode'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <label>Pincode(s) <span style={{fontSize: '0.7rem', color: '#6366f1'}}>(Separate with comma for bulk add)</span></label>
                  <input 
                    type="text" 
                    value={formData.pincode} 
                    onChange={e => setFormData({...formData, pincode: e.target.value})} 
                    placeholder="e.g. 122001, 122002, 122003"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                    placeholder="e.g. Gurgaon"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input 
                    type="text" 
                    value={formData.state} 
                    onChange={e => setFormData({...formData, state: e.target.value})} 
                    placeholder="e.g. Haryana"
                  />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                   <input 
                    type="checkbox" 
                    id="area-active"
                    checked={formData.isActive} 
                    onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                    style={{ width: '20px', height: '20px' }}
                  />
                  <label htmlFor="area-active" style={{ marginBottom: 0 }}>Is Active</label>
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Location</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header space-between" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0 }}>Bulk Add Pincodes</h2>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                  <button 
                    onClick={() => setBulkTab('lookup')}
                    style={{ 
                      padding: '0.5rem 0', border: 'none', background: 'none', cursor: 'pointer',
                      fontSize: '0.9rem', fontWeight: bulkTab === 'lookup' ? 700 : 500,
                      color: bulkTab === 'lookup' ? '#6366f1' : '#64748b',
                      borderBottom: bulkTab === 'lookup' ? '2px solid #6366f1' : '2px solid transparent'
                    }}
                  >
                    Auto-fetch
                  </button>
                  <button 
                    onClick={() => setBulkTab('manual')}
                    style={{ 
                      padding: '0.5rem 0', border: 'none', background: 'none', cursor: 'pointer',
                      fontSize: '0.9rem', fontWeight: bulkTab === 'manual' ? 700 : 500,
                      color: bulkTab === 'manual' ? '#6366f1' : '#64748b',
                      borderBottom: bulkTab === 'manual' ? '2px solid #6366f1' : '2px solid transparent'
                    }}
                  >
                    Manual Multi-Add
                  </button>
                  <button 
                    onClick={() => setBulkTab('excel')}
                    style={{ 
                      padding: '0.5rem 0', border: 'none', background: 'none', cursor: 'pointer',
                      fontSize: '0.9rem', fontWeight: bulkTab === 'excel' ? 700 : 500,
                      color: bulkTab === 'excel' ? '#6366f1' : '#64748b',
                      borderBottom: bulkTab === 'excel' ? '2px solid #6366f1' : '2px solid transparent'
                    }}
                  >
                    Excel Upload
                  </button>
                </div>
              </div>
              <button className="icon-btn" onClick={() => {
                setShowBulkModal(false);
                setBulkPincodes([]);
                setBulkCity('');
              }}><X size={20} /></button>
            </div>

            <div className="admin-form" style={{ marginTop: '1.5rem' }}>
              {bulkTab === 'lookup' ? (
                <>
                  <div className="form-group">
                    <label>Enter City Name (e.g. Gurgaon, Patna)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        value={bulkCity} 
                        onChange={e => setBulkCity(e.target.value)} 
                        placeholder="Search city..." 
                        style={{ flex: 1 }}
                      />
                      <button 
                        className="primary-btn" 
                        disabled={!bulkCity || isLookingUp}
                        onClick={async () => {
                          setIsLookingUp(true);
                          try {
                            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/proxy-city-pincodes/${encodeURIComponent(bulkCity)}`);
                            if (data[0].Status === 'Success') {
                              const poList = data[0].PostOffice;
                              const uniquePins = Array.from(new Set(poList.map((p: any) => p.Pincode)));
                              const firstOffice = poList[0];
                              
                              const results = uniquePins.map(p => ({
                                pincode: p,
                                city: firstOffice.District || firstOffice.Block || bulkCity,
                                state: firstOffice.State,
                                isActive: true,
                                selected: true // For deselection
                              }));
                              setBulkPincodes(results);
                            } else {
                              alert('City not found or server error');
                            }
                          } catch (err) {
                            console.error('Lookup failed:', err);
                            alert('Lookup failed.');
                          } finally {
                            setIsLookingUp(false);
                          }
                        }}
                      >
                        {isLookingUp ? 'Searching...' : 'Search Pincodes'}
                      </button>
                    </div>
                  </div>

                  {bulkPincodes.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Select Pincodes ({bulkPincodes.filter(p => p.selected).length} selected)</h3>
                        <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 700 }}>{bulkPincodes[0].city} batch</span>
                      </div>
                      
                      <div style={{ 
                        maxHeight: '200px', overflowY: 'auto', background: '#f8fafc', 
                        padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0',
                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px'
                      }}>
                        {bulkPincodes.map((pin, i) => (
                          <div 
                            key={i} 
                            onClick={() => {
                              const newList = [...bulkPincodes];
                              newList[i].selected = !newList[i].selected;
                              setBulkPincodes(newList);
                            }}
                            style={{ 
                              padding: '6px', fontSize: '0.75rem', fontWeight: 700, 
                              background: pin.selected ? '#e0e7ff' : '#fff', 
                              border: pin.selected ? '1px solid #6366f1' : '1px solid #eee', 
                              color: pin.selected ? '#4338ca' : '#94a3b8',
                              borderRadius: '6px', textAlign: 'center', cursor: 'pointer'
                            }}
                          >
                            {pin.pincode}
                          </div>
                        ))}
                      </div>

                      <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
                        <button type="button" className="secondary-btn" onClick={() => { setShowBulkModal(false); setBulkPincodes([]); }}>Cancel</button>
                        <button 
                          className="primary-btn" 
                          disabled={!bulkPincodes.some(p => p.selected)}
                          onClick={async () => {
                            try {
                              const finalAreas = bulkPincodes.filter(p => p.selected).map(({ selected, ...rest }) => rest);
                              await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/bulk-create-serviceable-areas`, { areas: finalAreas });
                              setShowBulkModal(false); setBulkPincodes([]); fetchAreas();
                              alert(`Added ${finalAreas.length} pincodes!`);
                            } catch (err) { alert('Failed to save'); }
                          }}
                        >
                          Confirm Add All
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : bulkTab === 'manual' ? (
                <>
                  <div className="form-group">
                    <label>City Name</label>
                    <input 
                      type="text" 
                      value={manualCity} 
                      onChange={e => setManualCity(e.target.value)} 
                      placeholder="e.g. Gurgaon" 
                    />
                  </div>
                  <div className="form-group">
                    <label>State Name</label>
                    <input 
                      type="text" 
                      value={manualState} 
                      onChange={e => setManualState(e.target.value)} 
                      placeholder="e.g. Haryana" 
                    />
                  </div>
                  <div className="form-group">
                    <label>Enter Pincodes (Separated by comma or newline)</label>
                    <textarea 
                      value={manualPincodes}
                      onChange={e => setManualPincodes(e.target.value)}
                      placeholder="122001, 122002, 122003..."
                      style={{ 
                        width: '100%', minHeight: '150px', padding: '1rem', 
                        borderRadius: '12px', border: '1px solid #e2e8f0',
                        fontSize: '0.9rem', fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '2rem' }}>
                    <button 
                      type="button" 
                      className="secondary-btn" 
                      onClick={() => {
                        setShowBulkModal(false);
                        setManualPincodes('');
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="primary-btn" 
                      disabled={!manualPincodes || !manualCity}
                      onClick={async () => {
                        try {
                          const pins = manualPincodes.split(/[,\n]/).map(p => p.trim()).filter(p => p.length > 0);
                          if (pins.length === 0) return alert('No valid pincodes found');
                          
                          const areasToCreate = pins.map(p => ({
                            pincode: p,
                            city: manualCity,
                            state: manualState,
                            isActive: true
                          }));
                          
                          await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/bulk-create-serviceable-areas`, {
                            areas: areasToCreate
                          });
                          
                          setShowBulkModal(false);
                          setManualPincodes('');
                          setManualCity('');
                          setManualState('');
                          fetchAreas();
                          alert(`Added ${pins.length} pincodes to ${manualCity}!`);
                        } catch (err) {
                          console.error(err);
                          alert('Failed to save bulk locations');
                        }
                      }}
                    >
                      Add {manualPincodes.split(/[,\n]/).filter(p => p.trim()).length} Pincodes
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="excel-upload-zone" style={{ textAlign: 'center', padding: '3rem', border: '2px dashed #e2e8f0', borderRadius: '16px', background: '#f8fafc' }}>
                    <div style={{ marginBottom: '1.5rem', color: '#64748b' }}>
                      <p style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>Upload Locations spreadsheet</p>
                      <p style={{ fontSize: '0.85rem' }}>Columns needed: <strong>Pincode, City, State</strong></p>
                    </div>
                    
                    <input 
                      type="file" 
                      id="pincode-excel"
                      accept=".xlsx, .xls"
                      style={{ display: 'none' }}
                      onChange={e => setBulkFile(e.target.files?.[0] || null)}
                    />
                    
                    <label htmlFor="pincode-excel" style={{ cursor: 'pointer', padding: '0.75rem 1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 700, display: 'inline-block' }}>
                      {bulkFile ? bulkFile.name : 'Choose File'}
                    </label>

                    {bulkFile && (
                      <div style={{ marginTop: '2rem' }}>
                        <button 
                          className="primary-btn" 
                          disabled={isUploading}
                          onClick={async () => {
                            setIsUploading(true);
                            const formData = new FormData();
                            formData.append('file', bulkFile);
                            try {
                              await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/serviceable-areas/bulk-upload`, formData);
                              setShowBulkModal(false);
                              setBulkFile(null);
                              fetchAreas();
                              alert('Excel Pincode Upload Complete!');
                            } catch (err) {
                              alert('Upload failed. Check console for details.');
                            } finally {
                              setIsUploading(false);
                            }
                          }}
                        >
                          {isUploading ? 'Uploading...' : 'Confirm Upload'}
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                    <p>💡 Tip: Use this to precisely control which areas are serviceable without fetching irrelevant data.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default LocationManager;

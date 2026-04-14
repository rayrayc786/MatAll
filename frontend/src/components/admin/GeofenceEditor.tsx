import React, { useState, useEffect, useRef } from 'react';
import { Map, useApiIsLoaded } from '@vis.gl/react-google-maps';
import axios from 'axios';
import { Trash2, MapIcon, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

interface Geofence {
    _id: string;
    name: string;
    type: 'Polygon';
    coordinates: { lat: number; lng: number }[];
    isActive: boolean;
}

interface GeofenceEditorProps {
    onClose?: () => void;
}

const GeofenceEditor: React.FC<GeofenceEditorProps> = () => {
    const apiIsLoaded = useApiIsLoaded();
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
    
    const mapRef = useRef<google.maps.Map | null>(null);
    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
    const polygonsRef = useRef<{ [key: string]: google.maps.Polygon }>({});

    const fetchGeofences = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/geofences`);
            setGeofences(data);
            setLoading(false);
            renderGeofences(data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load geofences');
        }
    };

    const renderGeofences = (data: Geofence[]) => {
        if (!mapRef.current) return;

        // Clear existing polygons
        Object.values(polygonsRef.current).forEach(p => p.setMap(null));
        polygonsRef.current = {};

        data.forEach(gf => {
            if (gf.type === 'Polygon' && gf.coordinates) {
                const polygon = new google.maps.Polygon({
                    paths: gf.coordinates,
                    strokeColor: gf.isActive ? '#6366f1' : '#94a3b8',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: gf.isActive ? '#6366f1' : '#94a3b8',
                    fillOpacity: 0.35,
                    map: mapRef.current
                });

                polygon.addListener('click', () => {
                    setEditingGeofence(gf);
                });

                polygonsRef.current[gf._id] = polygon;
            }
        });
    };

    useEffect(() => {
        if (apiIsLoaded) {
            fetchGeofences();
        }
    }, [apiIsLoaded]);

    const initDrawingManager = (map: google.maps.Map) => {
        mapRef.current = map;
        const drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [
                    google.maps.drawing.OverlayType.POLYGON,
                    // google.maps.drawing.OverlayType.CIRCLE
                ],
            },
            polygonOptions: {
                fillColor: '#6366f1',
                fillOpacity: 0.3,
                strokeWeight: 2,
                clickable: true,
                editable: true,
                zIndex: 1,
            }
        });

        drawingManager.setMap(map);
        drawingManagerRef.current = drawingManager;

        google.maps.event.addListener(drawingManager, 'overlaycomplete', (event: google.maps.drawing.OverlayCompleteEvent) => {
            if (event.type === google.maps.drawing.OverlayType.POLYGON && event.overlay instanceof google.maps.Polygon) {
                const newPolygon = event.overlay;
                drawingManager.setDrawingMode(null); // Stop drawing
                
                // Prompt for name
                const name = window.prompt("Enter a name for this delivery zone (e.g. DLF Phase 3)");
                if (name) {
                    saveNewGeofence(newPolygon, name);
                } else {
                    newPolygon.setMap(null);
                }
            }
        });
    };

    const saveNewGeofence = async (polygon: google.maps.Polygon, name: string) => {
        try {
            const path = polygon.getPath();
            const coordinates = [];
            for (let i = 0; i < path.getLength(); i++) {
                const point = path.getAt(i);
                coordinates.push({ lat: point.lat(), lng: point.lng() });
            }

            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/geofences`, {
                name,
                type: 'Polygon',
                coordinates,
                isActive: true
            });

            toast.success('Geofence saved successfully');
            polygon.setMap(null); // Remove the temp drawing
            fetchGeofences();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save geofence');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this delivery zone?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/geofences/${id}`);
            toast.success('Deleted successfully');
            fetchGeofences();
            setEditingGeofence(null);
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const toggleStatus = async (gf: Geofence) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/geofences/${gf._id}`, {
                isActive: !gf.isActive
            });
            fetchGeofences();
            setEditingGeofence(prev => prev?._id === gf._id ? { ...prev, isActive: !gf.isActive } : prev);
        } catch (err) {
            toast.error('Update failed');
        }
    };

    return (
        <div className="geofence-container" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', height: '70vh' }}>
            <div className="map-view card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                <Map
                    defaultCenter={{ lat: 28.4595, lng: 77.0266 }}
                    defaultZoom={12}
                    mapId="admin_geofence_map"
                    onIdle={(e) => {
                       if (!mapRef.current && e.map) {
                           initDrawingManager(e.map);
                       }
                    }}
                />
                <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', zIndex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>
                        <Layers size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                        Use the tools at the top to draw a zone
                    </p>
                </div>
            </div>

            <div className="geofence-list card" style={{ padding: '1.5rem', overflowY: 'auto' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapIcon size={20} color="#6366f1" />
                    Delivery Zones
                </h3>

                {loading ? (
                    <p>Loading zones...</p>
                ) : geofences.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8' }}>
                        <p>No custom zones defined yet. Start drawing on the map!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {geofences.map(gf => (
                            <div 
                                key={gf._id}
                                onClick={() => setEditingGeofence(gf)}
                                style={{
                                    padding: '1rem', borderRadius: '12px', border: editingGeofence?._id === gf._id ? '2px solid #6366f1' : '1px solid #e2e8f0',
                                    background: editingGeofence?._id === gf._id ? '#f5f7ff' : '#fff',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{gf.name}</h4>
                                        <span style={{ fontSize: '0.7rem', color: gf.isActive ? '#16a34a' : '#ef4444', fontWeight: 700 }}>
                                            {gf.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(gf._id); }}
                                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                {editingGeofence?._id === gf._id && (
                                    <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                                        <button 
                                            className="secondary-btn" 
                                            onClick={(e) => { e.stopPropagation(); toggleStatus(gf); }}
                                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                        >
                                            {gf.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeofenceEditor;

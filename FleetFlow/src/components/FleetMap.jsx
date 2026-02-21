import React, { useState, useCallback, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const RAJKOT_CENTER = { lat: 22.3039, lng: 70.8022 };

// Custom simple map style for a clean SaaS look
const mapStyles = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#dadada" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c9c9c9" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  }
];

const FleetMap = ({ vehicles = [] }) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  });

  // Random position generator within 5km of Rajkot
  const generateRandomPos = useMemo(() => {
    return (id) => {
      // Use vehicle ID as seed for consistent random position if possible
      // But for simplicity use Math.random with a fixed seed if we wanted persistence
      // Here we just generate it once per session per vehicle without GPS
      const radiusInDegrees = 5 / 111; // 5km / 111km/deg
      const r = radiusInDegrees * Math.sqrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      return {
        lat: RAJKOT_CENTER.lat + r * Math.sin(theta),
        lng: RAJKOT_CENTER.lng + r * Math.cos(theta)
      };
    };
  }, []);

  const vehiclesWithPos = useMemo(() => {
    return vehicles.map(v => {
      if (v.lat && v.lng) {
        return { ...v, position: { lat: Number(v.lat), lng: Number(v.lng) } };
      }
      return { ...v, position: generateRandomPos(v.id) };
    });
  }, [vehicles, generateRandomPos]);

  const getMarkerIcon = (status) => {
    let color = "#A3AED0"; // Default
    switch (status?.toLowerCase()) {
      case 'on trip':
      case 'dispatched':
        color = "#4318FF";
        break;
      case 'available':
        color = "#05CD99";
        break;
      case 'in shop':
      case 'maintenance':
        color = "#EE5D50";
        break;
    }

    // Google Maps pin-like icon
    return {
      path: "M12,2A10,10 0 0,0 2,12C2,18.6 12,22 12,22C12,22 22,18.6 22,12A10,10 0 0,0 12,2Z",
      fillColor: color,
      fillOpacity: 1,
      strokeColor: "#FFFFFF",
      strokeWeight: 2,
      scale: 1.5,
      anchor: isLoaded ? new window.google.maps.Point(12, 22) : null
    };
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  if (!isLoaded) {
    return (
      <div className="glass-card p-8 h-[450px] flex items-center justify-center animate-pulse">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Authenticating GPS Grid...</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 h-full min-h-[400px] flex flex-col relative overflow-hidden group shadow-xl transition-all duration-300 hover:shadow-2xl">
      <div className="flex items-center justify-between mb-6 z-10">
        <div>
          <h3 className="text-xl font-black text-[#2B3674]">Fleet Live Map</h3>
          <p className="text-xs font-bold text-slate-400 mt-1">Real-time GPS tracking status</p>
        </div>
        <button 
          onClick={handleFullscreen}
          className="p-2.5 bg-[#F4F7FE] rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
          title="Fullscreen Mode"
        >
          <span className="material-symbols-outlined !text-lg">zoom_out_map</span>
        </button>
      </div>

      <div ref={containerRef} className="flex-1 rounded-3xl overflow-hidden relative min-h-[300px] border border-[#F4F7FE] shadow-inner bg-[#F4F7FE]">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={RAJKOT_CENTER}
          zoom={12}
          onLoad={onMapLoad}
          options={{
            styles: mapStyles,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false
          }}
        >
          {vehiclesWithPos.map(v => (
            <Marker
              key={v.id}
              position={v.position}
              icon={getMarkerIcon(v.status)}
              onClick={() => setSelectedVehicle(v)}
              animation={v.status?.toLowerCase() === 'on trip' ? window.google.maps.Animation.DROP : null}
            />
          ))}

          {selectedVehicle && (
            <InfoWindow
              position={selectedVehicle.position}
              onCloseClick={() => setSelectedVehicle(null)}
            >
              <div className="p-2 min-w-[150px]">
                <h4 className="font-black text-[#2B3674] text-sm">{selectedVehicle.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{selectedVehicle.type} • {selectedVehicle.id.substring(0,8)}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    selectedVehicle.status?.toLowerCase() === 'available' ? 'bg-green-100 text-green-600' :
                    selectedVehicle.status?.toLowerCase() === 'in shop' ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'
                  }`}>
                    {selectedVehicle.status}
                  </span>
                  <span className="text-[10px] font-black text-[#2B3674]">{selectedVehicle.cargoWeight || 0}kg</span>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* HUD Elements */}
        {vehiclesWithPos.length > 0 && (
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/50 animate-toast-in">
                  <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest leading-none mb-1">Grid Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-black text-[#2B3674]">{vehiclesWithPos.length} Nodes Active</span>
                  </div>
              </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-6 z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/30" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Transit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#05CD99] shadow-lg shadow-green-500/30" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#EE5D50] shadow-lg shadow-red-500/30" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maintenance</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toast-in { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-toast-in { animation: toast-in 0.5s ease-out forwards; }
        .gm-style-iw { border-radius: 20px !important; padding: 0 !important; }
        .gm-style-iw-d { overflow: hidden !important; }
        .gm-ui-hover-text { display: none !important; }
      `}} />
    </div>
  );
};

export default FleetMap;

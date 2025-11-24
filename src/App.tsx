import { useState, useEffect, useRef } from 'react';

const BobaTracker = () => {
  const [drinks, setDrinks] = useState(0);
  const [happiness, setHappiness] = useState(50);
  const [lastDrink, setLastDrink] = useState(Date.now());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [visitedShops, setVisitedShops] = useState<number[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Real Bay Area boba shops with actual coordinates
  const shops = [
    { id: 1, name: "Boba Guys", rating: 4.8, lat: 37.7753, lng: -122.4250, address: "Hayes Valley" },
    { id: 2, name: "Tiger Sugar SF", rating: 4.7, lat: 37.7849, lng: -122.4078, address: "Polk St" },
    { id: 3, name: "Teaspoon", rating: 4.6, lat: 37.7613, lng: -122.4350, address: "Castro" },
    { id: 4, name: "Happy Lemon", rating: 4.5, lat: 37.7879, lng: -122.4074, address: "Downtown" },
    { id: 5, name: "Gong Cha", rating: 4.6, lat: 37.7835, lng: -122.4084, address: "Polk St" },
    { id: 6, name: "The Alley", rating: 4.7, lat: 37.7879, lng: -122.4051, address: "Union Square" },
  ].sort((a, b) => b.rating - a.rating);

  // Load Leaflet and Doto font
  useEffect(() => {
    // Load Doto font
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Doto:wght@100..900&display=swap';
    document.head.appendChild(fontLink);

    const loadLeaflet = async () => {
      if ((window as any).L) {
        setMapLoaded(true);
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };

    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;

    const map = L.map(mapRef.current, {
      center: [37.7749, -122.4194],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    const createBobaIcon = () => {
      return L.divIcon({
        html: `<div style="font-size: 32px; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5));">🧋</div>`,
        className: 'custom-boba-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    shops.forEach((shop) => {
      const marker = L.marker([shop.lat, shop.lng], {
        icon: createBobaIcon()
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: 'Doto', monospace; min-width: 200px;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${shop.name}</div>
          <div style="color: #8bac0f; margin-bottom: 4px;">★ ${shop.rating}</div>
          <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${shop.address}</div>
          <button
            onclick="window.logBobaFromMap(${shop.id})"
            style="background: #0f380f; color: #9bbc0f; border: 2px solid #8bac0f; padding: 8px 12px; font-weight: bold; cursor: pointer; font-family: 'Doto', monospace; width: 100%;"
          >
            LOG DRINK
          </button>
        </div>
      `);

    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded]);

  // Happiness decay over time
  useEffect(() => {
    const interval = setInterval(() => {
      const hoursSinceLastDrink = (Date.now() - lastDrink) / (1000 * 60 * 60);
      if (hoursSinceLastDrink > 24 && happiness > 0) {
        setHappiness(prev => Math.max(0, prev - 1));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [lastDrink, happiness]);

  const logDrink = (shopId: number) => {
    setDrinks(prev => prev + 1);
    setHappiness(prev => Math.min(100, prev + 15));
    setLastDrink(Date.now());

    // Add shop to visited list if not already there
    if (!visitedShops.includes(shopId)) {
      setVisitedShops(prev => [...prev, shopId]);
    }
  };

  useEffect(() => {
    (window as any).logBobaFromMap = logDrink;
    return () => {
      delete (window as any).logBobaFromMap;
    };
  }, [visitedShops]);

  const getAvatarMood = () => {
    if (happiness >= 80) return { emoji: '(◕‿◕)', status: 'EXCELLENT' };
    if (happiness >= 60) return { emoji: '(・ω・)', status: 'HAPPY' };
    if (happiness >= 40) return { emoji: '(・_・)', status: 'NEUTRAL' };
    if (happiness >= 20) return { emoji: '(╥_╥)', status: 'SAD' };
    return { emoji: '(×_×)', status: 'CRITICAL' };
  };

  const avatar = getAvatarMood();

  return (
    <div className="min-h-screen bg-[#9bbc0f] p-3 md:p-6" style={{fontFamily: '"Doto", monospace'}}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-[#0f380f] border-4 border-[#306230] p-4 md:p-6 mb-4 shadow-lg">
          <h1 className="text-3xl md:text-5xl font-bold text-[#9bbc0f] tracking-wider text-center">
            BOBA QUEST
          </h1>
          <p className="text-[#8bac0f] text-xs md:text-sm text-center mt-2">BAY AREA</p>
        </div>

        {/* Avatar Panel */}
        <div className="bg-[#0f380f] border-4 border-[#306230] p-4 md:p-6 mb-4 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center md:text-left">
              <div className="text-5xl md:text-7xl text-[#9bbc0f] mb-3">
                {avatar.emoji}
              </div>
              <div className="text-[#8bac0f] text-lg font-bold">{avatar.status}</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-[#8bac0f] mb-2">
                  <span>HAPPINESS</span>
                  <span>{happiness}%</span>
                </div>
                <div className="h-6 bg-black border-2 border-[#8bac0f] overflow-hidden">
                  <div
                    className="h-full bg-[#9bbc0f] transition-all duration-500"
                    style={{ width: `${happiness}%`, height: '100%' }}
                  />
                </div>
              </div>
              <div className="text-[#8bac0f] text-lg flex justify-between items-center">
                <span>TOTAL DRINKS</span>
                <span className="text-[#9bbc0f] font-bold text-2xl">{drinks}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-[#0f380f] border-4 border-[#306230] p-4 md:p-6 mb-4 shadow-lg">
          <h2 className="text-xl md:text-2xl font-bold text-[#9bbc0f] mb-4 tracking-wider">
            MAP
          </h2>
          <div
            ref={mapRef}
            className="border-4 border-[#306230] h-64 md:h-96 bg-[#306230]"
            style={{ zIndex: 1 }}
          />
          <div className="mt-3 text-xs text-[#8bac0f]">
            Click markers to view shops • OpenStreetMap
          </div>
        </div>

        {/* Shop Grid - ALWAYS 2 COLUMNS */}
        <div className="bg-[#0f380f] border-4 border-[#306230] p-4 md:p-6 shadow-lg">
          <h2 className="text-xl md:text-2xl font-bold text-[#9bbc0f] mb-4 tracking-wider">
            TOP RATED
          </h2>
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            {shops.map((shop, index) => (
              <div
                key={shop.id}
                className="bg-[#306230] border-3 border-[#8bac0f] p-3 md:p-4 hover:bg-[#0f380f] hover:border-[#9bbc0f] transition-colors"
              >
                <div className="mb-3">
                  <div className="flex items-center gap-1 md:gap-2 mb-2 flex-wrap">
                    <span className="text-[#9bbc0f] font-bold text-base md:text-xl">#{index + 1}</span>
                    <h3 className="text-[#9bbc0f] font-bold text-xs md:text-sm">
                      {shop.name}
                    </h3>
                    {visitedShops.includes(shop.id) && (
                      <span className="text-sm md:text-base">🧋</span>
                    )}
                  </div>
                  <div className="text-[#8bac0f] text-xs md:text-sm mb-1">
                    {'★'.repeat(Math.floor(shop.rating))} {shop.rating}
                  </div>
                  <div className="text-[#8bac0f] text-[10px] md:text-xs">{shop.address}</div>
                </div>
                <button
                  onClick={() => logDrink(shop.id)}
                  className="bg-[#0f380f] hover:bg-[#306230] text-[#9bbc0f] px-2 md:px-4 py-2 border-2 border-[#8bac0f] font-bold text-xs md:text-sm transition-all w-full"
                >
                  LOG DRINK
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-[#0f380f] text-xs">
          <p>GAME BOY © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default BobaTracker;

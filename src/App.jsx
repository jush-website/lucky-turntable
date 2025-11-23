import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, RotateCcw, X, Sparkles, MapPin, Search, Star, Navigation, ExternalLink, Crosshair, Map as MapIcon } from 'lucide-react';

const COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#F1948A', // Pink
  '#82E0AA', // Green
  '#85C1E9', // Light Blue
];

const DecisionWheel = () => {
  // --- Existing State ---
  const [items, setItems] = useState([
    { id: 1, text: '吃拉麵' },
    { id: 2, text: '喝珍奶' },
    { id: 3, text: '吃壽司' },
  ]);
  const [newItemText, setNewItemText] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  // --- New State for Maps/Search ---
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'search'
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Add new item manually
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    addItemToWheel(newItemText.trim());
    setNewItemText('');
  };

  // Helper to add item (used by both manual and map)
  const addItemToWheel = (text) => {
    setItems(prev => [
      ...prev,
      { id: Date.now() + Math.random(), text: text }
    ]);
  };

  // Remove item
  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  // --- Real Map Search Logic (OpenStreetMap Nominatim) ---
  const handleSearchNearby = async (e) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;
    if (!userLocation) {
      requestLocation();
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setLocationError(null);

    try {
      // Define a bounding box for "nearby" (approx 5km radius)
      const offset = 0.045;
      const viewbox = [
        userLocation.lng - offset, // left
        userLocation.lat - offset, // top
        userLocation.lng + offset, // right
        userLocation.lat + offset  // bottom
      ].join(',');

      // Fetch from OpenStreetMap Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchKeyword)}&viewbox=${viewbox}&bounded=1&limit=10&accept-language=zh-TW`
      );

      if (!response.ok) throw new Error('搜尋失敗，請稍後再試');

      const data = await response.json();

      // Process results
      const formattedResults = data.map((place, index) => {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, parseFloat(place.lat), parseFloat(place.lon));
        const displayName = place.display_name.split(',')[0]; 

        return {
          id: place.place_id || `osm-${index}`,
          name: displayName,
          rating: null, 
          distance: dist, 
          address: place.display_name.replace(displayName + ', ', ''), 
          lat: place.lat,
          lon: place.lon
        };
      });

      setSearchResults(formattedResults);
    } catch (error) {
      console.error("Search error:", error);
      setLocationError("搜尋發生錯誤，請檢查網路連線");
    } finally {
      setIsSearching(false);
    }
  };

  // Calculate distance between two coordinates (Haversine formula) in meters
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c;
    
    if (d > 1000) {
      return (d / 1000).toFixed(1) + ' km';
    }
    return Math.round(d) + ' m';
  };

  // 取得真實使用者位置 (Improved Robustness)
  const requestLocation = () => {
    setIsSearching(true); 
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("您的瀏覽器不支援地理定位");
      setIsSearching(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ 
          lat: position.coords.latitude, 
          lng: position.coords.longitude 
        });
        setIsSearching(false);
      }, 
      (error) => {
        console.warn("Geolocation access failed:", error.code, error.message);
        
        let errorMsg = "無法自動取得位置";
        if (error.code === 1) errorMsg = "位置權限被拒絕";
        else if (error.code === 3) errorMsg = "定位逾時";

        const fallbackLocation = { lat: 25.033964, lng: 121.564468 }; // Taipei 101
        setUserLocation(fallbackLocation);
        
        setLocationError(`${errorMsg}，已切換至預設位置(台北)以供測試搜尋。`);
        setIsSearching(false);
      },
      { 
        enableHighAccuracy: false, 
        timeout: 10000,            
        maximumAge: 60000          
      }
    );
  };

  useEffect(() => {
    if (activeTab === 'search' && !userLocation) {
        requestLocation();
    }
  }, [activeTab]);


  // --- Wheel Logic ---
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const spinWheel = () => {
    if (isSpinning || items.length < 2) return;
    setIsSpinning(true);
    setWinner(null);
    setShowWinnerModal(false);
    const newRotation = rotation + 1800 + Math.random() * 360;
    setRotation(newRotation);
    setTimeout(() => {
      setIsSpinning(false);
      calculateWinner(newRotation);
      setShowWinnerModal(true);
    }, 4000);
  };

  const calculateWinner = (finalRotation) => {
    const degrees = finalRotation % 360;
    const sliceAngle = 360 / items.length;
    const effectiveAngle = (360 - (degrees % 360)) % 360;
    const winningIndex = Math.floor(effectiveAngle / sliceAngle);
    if (items[winningIndex]) {
        setWinner(items[winningIndex]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 font-sans text-slate-800">
      <header className="mb-8 text-center px-4">
        <h1 className="text-4xl font-black text-indigo-600 tracking-tight mb-2">
          命運轉盤 + 真實地圖
        </h1>
        <p className="text-slate-500">輸入選項或搜尋附近真實地點，交給命運決定！</p>
      </header>

      {/* Main Grid Layout */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 pb-20">
        
        {/* Left Column: The Wheel (Takes up 5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-white rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
           {/* Decorative background blob */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

           <div className="relative w-full max-w-[340px] aspect-square z-10">
            {/* Pointer */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 filter drop-shadow-md">
              <div className="w-8 h-10 bg-indigo-600 [clip-path:polygon(50%_100%,_0_0,_100%_0)]"></div>
            </div>

            {/* Wheel SVG Container */}
            <div className="w-full h-full p-1">
              <div 
                className="w-full h-full rounded-full overflow-hidden shadow-inner border-4 border-slate-100 box-content"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
                }}
              >
                <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
                  {items.length === 0 && <circle cx="0" cy="0" r="1" fill="#f1f5f9" />}
                  {items.length === 1 && <circle cx="0" cy="0" r="1" fill={COLORS[0]} />}
                  {items.length > 1 && items.map((item, index) => {
                    const sliceAngle = 1 / items.length;
                    const startAngle = index * sliceAngle;
                    const endAngle = (index + 1) * sliceAngle;
                    const [startX, startY] = getCoordinatesForPercent(startAngle);
                    const [endX, endY] = getCoordinatesForPercent(endAngle);
                    const largeArcFlag = sliceAngle > 0.5 ? 1 : 0;
                    const pathData = `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
                    const midAngle = startAngle + (sliceAngle / 2);
                    const rotateText = midAngle * 360;

                    return (
                      <g key={item.id}>
                        <path d={pathData} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth="0.01" />
                        <text
                          x="0.65" y="0" 
                          fill="white" 
                          fontFamily="system-ui, sans-serif"
                          fontSize="0.08" 
                          fontWeight="800" 
                          textAnchor="middle" 
                          alignmentBaseline="middle"
                          transform={`rotate(${rotateText})`}
                          style={{ pointerEvents: 'none', userSelect: 'none', textShadow: '1px 1px 0 rgba(0,0,0,0.1)' }}
                        >
                          {item.text.length > 10 ? item.text.substring(0, 9) + '...' : item.text}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Spin Button */}
            <button
              onClick={spinWheel}
              disabled={isSpinning || items.length < 2}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white border-4 border-indigo-50 rounded-full shadow-lg flex items-center justify-center z-10 hover:scale-105 active:scale-95 transition-transform disabled:opacity-80 disabled:cursor-not-allowed group"
            >
              <span className={`text-xl font-black ${isSpinning ? 'text-slate-400' : 'text-indigo-600'}`}>
                {isSpinning ? '...' : 'GO'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: Controls (Takes up 7 cols) */}
        {/* Layout Fix: Removed fixed height on mobile to allow content to flow naturally. Added fixed height only on lg screens for dashboard feel */}
        <div className="lg:col-span-7 flex flex-col gap-4 lg:h-[600px]">
          
          {/* Tabs */}
          <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-fit">
            <button 
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'manual' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Plus size={16} /> 手動輸入
            </button>
            <button 
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'search' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <MapIcon size={16} /> GPS 搜尋附近
            </button>
          </div>

          {/* Layout Fix: Improved flex behavior. On mobile (default), it stacks. On md (tablet/desktop), it attempts row. */}
          <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden h-full">
            
            {/* Input/Search Area */}
            {/* Layout Fix: Added min-height for mobile map view */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] md:min-h-0">
              
              {/* TAB 1: Manual Input */}
              {activeTab === 'manual' && (
                <div className="p-6 flex flex-col h-full animate-fade-in">
                  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-indigo-500" />
                    新增選項
                  </h2>
                  <form onSubmit={handleAddItem} className="flex gap-2 mb-6">
                    <input
                      type="text"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="輸入選項名稱..."
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                      disabled={isSpinning}
                    />
                    <button type="submit" disabled={!newItemText.trim() || isSpinning} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl font-bold">
                      新增
                    </button>
                  </form>
                  <div className="flex-1 flex items-center justify-center text-slate-300 text-sm bg-slate-50 rounded-xl border-2 border-dashed border-slate-100">
                    在此處快速輸入自訂選項
                  </div>
                </div>
              )}

              {/* TAB 2: Real Map Search */}
              {activeTab === 'search' && (
                <div className="flex flex-col h-full animate-fade-in">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <MapPin size={20} className="text-indigo-500" />
                            搜尋附近
                        </h2>
                        {!userLocation && !isSearching && (
                            <button onClick={requestLocation} className="text-xs text-indigo-600 underline flex items-center">
                                <Crosshair size={12} className="mr-1"/> 重新定位
                            </button>
                        )}
                    </div>
                    
                    {locationError ? (
                        <div className="mb-2 p-2 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-center gap-2">
                            <X size={14} /> 
                            <span className="flex-1">{locationError}</span>
                            <button onClick={requestLocation} className="underline shrink-0">重試</button>
                        </div>
                    ) : (
                        userLocation && (
                            <div className="mb-2 text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 w-fit px-2 py-1 rounded-full">
                                <Crosshair size={10} /> GPS 定位完成
                            </div>
                        )
                    )}

                    <form onSubmit={handleSearchNearby} className="flex gap-2">
                      <div className="relative flex-1">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                         <input
                          type="text"
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                          placeholder={userLocation ? "輸入關鍵字 (例: 飲料, 7-11)" : "請先允許定位..."}
                          disabled={!userLocation}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isSearching || !searchKeyword.trim() || !userLocation}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      >
                        {isSearching ? '...' : '搜尋'}
                      </button>
                    </form>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-2 bg-slate-50 custom-scrollbar relative">
                     {isSearching ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3 bg-white/80 z-10">
                         <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                         <span className="text-sm font-medium">搜尋中...</span>
                       </div>
                     ) : searchResults.length > 0 ? (
                       <div className="grid gap-2 p-2">
                         {searchResults.map((place) => (
                           <div key={place.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                             <div className="flex justify-between items-start gap-3">
                                 <div className="min-w-0">
                                     <h3 className="font-bold text-slate-800 text-sm truncate">{place.name}</h3>
                                     <div className="flex items-center text-xs text-slate-500 gap-2 mt-1">
                                        <span className="flex items-center font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
                                            <Navigation size={10} className="mr-1" />{place.distance}
                                        </span>
                                        <span className="truncate text-slate-400">{place.address}</span>
                                     </div>
                                 </div>
                                 <button
                                   onClick={() => addItemToWheel(place.name)}
                                   className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0"
                                   title="加入轉盤"
                                 >
                                   <Plus size={18} />
                                 </button>
                             </div>
                             
                             <div className="mt-2 pt-2 border-t border-slate-50 flex justify-end">
                                {/* Link to Google Maps using coordinates */}
                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-[10px] text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    <ExternalLink size={10} className="mr-1" /> Google Maps
                                </a>
                             </div>
                           </div>
                         ))}
                         <div className="text-center text-[10px] text-slate-300 pt-2 pb-4">
                             資料來源: OpenStreetMap
                         </div>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm p-8 text-center">
                         <MapPin size={48} className="mb-3 opacity-20" />
                         {!userLocation ? (
                             <p>請先允許瀏覽器存取您的 GPS 位置</p>
                         ) : (
                             <>
                                <p className="font-medium text-slate-600">準備搜尋</p>
                                <p className="text-xs opacity-60 mt-1 max-w-[200px]">輸入關鍵字（如：拉麵、7-11、景點）將搜尋您目前位置 5km 內的結果</p>
                             </>
                         )}
                       </div>
                     )}
                  </div>
                </div>
              )}
            </div>

            {/* Current List Area */}
            {/* Layout Fix: Full width on mobile, fixed width on desktop */}
            <div className="w-full md:w-64 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-[300px] md:h-auto shrink-0">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-700 text-sm">已選項目 ({items.length})</h3>
                <button onClick={() => setItems([])} className="text-xs text-red-400 hover:text-red-600 font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors">
                  清空
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                {items.length === 0 && <div className="text-center py-8 text-slate-300 text-xs">轉盤是空的</div>}
                {items.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-2 mb-1 rounded-lg hover:bg-slate-50 group text-sm transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="font-medium text-slate-600 truncate">{item.text}</span>
                    </div>
                    <button onClick={() => handleRemoveItem(item.id)} className="text-slate-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Winner Modal */}
      {showWinnerModal && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform animate-bounce-in text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 rounded-b-[50%] -translate-y-16"></div>
            <button onClick={() => setShowWinnerModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
              <X size={20} />
            </button>
            <div className="mt-4 mb-6 flex justify-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 shadow-inner">
                <Sparkles size={40} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">命運的選擇是...</h3>
            <p className="text-3xl font-black text-indigo-600 mb-8 break-words leading-tight px-2">{winner.text}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowWinnerModal(false)} className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-100 font-bold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors">關閉</button>
              <button onClick={() => spinWheel()} className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                <RotateCcw size={18} /> 再轉一次
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bounce-in { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-bounce-in { animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default DecisionWheel;

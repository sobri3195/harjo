
import React from 'react';

const AmbulanceHeader = () => {
  return (
    <header className="bg-emergency-red-600 text-white px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-emergency-red-600 font-bold text-lg">🚑</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">Ambulans Emergency Button TNI AU</h1>
            <p className="text-xs text-red-200">RSPAU dr. Suhardi Harjolukito</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs">AKTIF</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AmbulanceHeader;

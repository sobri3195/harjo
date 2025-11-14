
import React from 'react';

const Header = () => {
  return (
    <header className="bg-navy-blue-800 text-white px-4 pt-safe py-3 shadow-lg">
      <div className="flex items-center justify-between" style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}>
        <div className="flex items-center space-x-3">
          {/* Logo placeholder */}
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-navy-blue-800 font-bold text-lg">🚑</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">Emergency Button RSPAU</h1>
            <p className="text-xs text-blue-200">RSPAU dr. Suhardi Harjolukito</p>
          </div>
        </div>
        <div className="text-right">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;

// components/ui/Header.jsx
import React from 'react';

const Header = () => {
  return (
    <header className="bg-gray-900 border-b border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-400">Layspan</h1>
            </div>
            <div className="ml-4">
              <span className="text-sm text-gray-300">SoF Event Extractor</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href="http://theimehub.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
            >
              by Integrated Maritime Exchange
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

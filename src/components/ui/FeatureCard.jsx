// components/ui/FeatureCard.jsx
import React from 'react';

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg hover:shadow-xl hover:bg-gray-750 transition-all duration-200">
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-white">{title}</h3>
      </div>
      <p className="text-gray-300">{description}</p>
    </div>
  );
};

export default FeatureCard;

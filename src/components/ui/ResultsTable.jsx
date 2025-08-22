// components/ui/ResultsTable.jsx
'use client';
import React, { useState } from 'react';

const ResultsTable = ({ results, onDownload, processingStats }) => {
  const [sortField, setSortField] = useState('startTime');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showStats, setShowStats] = useState(false);

  // Validation function to detect potential issues with duplicate removal
  const validateDuplicateRemoval = (stats) => {
    if (!stats) return null;
    
    const removalRate = stats.duplicate_removal_percentage || 0;
    const totalRemoved = stats.total_duplicates_removed || 0;
    
    if (removalRate > 50) {
      return {
        level: 'error',
        message: `Very high duplicate removal rate (${removalRate}%). This might indicate legitimate events are being removed incorrectly.`
      };
    } else if (removalRate > 30) {
      return {
        level: 'warning', 
        message: `High duplicate removal rate (${removalRate}%). Please verify that legitimate events aren't being removed.`
      };
    } else if (totalRemoved > 0) {
      return {
        level: 'info',
        message: `${totalRemoved} duplicate events were successfully identified and removed.`
      };
    }
    
    return null;
  };

  const validationResult = validateDuplicateRemoval(processingStats);

  if (!results || results.length === 0) return null;

  const sortedResults = [...results].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // This ensures 24-hour format
    });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;
    const diffHours = diffMs / (1000 * 60 * 60); // Convert to hours with decimals
    return `${diffHours.toFixed(2)} hours`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-medium text-white">
            Extracted Events ({results.length} events found)
          </h3>
          {processingStats && (
            <button
              onClick={() => setShowStats(!showStats)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-700 text-blue-100 hover:bg-blue-600 transition-colors"
            >
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Processing Stats
            </button>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onDownload('json')}
            className="inline-flex items-center px-3 py-2 border border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            JSON
          </button>
          <button
            onClick={() => onDownload('csv')}
            className="inline-flex items-center px-3 py-2 border border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            CSV
          </button>
        </div>
      </div>

      {/* Duplicate Removal Statistics Panel */}
      {showStats && processingStats && (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3">Duplicate Removal Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Files Processed:</span>
              <div className="text-white font-medium">{processingStats.files_processed}</div>
            </div>
            <div>
              <span className="text-gray-400">Total Events Found:</span>
              <div className="text-white font-medium">{processingStats.total_events_found}</div>
            </div>
            <div>
              <span className="text-gray-400">Exact Duplicates Removed:</span>
              <div className="text-yellow-400 font-medium">{processingStats.exact_duplicates_removed || 0}</div>
            </div>
            <div>
              <span className="text-gray-400">Similar Events Removed:</span>
              <div className="text-yellow-400 font-medium">{processingStats.similar_events_removed || 0}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Final Unique Events:</span>
              <span className="text-green-400 font-medium">{processingStats.unique_events}</span>
            </div>
            {validationResult && (
              <div className={`mt-2 p-2 rounded text-xs ${
                validationResult.level === 'error' ? 'bg-red-900 border border-red-700 text-red-200' :
                validationResult.level === 'warning' ? 'bg-yellow-900 border border-yellow-700 text-yellow-200' :
                'bg-blue-900 border border-blue-700 text-blue-200'
              }`}>
                {validationResult.level === 'error' ? '❌' : validationResult.level === 'warning' ? '⚠️' : 'ℹ️'} {validationResult.message}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-hidden shadow-xl ring-1 ring-gray-600 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-gray-800">
            <tr>
              <th 
                scope="col" 
                className="px-8 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                onClick={() => handleSort('event')}
              >
                <div className="flex items-center space-x-1">
                  <span>Event</span>
                  {sortField === 'event' && (
                    <svg className={`h-5 w-5 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-8 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                onClick={() => handleSort('startTime')}
              >
                <div className="flex items-center space-x-1">
                  <span>Start Time</span>
                  {sortField === 'startTime' && (
                    <svg className={`h-5 w-5 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-8 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                onClick={() => handleSort('endTime')}
              >
                <div className="flex items-center space-x-1">
                  <span>End Time</span>
                  {sortField === 'endTime' && (
                    <svg className={`h-5 w-5 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </th>
              <th scope="col" className="px-8 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                Duration (Hours)
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {sortedResults.map((event, index) => (
              <tr key={index} className="hover:bg-gray-800 transition-colors">
                <td className="px-8 py-5 whitespace-nowrap">
                  <div className="text-base font-medium text-white">{event.event}</div>
                  {event.description && (
                    <div className="text-sm text-gray-400 mt-1">{event.description}</div>
                  )}
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-base text-gray-300">
                  {formatDateTime(event.startTime)}
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-base text-gray-300">
                  {formatDateTime(event.endTime)}
                </td>
                <td className="px-8 py-5 whitespace-nowrap text-base text-gray-300 font-medium">
                  {event.duration || calculateDuration(event.startTime, event.endTime)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;

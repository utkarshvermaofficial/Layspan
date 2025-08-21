'use client';
import React from 'react';

const AnalysisPanel = ({ analysis, events }) => {
  if (!analysis && (!events || events.length === 0)) return null;

  // Calculate statistics from events if analysis is not provided
  const calculateStatistics = () => {
    if (!events || events.length === 0) return null;

    const totalDuration = events.reduce((total, event) => {
      const duration = parseDuration(event.duration);
      return total + duration;
    }, 0);

    const productiveTime = events
      .filter(event => event.event === 'Full Work' || event.event === 'Laytime Commenced')
      .reduce((total, event) => total + parseDuration(event.duration), 0);

    const weatherDelays = events
      .filter(event => event.event === 'Rain')
      .reduce((total, event) => total + parseDuration(event.duration), 0);

    const weekendTime = events
      .filter(event => event.event === 'Weekend')
      .reduce((total, event) => total + parseDuration(event.duration), 0);

    const breakdownTime = events
      .filter(event => event.event === 'Machine Breakdown')
      .reduce((total, event) => total + parseDuration(event.duration), 0);

    const efficiency = totalDuration > 0 ? (productiveTime / totalDuration) * 100 : 0;

    return {
      totalDuration,
      productiveTime,
      weatherDelays,
      weekendTime,
      breakdownTime,
      efficiency
    };
  };

  const parseDuration = (duration) => {
    if (!duration || duration === 'N/A') return 0;
    if (typeof duration === 'string' && duration.includes(':')) {
      const [hours, minutes] = duration.split(':').map(Number);
      return (hours || 0) + (minutes || 0) / 60;
    }
    if (typeof duration === 'string' && duration.includes('h')) {
      const match = duration.match(/(\d+)h\s*(\d+)?m?/);
      if (match) {
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        return hours + minutes / 60;
      }
    }
    return 0;
  };

  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const stats = calculateStatistics();
  const analysisData = analysis || {};

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <svg className="h-6 w-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Laytime Analysis & Insights
      </h3>

      {/* Vessel Information */}
      {analysisData.vessel_info && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-medium text-white mb-3">Vessel Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Vessel:</span>
              <span className="text-white ml-2">{analysisData.vessel_info.vessel_name}</span>
            </div>
            <div>
              <span className="text-gray-400">Loading Port:</span>
              <span className="text-white ml-2">{analysisData.vessel_info.loading_port}</span>
            </div>
            <div>
              <span className="text-gray-400">Cargo:</span>
              <span className="text-white ml-2">{analysisData.vessel_info.cargo}</span>
            </div>
            <div>
              <span className="text-gray-400">Owner:</span>
              <span className="text-white ml-2">{analysisData.vessel_info.owner}</span>
            </div>
            <div>
              <span className="text-gray-400">Charterer:</span>
              <span className="text-white ml-2">{analysisData.vessel_info.charterer}</span>
            </div>
            <div>
              <span className="text-gray-400">CP Date:</span>
              <span className="text-white ml-2">{analysisData.vessel_info.charter_party_date}</span>
            </div>
          </div>
        </div>
      )}

      {/* Laytime Details */}
      {analysisData.laytime_details && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-medium text-white mb-3">Commercial Terms</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Cargo Quantity:</span>
              <span className="text-white ml-2">{analysisData.laytime_details.cargo_quantity}</span>
            </div>
            <div>
              <span className="text-gray-400">Loading Rate:</span>
              <span className="text-white ml-2">{analysisData.laytime_details.loading_rate}</span>
            </div>
            <div>
              <span className="text-gray-400">Demurrage Rate:</span>
              <span className="text-red-400 ml-2">{analysisData.laytime_details.demurrage_rate}</span>
            </div>
            <div>
              <span className="text-gray-400">Despatch Rate:</span>
              <span className="text-green-400 ml-2">{analysisData.laytime_details.despatch_rate}</span>
            </div>
          </div>
        </div>
      )}

      {/* Time Breakdown */}
      {(stats || analysisData.time_breakdown) && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-medium text-white mb-3">Time Breakdown Analysis</h4>
          <div className="space-y-3">
            {/* Time bars */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-green-400 text-sm">Productive Time</span>
                <span className="text-white text-sm">
                  {stats ? formatHours(stats.productiveTime) : analysisData.time_breakdown?.productive_time}
                </span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ 
                    width: `${stats ? (stats.productiveTime / stats.totalDuration) * 100 : 50}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-blue-400 text-sm">Weather Delays</span>
                <span className="text-white text-sm">
                  {stats ? formatHours(stats.weatherDelays) : analysisData.time_breakdown?.weather_delays}
                </span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ 
                    width: `${stats ? (stats.weatherDelays / stats.totalDuration) * 100 : 20}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Weekend Time</span>
                <span className="text-white text-sm">
                  {stats ? formatHours(stats.weekendTime) : analysisData.time_breakdown?.weekend_time}
                </span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-gray-500 h-2 rounded-full" 
                  style={{ 
                    width: `${stats ? (stats.weekendTime / stats.totalDuration) * 100 : 15}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-red-400 text-sm">Equipment Breakdown</span>
                <span className="text-white text-sm">
                  {stats ? formatHours(stats.breakdownTime) : analysisData.time_breakdown?.breakdown_time}
                </span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ 
                    width: `${stats ? (stats.breakdownTime / stats.totalDuration) * 100 : 10}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Efficiency Metrics */}
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Overall Efficiency:</span>
              <span className={`font-medium ${stats?.efficiency > 70 ? 'text-green-400' : stats?.efficiency > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                {stats ? `${stats.efficiency.toFixed(1)}%` : analysisData.efficiency_analysis?.overall_efficiency}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-400">Total Operation Time:</span>
              <span className="text-white">
                {stats ? formatHours(stats.totalDuration) : analysisData.time_breakdown?.total_time}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Key Insights & Recommendations */}
      {analysisData.remarks && (
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-4">
          <h4 className="text-lg font-medium text-white mb-3 flex items-center">
            <svg className="h-5 w-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Key Insights & Recommendations
          </h4>
          <p className="text-gray-200 leading-relaxed">
            {analysisData.remarks}
          </p>
        </div>
      )}

      {/* Main Delay Factors */}
      {analysisData.efficiency_analysis?.main_delay_factors && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-medium text-white mb-3">Main Delay Factors</h4>
          <div className="space-y-2">
            {Array.isArray(analysisData.efficiency_analysis.main_delay_factors) 
              ? analysisData.efficiency_analysis.main_delay_factors.map((factor, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                    <span className="text-gray-300">{factor}</span>
                  </div>
                ))
              : (
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                    <span className="text-gray-300">{analysisData.efficiency_analysis.main_delay_factors}</span>
                  </div>
                )
            }
          </div>
        </div>
      )}

      {/* Cost Impact */}
      {analysisData.efficiency_analysis?.cost_impact && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-medium text-white mb-3">Cost Impact Analysis</h4>
          <p className="text-gray-300 text-sm">
            {analysisData.efficiency_analysis.cost_impact}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;

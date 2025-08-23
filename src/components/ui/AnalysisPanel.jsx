'use client';
import React from 'react';
import jsPDF from 'jspdf';

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

  // Helper function to convert time strings to hours format
  const convertToHours = (timeStr) => {
    if (!timeStr) return '0.00 hours';
    
    // If it's already in hours format, return as is
    if (timeStr.includes('hours')) return timeStr;
    
    // Handle HH:MM format
    if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const totalHours = hours + (minutes / 60);
      return `${totalHours.toFixed(2)} hours`;
    }
    
    // Handle "X hours Y minutes" format
    const hoursMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*hours?/i);
    const minutesMatch = timeStr.match(/(\d+)\s*minutes?/i);
    let totalHours = 0;
    
    if (hoursMatch) totalHours += parseFloat(hoursMatch[1]);
    if (minutesMatch) totalHours += parseFloat(minutesMatch[1]) / 60;
    
    if (totalHours > 0) return `${totalHours.toFixed(2)} hours`;
    
    // Handle "Xh Ym" format
    const hMatch = timeStr.match(/(\d+)h\s*(\d+)?m?/);
    if (hMatch) {
      const hours = parseInt(hMatch[1]) || 0;
      const minutes = parseInt(hMatch[2]) || 0;
      const totalHours = hours + minutes / 60;
      return `${totalHours.toFixed(2)} hours`;
    }
    
    // Handle just numbers (assume hours)
    const numMatch = timeStr.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) {
      return `${parseFloat(numMatch[1]).toFixed(2)} hours`;
    }
    
    return timeStr; // Return original if no pattern matches
  };

  // Helper function to get efficiency color
  const getEfficiencyColor = (efficiency) => {
    let numValue = 0;
    
    if (typeof efficiency === 'string') {
      numValue = parseFloat(efficiency.replace('%', ''));
    } else if (typeof efficiency === 'number') {
      numValue = efficiency;
    }
    
    if (numValue > 70) return 'text-green-400';
    if (numValue > 50) return 'text-yellow-400';
    if (numValue > 0) return 'text-red-400';
    return 'text-gray-400';
  };

  // Helper function to format efficiency value
  const formatEfficiency = (efficiency) => {
    if (typeof efficiency === 'string') {
      return efficiency.includes('%') ? efficiency : `${efficiency}%`;
    }
    if (typeof efficiency === 'number') {
      return `${efficiency.toFixed(1)}%`;
    }
    return 'N/A';
  };

  // PDF Export Function
  const exportToPDF = () => {
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    
    // Helper function to add new page if needed
    const checkPageBreak = (additionalHeight = 10) => {
      if (yPosition + additionalHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Maritime Analysis Report', margin, yPosition);
    yPosition += 20;

    // Vessel Information
    if (analysisData.vessel_info) {
      checkPageBreak(50);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Vessel Information', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      const vesselInfo = [
        `Vessel: ${analysisData.vessel_info.vessel_name || 'N/A'}`,
        `Loading Port: ${analysisData.vessel_info.loading_port || 'N/A'}`,
        `Cargo: ${analysisData.vessel_info.cargo || 'N/A'}`,
        `Owner: ${analysisData.vessel_info.owner || 'N/A'}`,
        `Charterer: ${analysisData.vessel_info.charterer || 'N/A'}`,
        `CP Date: ${analysisData.vessel_info.charter_party_date || 'N/A'}`
      ];
      
      vesselInfo.forEach(info => {
        checkPageBreak();
        doc.text(info, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Commercial Terms
    if (analysisData.laytime_details) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Commercial Terms', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      const commercialTerms = [
        `Cargo Quantity: ${analysisData.laytime_details.cargo_quantity || 'N/A'}`,
        `Loading Rate: ${analysisData.laytime_details.loading_rate || 'N/A'}`,
        `Demurrage Rate: ${analysisData.laytime_details.demurrage_rate || 'N/A'}`,
        `Despatch Rate: ${analysisData.laytime_details.despatch_rate || 'N/A'}`
      ];
      
      commercialTerms.forEach(term => {
        checkPageBreak();
        doc.text(term, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Time Breakdown Analysis
    if (analysisData.time_breakdown || stats) {
      checkPageBreak(80);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Time Breakdown Analysis', margin, yPosition);
      yPosition += 10;
      
      if (analysisData.time_breakdown?.parallel_work_note) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'italic');
        const splitNote = doc.splitTextToSize(analysisData.time_breakdown.parallel_work_note, 170);
        doc.text(splitNote, margin, yPosition);
        yPosition += splitNote.length * 4 + 5;
      }
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      const timeBreakdown = [
        `Productive Time: ${analysisData.time_breakdown?.productive_time ? convertToHours(analysisData.time_breakdown.productive_time) : (stats ? `${stats.productiveTime.toFixed(2)} hours` : '0.00 hours')}`,
        `Weather Delays: ${analysisData.time_breakdown?.weather_delays ? convertToHours(analysisData.time_breakdown.weather_delays) : (stats ? `${stats.weatherDelays.toFixed(2)} hours` : '0.00 hours')}`,
        `Weekend Time: ${analysisData.time_breakdown?.weekend_time ? convertToHours(analysisData.time_breakdown.weekend_time) : (stats ? `${stats.weekendTime.toFixed(2)} hours` : '0.00 hours')}`,
        `Equipment Breakdown: ${(analysisData.time_breakdown?.equipment_breakdown || analysisData.time_breakdown?.breakdown_time) ? convertToHours(analysisData.time_breakdown.equipment_breakdown || analysisData.time_breakdown.breakdown_time) : (stats ? `${stats.breakdownTime.toFixed(2)} hours` : '0.00 hours')}`
      ];
      
      if (analysisData.time_breakdown?.other_delays) {
        timeBreakdown.push(`Other Delays: ${convertToHours(analysisData.time_breakdown.other_delays)}`);
      }
      
      timeBreakdown.forEach(breakdown => {
        checkPageBreak();
        doc.text(breakdown, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Efficiency Metrics
    if (analysisData.efficiency_analysis || stats) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Efficiency Metrics', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      const efficiencyMetrics = [
        `Overall Efficiency: ${formatEfficiency(analysisData.efficiency_analysis?.overall_efficiency) || (stats ? `${stats.efficiency.toFixed(1)}%` : 'N/A')}`,
        `Total Operation Time: ${analysisData.time_breakdown?.total_operation_time ? convertToHours(analysisData.time_breakdown.total_operation_time) : (stats ? `${stats.totalDuration.toFixed(2)} hours` : 'N/A')}`
      ];
      
      if (analysisData.efficiency_analysis?.time_based_efficiency) {
        efficiencyMetrics.push(`Time-Based Efficiency: ${formatEfficiency(analysisData.efficiency_analysis.time_based_efficiency)}`);
      }
      
      efficiencyMetrics.forEach(metric => {
        checkPageBreak();
        doc.text(metric, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Key Insights & Recommendations
    if (analysisData.remarks) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Key Insights & Recommendations', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const splitRemarks = doc.splitTextToSize(analysisData.remarks, 170);
      splitRemarks.forEach(line => {
        checkPageBreak();
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
    }

    // Main Delay Factors
    if (analysisData.efficiency_analysis?.main_delay_factors) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Main Delay Factors', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      const factors = Array.isArray(analysisData.efficiency_analysis.main_delay_factors) 
        ? analysisData.efficiency_analysis.main_delay_factors 
        : [analysisData.efficiency_analysis.main_delay_factors];
      
      factors.forEach((factor, index) => {
        checkPageBreak();
        doc.text(`• ${factor}`, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Cost Impact Analysis
    if (analysisData.efficiency_analysis?.cost_impact) {
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Cost Impact Analysis', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const splitCostImpact = doc.splitTextToSize(analysisData.efficiency_analysis.cost_impact, 170);
      splitCostImpact.forEach(line => {
        checkPageBreak();
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
    }

    // Events Table (Tasks)
    if (Array.isArray(events) && events.length) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Event Log', margin, yPosition);
      yPosition += 10;

      // Table headers
      const colWidths = { idx: 8, event: 60, start: 38, end: 38, duration: 26 }; // total 170
      const headerY = yPosition;
      const rowHeight = 8;
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('#', margin + 1, headerY);
      doc.text('Event', margin + colWidths.idx + 1, headerY);
      doc.text('Start', margin + colWidths.idx + colWidths.event + 1, headerY);
      doc.text('End', margin + colWidths.idx + colWidths.event + colWidths.start + 1, headerY);
      doc.text('Duration', margin + colWidths.idx + colWidths.event + colWidths.start + colWidths.end + 1, headerY);
      yPosition += 4;
      doc.setDrawColor(200);
      doc.line(margin, yPosition, margin + 170, yPosition);
      yPosition += 3;
      doc.setFont(undefined, 'normal');

      const formatDateTime = (dateTime) => {
        if (!dateTime) return 'N/A';
        try {
          return new Date(dateTime).toLocaleString('en-GB', {
            year: '2-digit', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false
          });
        } catch { return 'N/A'; }
      };
      const calcDuration = (start, end) => {
        if (!start || !end) return 'N/A';
        const diff = new Date(end) - new Date(start);
        if (isNaN(diff) || diff < 0) return 'N/A';
        return (diff / 3600000).toFixed(2) + 'h';
      };

      events.forEach((ev, idx) => {
        // Split event text if too long
        const eventLines = doc.splitTextToSize(ev.event || '—', colWidths.event - 2);
        const neededHeight = Math.max(eventLines.length * 4, rowHeight);
        checkPageBreak(neededHeight + 4);

        let rowY = yPosition + 3; // baseline for text
        // Draw background band (alternating)
        if (idx % 2 === 0) {
          doc.setFillColor(36, 52, 75); // subtle blue-gray
          doc.rect(margin, yPosition, 170, neededHeight, 'F');
        }
        // Index
        doc.setTextColor(255);
        doc.text(String(idx + 1), margin + 1, rowY);
        // Event multiline
        eventLines.forEach((line, lineIdx) => {
          doc.text(line, margin + colWidths.idx + 1, rowY + lineIdx * 4);
        });
        // Start
        doc.text(formatDateTime(ev.startTime), margin + colWidths.idx + colWidths.event + 1, rowY);
        // End
        doc.text(formatDateTime(ev.endTime), margin + colWidths.idx + colWidths.event + colWidths.start + 1, rowY);
        // Duration
        const durationText = ev.duration ? ev.duration.replace('hours','h') : calcDuration(ev.startTime, ev.endTime);
        doc.text(durationText, margin + colWidths.idx + colWidths.event + colWidths.start + colWidths.end + 1, rowY);

        yPosition += neededHeight;
      });

      yPosition += 6;
    }

    // Add footer with timestamp
    const timestamp = new Date().toLocaleString();
    doc.setFontSize(8);
    doc.setFont(undefined, 'italic');
    doc.text(`Generated on: ${timestamp}`, margin, pageHeight - 10);

    // Save the PDF
    const vesselName = analysisData.vessel_info?.vessel_name || 'Maritime';
    doc.save(`${vesselName}_Analysis_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const stats = calculateStatistics();
  const analysisData = analysis || {};

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
          <svg className="h-7 w-7 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Time Breakdown Analysis
          <span className="ml-4 text-base bg-blue-600 text-white px-4 py-2 rounded-full">
            Work Hours Based
          </span>
        </h3>
        <button
          onClick={exportToPDF}
          className="inline-flex items-center px-4 py-2 border border-blue-600 shadow-sm text-sm font-medium rounded-md text-blue-300 bg-blue-900 hover:bg-blue-800 transition-colors"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PDF
        </button>
      </div>

      {/* Enhanced Time-Based Efficiency Notice */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-800 rounded-lg p-6 border border-blue-600">
        <div className="flex items-start space-x-4">
          <svg className="h-7 w-7 text-blue-300 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-white font-medium mb-2 text-lg">Time-Based Efficiency Calculation</h4>
            <p className="text-blue-100 text-base leading-relaxed">
              Parallel activities (like surveys and cargo handling) were handled by taking the maximum duration for each time slot. This reflects the actual time constraints of the operation.
            </p>
            {analysisData.efficiency_analysis?.calculation_method && (
              <p className="text-blue-200 text-sm mt-3 italic">
                Method: {analysisData.efficiency_analysis.calculation_method}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Vessel Information */}
      {analysisData.vessel_info && (
        <div className="bg-gray-700 rounded-lg p-6">
          <h4 className="text-xl font-medium text-white mb-4">Vessel Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
            <div>
              <span className="text-gray-400">Vessel:</span>
              <span className="text-white ml-3">{analysisData.vessel_info.vessel_name}</span>
            </div>
            <div>
              <span className="text-gray-400">Loading Port:</span>
              <span className="text-white ml-3">{analysisData.vessel_info.loading_port}</span>
            </div>
            <div>
              <span className="text-gray-400">Cargo:</span>
              <span className="text-white ml-3">{analysisData.vessel_info.cargo}</span>
            </div>
            <div>
              <span className="text-gray-400">Owner:</span>
              <span className="text-white ml-3">{analysisData.vessel_info.owner}</span>
            </div>
            <div>
              <span className="text-gray-400">Charterer:</span>
              <span className="text-white ml-3">{analysisData.vessel_info.charterer}</span>
            </div>
            <div>
              <span className="text-gray-400">CP Date:</span>
              <span className="text-white ml-3">{analysisData.vessel_info.charter_party_date}</span>
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
      {(analysisData.time_breakdown || stats) && (
        <div className="bg-gray-700 rounded-lg p-6">
          <h4 className="text-xl font-medium text-white mb-5">Time Breakdown Analysis</h4>
          {analysisData.time_breakdown?.parallel_work_note && (
            <div className="mb-4 text-sm text-blue-300 bg-blue-900 bg-opacity-50 p-3 rounded">
              {analysisData.time_breakdown.parallel_work_note}
            </div>
          )}
          <div className="space-y-4">
            {/* Time breakdown without bars - text only */}
            <div className="flex justify-between items-center py-3 border-b border-gray-600">
              <span className="text-green-400 text-lg font-medium">Productive Time</span>
              <span className="text-white text-lg font-bold">
                {analysisData.time_breakdown?.productive_time ? convertToHours(analysisData.time_breakdown.productive_time) : (stats ? `${stats.productiveTime.toFixed(2)} hours` : '0.00 hours')}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-600">
              <span className="text-blue-400 text-lg font-medium">Weather Delays</span>
              <span className="text-white text-lg font-bold">
                {analysisData.time_breakdown?.weather_delays ? convertToHours(analysisData.time_breakdown.weather_delays) : (stats ? `${stats.weatherDelays.toFixed(2)} hours` : '0.00 hours')}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-600">
              <span className="text-purple-400 text-lg font-medium">Weekend Time</span>
              <span className="text-white text-lg font-bold">
                {analysisData.time_breakdown?.weekend_time ? convertToHours(analysisData.time_breakdown.weekend_time) : (stats ? `${stats.weekendTime.toFixed(2)} hours` : '0.00 hours')}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-600">
              <span className="text-red-400 text-lg font-medium">Equipment Breakdown</span>
              <span className="text-white text-lg font-bold">
                {(analysisData.time_breakdown?.equipment_breakdown || analysisData.time_breakdown?.breakdown_time) ? 
                  convertToHours(analysisData.time_breakdown.equipment_breakdown || analysisData.time_breakdown.breakdown_time) : 
                  (stats ? `${stats.breakdownTime.toFixed(2)} hours` : '0.00 hours')}
              </span>
            </div>

            {/* Other delays if provided by Gemini */}
            {analysisData.time_breakdown?.other_delays && (
              <div className="flex justify-between items-center py-3 border-b border-gray-600">
                <span className="text-orange-400 text-lg font-medium">Other Delays</span>
                <span className="text-white text-lg font-bold">
                  {convertToHours(analysisData.time_breakdown.other_delays)}
                </span>
              </div>
            )}
          </div>

          {/* Efficiency Metrics */}
          <div className="mt-6 pt-6 border-t border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-lg">Overall Efficiency:</span>
                  <span className={`font-bold text-xl ${getEfficiencyColor(analysisData.efficiency_analysis?.overall_efficiency || (stats ? stats.efficiency : 0))}`}>
                    {formatEfficiency(analysisData.efficiency_analysis?.overall_efficiency) || (stats ? `${stats.efficiency.toFixed(1)}%` : 'N/A')}
                  </span>
                </div>
                
                {/* Time-based efficiency from Gemini */}
                {analysisData.efficiency_analysis?.time_based_efficiency && (
                  <div className="flex justify-between items-center">
                    <span className="text-blue-400 text-lg">Time-Based Efficiency:</span>
                    <span className="text-white font-bold text-xl">
                      {formatEfficiency(analysisData.efficiency_analysis.time_based_efficiency)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-lg">Total Operation Time:</span>
                  <span className="text-white text-xl font-bold">
                    {analysisData.time_breakdown?.total_operation_time ? convertToHours(analysisData.time_breakdown.total_operation_time) : (stats ? `${stats.totalDuration.toFixed(2)} hours` : 'N/A')}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Show analysis info */}
                <div className="text-sm text-gray-400 mt-4 space-y-2">
                  <div>📊 Analysis based on Gemini AI intelligence</div>
                  <div>🔄 Parallel operations considered</div>
                  <div>📋 All events preserved for accuracy</div>
                </div>
              </div>
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

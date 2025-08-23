// Enhanced PortVisualization.jsx
'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

// SVG Components for different states
const Crane = () => (
  <div className="crane-animation">
    <svg viewBox="0 0 100 100" className="crane-svg">
      <line x1="20" y1="90" x2="20" y2="10" stroke="#a0aec0" strokeWidth="2" />
      <line x1="20" y1="10" x2="70" y2="10" stroke="#a0aec0" strokeWidth="2" />
      <line x1="60" y1="10" x2="60" y2="40" stroke="#a0aec0" strokeWidth="1" className="crane-hook" />
      <rect x="55" y="40" width="10" height="10" fill="#a0aec0" />
    </svg>
  </div>
);

const Rain = () => (
  <div className="rain-animation">
    {[...Array(20)].map((_, i) => (
      <div key={i} className="raindrop" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s` }}></div>
    ))}
  </div>
);

const Breakdown = () => (
  <div className="status-indicator breakdown-indicator">
    <svg fill="#f56565" viewBox="0 0 20 20">
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 010 2 1 1 0 010-2z" />
    </svg>
  </div>
);

const Survey = () => (
  <div className="survey-indicator">
    <div className="barrier-post" style={{ left: '20%' }}></div>
    <div className="barrier-post" style={{ left: '80%' }}></div>
    <div className="barrier-tape"></div>
    <div className="status-indicator">
      <svg fill="#ecc94b" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H16a1 1 0 110 2h-1.85l-1 4H15a1 1 0 110 2h-2.15l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H4a1 1 0 110-2h1.85l1-4H5a1 1 0 110-2h2.15l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.94l1-4H9.03z" clipRule="evenodd" />
      </svg>
    </div>
  </div>
);

const StopSign = () => (
  <div className="status-indicator">
    <svg fill="#dc2626" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
  </div>
);

const MealTime = () => (
  <div className="status-indicator">
    <svg fill="#f59e0b" viewBox="0 0 20 20">
      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
    </svg>
  </div>
);

const Departed = () => (
  <div className="status-indicator">
    <svg fill="#10b981" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  </div>
);

const Completed = () => (
  <div className="status-indicator">
    <svg fill="#10b981" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  </div>
);

const Inspection = () => (
  <div className="status-indicator">
    <svg fill="#8b5cf6" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" strokeWidth="2" stroke="currentColor" />
    </svg>
  </div>
);
const PortVisualization = ({ events, analysis }) => {
  const [currentTime, setCurrentTime] = useState(null);
  const [activeEvents, setActiveEvents] = useState([]);
  const [tooltipBelow, setTooltipBelow] = useState(false);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);

  // Keyword mapping for richer status detection & display
  const statusPriority = [
    'Breakdown',
    'Rain Delay',
    'Meal Break',
    'Working',
    'Inspection',
    'Survey',
    'Stopped',
    'Completed',
    'Departed',
    'Idle'
  ];

  const detectStatusFromEvents = useCallback((currentActive) => {
    if (!currentActive.length) return 'Idle';
    const text = currentActive.map(e => (e.event || '').toLowerCase()).join(' ');
    if (/breakdown|mechanical|engine/.test(text)) return 'Breakdown';
    if (/rain|weather|storm/.test(text)) return 'Rain Delay';
    if (/meal|lunch|breakfast|dinner|tea/.test(text)) return 'Meal Break';
    if (/work|loading|discharge|unload|cargo/.test(text)) return 'Working';
    if (/inspection|formalities|custom|immigration/.test(text)) return 'Inspection';
    if (/survey/.test(text)) return 'Survey';
    if (/stop|stoppage|waiting|idle|delay/.test(text)) return 'Stopped';
    if (/completed|complete|finished|done/.test(text)) return 'Completed';
    if (/departed|sailing|sailed|etd/.test(text)) return 'Departed';
    return 'Idle';
  }, []);

  const { timeRange, workDurations } = useMemo(() => {
    if (!events || events.length === 0) {
      return { timeRange: { min: 0, max: 0 }, workDurations: { total: 0 } };
    }
    const startTimes = events.map(e => new Date(e.startTime).getTime()).filter(t => !isNaN(t));
    const endTimes = events.map(e => new Date(e.endTime || e.startTime).getTime()).filter(t => !isNaN(t));
    const minTime = Math.min(...startTimes);
    const maxTime = Math.max(...endTimes);

    // Aggregate total work-related durations
    const workRelated = events.filter(e => /work|loading|discharge|cargo|unload/i.test(e.event || ''));
    let total = 0;
    const segments = workRelated.map(e => {
      const s = new Date(e.startTime).getTime();
      const eTime = new Date(e.endTime || e.startTime).getTime();
      const dur = Math.max(0, eTime - s);
      total += dur;
      return { start: s, end: eTime };
    });
    return {
      timeRange: { min: minTime, max: maxTime },
      workDurations: { total, segments }
    };
  }, [events]);

  useEffect(() => {
    if (timeRange.min) {
      setCurrentTime(timeRange.min);
    }
  }, [timeRange.min]);
  
  const { status, workDonePercentage } = useMemo(() => {
    if (!currentTime || !events.length) return { status: { type: 'Idle' }, workDonePercentage: 0 };

    const currentActive = events.filter(event => {
      const startTime = new Date(event.startTime).getTime();
      const endTime = event.endTime ? new Date(event.endTime).getTime() : startTime + 3600 * 1000;
      return currentTime >= startTime && currentTime < endTime;
    });
    setActiveEvents(currentActive);

    // Work done percentage based on elapsed work durations
    let completed = 0;
    workDurations.segments?.forEach(seg => {
      if (currentTime >= seg.end) {
        completed += (seg.end - seg.start);
      } else if (currentTime > seg.start && currentTime < seg.end) {
        completed += (currentTime - seg.start);
      }
    });
    const percentage = workDurations.total > 0 ? (completed / workDurations.total) * 100 : 0;

    const statusType = detectStatusFromEvents(currentActive);
    return { status: { type: statusType }, workDonePercentage: percentage };
  }, [currentTime, events, workDurations, detectStatusFromEvents]);

  const handleSliderChange = (e) => {
    setCurrentTime(parseInt(e.target.value, 10));
  };

  const vesselName = analysis?.vessel_info?.vessel_name || "Vessel";

  // Tooltip positioning logic (flip if clipped)
  const handleMouseEnter = () => {
    if (!containerRef.current || !tooltipRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    // If top of tooltip would go above container top -> place below
    if (tooltipRect.top < containerRect.top) {
      setTooltipBelow(true);
    } else {
      setTooltipBelow(false);
    }
  };

  const handleMouseLeave = () => {
    setTooltipBelow(false); // reset
  };

  if (!events || events.length === 0) {
    return null;
  }

  return (
  <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 space-y-6">
      <h3 className="text-2xl font-semibold text-white flex items-center">
        <svg className="h-7 w-7 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Port Operations Timeline
      </h3>
      
  <div className="port-scene-container" ref={containerRef}>
        {status.type === 'Rain Delay' && <Rain />}
        <div className="port-scene">
          {/* Water with waves animation */}
          <div className="water">
            <div className="wave wave1"></div>
            <div className="wave wave2"></div>
            <div className="wave wave3"></div>
          </div>
          
          {/* Enhanced dock structure */}
          <div className="dock">
            <div className="dock-surface"></div>
            <div className="bollard bollard-1"></div>
            <div className="bollard bollard-2"></div>
            <div className="pier-light pier-light-1"></div>
            <div className="pier-light pier-light-2"></div>
          </div>
          
          <div className="ship-container" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {/* Enhanced ship design */}
            <div className="ship">
              <svg viewBox="0 0 220 80" className="ship-svg">
                {/* Ship hull */}
                <path d="M15 45 C 25 25, 195 25, 205 45 L 210 65 L 10 65 Z" fill="#4a5568" stroke="#2d3748" strokeWidth="2"/>
                {/* Ship deck structures */}
                <rect x="50" y="20" width="90" height="20" fill="#718096" stroke="#2d3748" strokeWidth="1"/>
                <rect x="150" y="25" width="25" height="15" fill="#718096" stroke="#2d3748" strokeWidth="1"/>
                {/* Ship bridge */}
                <rect x="160" y="15" width="20" height="10" fill="#a0aec0" stroke="#2d3748" strokeWidth="1"/>
                {/* Mast */}
                <line x1="110" y1="20" x2="110" y2="5" stroke="#a0aec0" strokeWidth="2"/>
                {/* Cargo holds */}
                <rect x="60" y="30" width="15" height="10" fill="#2d3748"/>
                <rect x="85" y="30" width="15" height="10" fill="#2d3748"/>
                <rect x="110" y="30" width="15" height="10" fill="#2d3748"/>
              </svg>
            </div>
            
            {/* Status indicators */}
            {status.type === 'Working' && <Crane />}
            {status.type === 'Breakdown' && <Breakdown />}
            {status.type === 'Survey' && <Survey />}
            {status.type === 'Meal Break' && <MealTime />}
            {status.type === 'Stopped' && <StopSign />}
            {status.type === 'Inspection' && <Inspection />}
            {status.type === 'Departed' && <Departed />}
            {status.type === 'Completed' && <Completed />}

            {/* Enhanced tooltip */}
            <div className={`ship-tooltip ${tooltipBelow ? 'below' : ''}`} ref={tooltipRef}>
              <div className="tooltip-header">
                <h4 className="font-bold text-lg mb-1 text-blue-300">{vesselName}</h4>
                <div className={`status-badge ${
                  status.type === 'Working' ? 'status-working' :
                  status.type.includes('Delay') || status.type.includes('Breakdown') ? 'status-delayed' :
                  'status-idle'
                }`}>
                  {status.type}
                </div>
              </div>
              
              <div className="tooltip-content">
                <div className="progress-section">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">Work Progress:</span>
                    <span className="font-bold text-white">{workDonePercentage.toFixed(0)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${workDonePercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="status-section">
                  {status.type.includes('Delay') || status.type.includes('Breakdown') ? (
                    <div className="flex items-center text-red-400 text-sm">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Operation Delayed
                    </div>
                  ) : status.type === 'Working' ? (
                    <div className="flex items-center text-green-400 text-sm">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Operations Active
                    </div>
                  ) : status.type === 'Meal Break' ? (
                    <div className="flex items-center text-amber-400 text-sm">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                      Meal / Crew Break
                    </div>
                  ) : status.type === 'Inspection' ? (
                    <div className="flex items-center text-violet-400 text-sm">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                      </svg>
                      Inspection / Formalities
                    </div>
                  ) : status.type === 'Stopped' ? (
                    <div className="flex items-center text-yellow-400 text-sm">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                      Temporarily Stopped
                    </div>
                  ) : status.type === 'Completed' ? (
                    <div className="flex items-center text-green-300 text-sm">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Operation Completed
                    </div>
                  ) : status.type === 'Departed' ? (
                    <div className="flex items-center text-emerald-400 text-sm">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Vessel Departed
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400 text-sm">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Standby
                    </div>
                  )}
                </div>

                <div className="events-section">
                  <h5 className="font-semibold text-sm text-white mb-2 flex items-center">
                    <svg className="h-4 w-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Current Events:
                  </h5>
                  <div className="events-list">
                    {activeEvents.length > 0 ? activeEvents.map((event, index) => (
                      <div key={index} className="event-item">
                        <div className="event-bullet"></div>
                        <div className="event-details">
                          <span className="event-name">{event.event}</span>
                          {event.duration && (
                            <span className="event-duration">({event.duration})</span>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="no-events">
                        <span className="text-gray-400">No active events</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="timeline-controls">
        <div className="timeline-header">
          <h4 className="text-lg font-medium text-white flex items-center">
            <svg className="h-5 w-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Operations Timeline
          </h4>
          <div className="timeline-instructions">
            <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-400 ml-2">
              Drag the slider to navigate through time • Hover over the ship for detailed information
            </span>
          </div>
        </div>
        
        <div className="timeline-slider-container">
          <input
            id="timeline-slider"
            type="range"
            min={timeRange.min}
            max={timeRange.max}
            value={currentTime || timeRange.min}
            onChange={handleSliderChange}
            className="enhanced-timeline-slider"
          />
          <div className="timeline-labels">
            <span className="timeline-start">
              {new Date(timeRange.min).toLocaleDateString()}
            </span>
            <span className="timeline-end">
              {new Date(timeRange.max).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <div className="current-time-display">
          <div className="time-card">
            <div className="time-label">Current Time</div>
            <div className="time-value">
              {currentTime ? new Date(currentTime).toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }) : 'Loading...'}
            </div>
          </div>
          
          <div className="status-card">
            <div className="status-label">Operation Status</div>
            <div className={`status-value ${
              status.type === 'Working' ? 'text-green-400' :
              status.type.includes('Delay') || status.type.includes('Breakdown') ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {status.type}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .port-scene-container {
          position: relative;
          width: 100%;
          height: 340px;
          background: linear-gradient(to bottom, #1e3a8a 0%, #1e40af 30%, #1d4ed8 70%, #2563eb 100%);
            border-radius: 0.75rem;
          /* Allow tooltip overflow */
          overflow: visible;
          border: 2px solid #4a5568;
          box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.3);
          padding-top: 10px; /* extra headroom */
        }

        .port-scene {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .water {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(to bottom, #1e40af, #1e3a8a);
          overflow: hidden;
        }

        .wave {
          position: absolute;
          bottom: 0;
          width: 200%;
          height: 20px;
          opacity: 0.3;
        }

        .wave1 {
          background: linear-gradient(90deg, transparent, #60a5fa, transparent);
          animation: wave-animation 3s infinite linear;
        }

        .wave2 {
          background: linear-gradient(90deg, transparent, #3b82f6, transparent);
          animation: wave-animation 4s infinite linear reverse;
        }

        .wave3 {
          background: linear-gradient(90deg, transparent, #2563eb, transparent);
          animation: wave-animation 5s infinite linear;
        }

        @keyframes wave-animation {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }

        .dock {
          position: absolute;
          bottom: 80px;
          left: 0;
          right: 0;
          height: 80px;
        }

        .dock-surface {
          width: 100%;
          height: 60px;
          background: linear-gradient(to bottom, #4a5568, #2d3748);
          border-top: 4px solid #718096;
          position: relative;
        }

        .dock-surface::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 8px;
          background: repeating-linear-gradient(
            90deg,
            #718096 0px,
            #718096 20px,
            #2d3748 20px,
            #2d3748 24px
          );
        }

        .bollard {
          position: absolute;
          bottom: 50px;
          width: 16px;
          height: 24px;
          background: linear-gradient(to bottom, #a0aec0, #718096);
          border-radius: 4px 4px 0 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .bollard-1 {
          left: 20%;
        }

        .bollard-2 {
          right: 20%;
        }

        .pier-light {
          position: absolute;
          bottom: 60px;
          width: 8px;
          height: 40px;
          background: linear-gradient(to bottom, #fbbf24, #f59e0b);
        }

        .pier-light::after {
          content: '';
          position: absolute;
          top: -6px;
          left: -4px;
          width: 16px;
          height: 8px;
          background: #fbbf24;
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
        }

        .pier-light-1 {
          left: 15%;
        }

        .pier-light-2 {
          right: 15%;
        }

        .ship-container {
          position: absolute;
          bottom: 120px;
          left: 50%;
          transform: translateX(-50%);
          width: 220px;
          height: 80px;
        }

        .ship-svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        }

        .ship-container:hover .ship-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translate(-50%, -15px);
        }

        .ship-tooltip {
          opacity: 0;
          visibility: hidden;
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translate(-50%, 0);
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95));
          backdrop-filter: blur(10px);
          color: white;
          padding: 1rem;
          border-radius: 0.75rem;
          min-width: 280px;
          max-width: 340px;
          z-index: 100; /* ensure above rain */
          border: 1px solid rgba(148, 163, 184, 0.25);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
          transition: all 0.25s ease;
          pointer-events: none; /* avoids flicker */
        }
        .ship-tooltip.below {
          bottom: auto;
          top: 100%;
          transform: translate(-50%, 10px);
        }

        .tooltip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-working {
          background-color: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .status-delayed {
          background-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .status-idle {
          background-color: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
          border: 1px solid rgba(156, 163, 175, 0.3);
        }

        .progress-section {
          margin-bottom: 0.75rem;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: rgba(55, 65, 81, 0.5);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #06b6d4);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .status-section {
          margin-bottom: 0.75rem;
          padding: 0.5rem;
          background-color: rgba(55, 65, 81, 0.3);
          border-radius: 0.5rem;
        }

        .events-section {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(148, 163, 184, 0.2);
        }

        .events-list {
          max-height: 120px;
          overflow-y: auto;
        }

        .event-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 0.5rem;
          padding: 0.25rem;
        }

        .event-bullet {
          width: 6px;
          height: 6px;
          background-color: #3b82f6;
          border-radius: 50%;
          margin-right: 0.5rem;
          margin-top: 0.25rem;
          flex-shrink: 0;
        }

        .event-name {
          font-size: 0.875rem;
          line-height: 1.25rem;
        }

        .event-duration {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-left: 0.5rem;
        }

        .no-events {
          text-align: center;
          padding: 1rem;
          font-style: italic;
        }

        .timeline-controls {
          background: linear-gradient(135deg, rgba(55, 65, 81, 0.8), rgba(75, 85, 99, 0.8));
          border-radius: 0.75rem;
          padding: 1.5rem;
          border: 1px solid #4b5563;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .timeline-instructions {
          display: flex;
          align-items: center;
          background-color: rgba(55, 65, 81, 0.5);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
        }

        .timeline-slider-container {
          margin-bottom: 1.5rem;
          position: relative;
        }

        .enhanced-timeline-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 16px;
          background: linear-gradient(to right, #1e40af, #3b82f6, #06b6d4);
          outline: none;
          border-radius: 8px;
          transition: opacity 0.2s;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .enhanced-timeline-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #3b82f6, #1e40af);
          cursor: pointer;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }

        .enhanced-timeline-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
        }

        .enhanced-timeline-slider::-moz-range-thumb {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #3b82f6, #1e40af);
          cursor: pointer;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .timeline-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .current-time-display {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .current-time-display {
            grid-template-columns: 1fr;
          }
        }

        .time-card, .status-card {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.8));
          padding: 1rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .time-label, .status-label {
          font-size: 0.75rem;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .time-value, .status-value {
          font-size: 1.125rem;
          font-weight: 600;
          color: white;
        }

        /* Animation styles */
        .crane-animation {
          position: absolute;
          left: -30px;
          bottom: 20px;
          width: 120px;
          height: 120px;
          z-index: 20;
        }

        .crane-svg {
          width: 100%;
          height: 100%;
        }

        .crane-hook {
          animation: crane-lift 4s infinite ease-in-out;
        }

        @keyframes crane-lift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(25px); }
        }

        .rain-animation {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 25;
          pointer-events: none;
        }

        .raindrop {
          position: absolute;
          bottom: 100%;
          width: 2px;
          height: 30px;
          background: linear-gradient(to bottom, rgba(160, 174, 192, 0), rgba(160, 174, 192, 0.8));
          animation: rain-fall 1.5s linear infinite;
        }

        @keyframes rain-fall {
          to { transform: translateY(400px); }
        }

        .status-indicator {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 40px;
          z-index: 15;
        }

        .breakdown-indicator {
          animation: pulse-warning 2s infinite;
        }

        @keyframes pulse-warning {
          0%, 100% { 
            transform: scale(1) translateX(-50%); 
            opacity: 1; 
          }
          50% { 
            transform: scale(1.3) translateX(-50%); 
            opacity: 0.6; 
          }
        }

        .survey-indicator {
          position: absolute;
          bottom: -15px;
          left: -40px;
          right: -40px;
          height: 30px;
          z-index: 10;
        }

        .barrier-post {
          position: absolute;
          bottom: 0;
          width: 8px;
          height: 25px;
          background: linear-gradient(to bottom, #fbbf24, #f59e0b);
          border-radius: 2px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .barrier-tape {
          position: absolute;
          bottom: 15px;
          left: 20%;
          right: 20%;
          height: 6px;
          background-image: repeating-linear-gradient(
            -45deg,
            #fbbf24,
            #fbbf24 8px,
            #dc2626 8px,
            #dc2626 16px
          );
          animation: tape-flash 1.5s infinite;
        }

        @keyframes tape-flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        /* Responsive design */
        @media (max-width: 640px) {
          .port-scene-container {
            height: 250px;
          }
          
          .ship-tooltip {
            min-width: 240px;
            font-size: 0.875rem;
          }
          
          .timeline-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .timeline-instructions {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default PortVisualization;
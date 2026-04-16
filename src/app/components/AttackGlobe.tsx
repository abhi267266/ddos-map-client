'use client';

import React, { useState, useEffect } from 'react';
import { GlobeScene, AttackData } from './GlobeScene';

export default function AttackGlobe() {
  const [attacks, setAttacks] = useState<AttackData[]>([]);
  const [totalDetected, setTotalDetected] = useState(0);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'ws://localhost:8080/ws';
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newAttack: AttackData = {
          id: data.timestamp + '-' + data.source_ip,
          sourceLatLng: [parseFloat(data.source_lat), parseFloat(data.source_lon)],
          targetLatLng: [parseFloat(data.target_lat), parseFloat(data.target_lon)],
          sourceIp: data.source_ip,
          countryCode: data.country_code,
          timestamp: data.timestamp
        };
        
        setAttacks(current => {
          const updated = [newAttack, ...current];
          return updated.slice(0, 100);
        });
        setTotalDetected(prev => prev + 1);
      } catch (err) {
        console.error("Error parsing websocket message", err);
      }
    };

    return () => ws.close();
  }, []);

  const recentAttacks = attacks.slice(0, 8); // Show latest 8

  return (
    <div className="attack-globe-container">
      {/* 3D Canvas Background */}
      <div className="canvas-container">
        <GlobeScene attacks={attacks} />
      </div>

      {/* Cyberpunk UI Overlay */}
      <div className="dashboard-ui">
        
        {/* Top Stats Row */}
        <div className="stats-header">
          <div className="stat-box volumetric">
            <span className="stat-label">Total Detected</span>
            <span className="stat-value">{totalDetected}</span>
          </div>
          <div className="stat-box volumetric">
            <span className="stat-label">Active on Map</span>
            <span className="stat-value">{attacks.length}</span>
          </div>
        </div>

        {/* Live Feed Sidebar */}
        <div className="live-feed-sidebar">
          <div className="feed-header">
            <span>Live Threat Feed</span>
            <div className="blinking-dot"></div>
          </div>
          
          {recentAttacks.map((attack) => (
            <div key={attack.id} className="attack-item">
              <div className="attack-meta">
                <span className="attack-type-badge volumetric">
                  {attack.countryCode}
                </span>
                <span className="attack-time">{new Date(attack.timestamp).toLocaleTimeString()}</span>
              </div>
              
              <div className="attack-route">
                <span className="source">{attack.sourceIp}</span>
                <span className="route-arrow">--&gt;</span>
                <span className="target">Server Layer</span>
              </div>

              <div className="intensity-bar-container">
                <div 
                  className="intensity-bar volumetric" 
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

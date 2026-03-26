import React from 'react';
import { PieChart } from 'lucide-react';

function BranchReports() {
  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', width: '100%', overflowY: 'auto' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
        <PieChart size={28} color="#8b5cf6" /> Master Branch Analytics
      </h1>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <p style={{ color: '#64748b' }}>Global network reporting data will be displayed here.</p>
        {/* Paste whatever API fetching / charting logic you had for the master reports here */}
      </div>
    </div>
  );
}
export default BranchReports;
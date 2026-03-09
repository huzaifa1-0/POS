import React from 'react';
import { FileText } from 'lucide-react';

const Expenses = () => {
  return (
    <div style={{ flex: 1, padding: '30px', background: '#f8fafc', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <FileText size={28} color="#f59e0b" />
        <h2 style={{ margin: 0, color: '#1e293b' }}>Shop Expenses</h2>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <p style={{ color: '#64748b' }}>Track your daily utility bills, staff payments, and miscellaneous costs here.</p>
      </div>
    </div>
  );
};
export default Expenses;
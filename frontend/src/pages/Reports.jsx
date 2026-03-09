import React from 'react';
import { BarChart2, Banknote, CreditCard } from 'lucide-react';

const Reports = ({ dailyIncome, cashIncome, onlineIncome, completedOrders }) => {
  return (
    <div style={{ flex: 1, padding: '30px', background: '#f8fafc', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <BarChart2 size={28} color="#4f46e5" />
        <h2 style={{ margin: 0, color: '#1e293b' }}>Sales Reports</h2>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #10b981' }}>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold' }}>Total Income</p>
          <h3 style={{ margin: '10px 0 0 0', fontSize: '24px' }}>PKR {dailyIncome.toFixed(0)}</h3>
        </div>
        <div style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #22c55e' }}>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'5px' }}><Banknote size={16}/> Cash</p>
          <h3 style={{ margin: '10px 0 0 0', fontSize: '20px' }}>PKR {cashIncome.toFixed(0)}</h3>
        </div>
        <div style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #3b82f6' }}>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'5px' }}><CreditCard size={16}/> Online</p>
          <h3 style={{ margin: '10px 0 0 0', fontSize: '20px' }}>PKR {onlineIncome.toFixed(0)}</h3>
        </div>
      </div>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
         <h4 style={{ marginTop: 0 }}>Recent Completed Orders ({completedOrders.length})</h4>
         {/* You can map over completedOrders here later */}
         <p style={{ color: '#888', fontStyle: 'italic' }}>Order history table will appear here.</p>
      </div>
    </div>
  );
};
export default Reports;
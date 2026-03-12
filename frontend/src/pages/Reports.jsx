import React, { useState } from 'react';
import { BarChart2, Banknote, CreditCard, Download, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';

const Reports = ({ dailyIncome, cashIncome, onlineIncome, completedOrders }) => {
  // We will hook these up to real backend filters later
  const [dateRange, setDateRange] = useState('today'); 

  // --- CSV EXPORT LOGIC ---
  const handleExportCSV = () => {
    if (!completedOrders || completedOrders.length === 0) {
      alert("No data available to export.");
      return;
    }

    // 1. Create CSV Headers
    let csvContent = "Order ID,Order Type,Status,Total Amount (PKR),Date\n";

    // 2. Loop through orders and format them as CSV rows
    completedOrders.forEach(order => {
      // Wrap strings in quotes to avoid issues with commas in data
      const date = new Date(order.created_at || Date.now()).toLocaleDateString();
      const row = `"${order.id}","${order.order_type}","${order.status}","${order.total_amount}","${date}"`;
      csvContent += row + "\n";
    });

    // 3. Create a Blob (a file-like object of immutable, raw data)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // 4. Create a hidden link, click it to download, and remove it
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Sales_Report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ flex: 1, padding: '30px', background: '#f8fafc', overflowY: 'auto' }}>
      
      {/* HEADER & CSV BUTTON */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart2 size={28} color="#4f46e5" />
          <h2 style={{ margin: 0, color: '#1e293b' }}>Analytics & Reports</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Time Filter Dropdown */}
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          {/* Export CSV Button */}
          <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '200px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold' }}>Total Income</p>
          <h3 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#1e293b' }}>PKR {dailyIncome?.toFixed(0) || 0}</h3>
        </div>
        <div style={{ flex: '1', minWidth: '200px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #22c55e', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'5px' }}><Banknote size={16}/> Cash Sales</p>
          <h3 style={{ margin: '10px 0 0 0', fontSize: '20px', color: '#1e293b' }}>PKR {cashIncome?.toFixed(0) || 0}</h3>
        </div>
        <div style={{ flex: '1', minWidth: '200px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'5px' }}><CreditCard size={16}/> Online Sales</p>
          <h3 style={{ margin: '10px 0 0 0', fontSize: '20px', color: '#1e293b' }}>PKR {onlineIncome?.toFixed(0) || 0}</h3>
        </div>
      </div>

      {/* MIDDLE SECTION: Split into Top Selling and Low Stock */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        
        {/* TOP SELLING ITEMS */}
        <div style={{ flex: 2, minWidth: '300px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
            <TrendingUp size={20}/> Top Selling Items
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>Backend integration required to calculate highest selling quantities.</p>
          {/* We will map top items here once the backend aggregates them */}
        </div>

        {/* LOW STOCK ALERTS */}
        <div style={{ flex: 1, minWidth: '250px', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
            <AlertTriangle size={20}/> Low Stock Alerts
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>Will show inventory items dropping below minimum threshold.</p>
        </div>
      </div>
      
      {/* BOTTOM SECTION: Sales Table */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
         <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
           <Calendar size={20}/> Order History ({completedOrders?.length || 0})
         </h3>
         
         <div className="table-responsive-wrapper" style={{ maxHeight: '300px', overflowY: 'auto' }}>
           <table className="custom-data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
             <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>
               <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                 <th style={{ padding: '10px' }}>Order ID</th>
                 <th style={{ padding: '10px' }}>Type</th>
                 <th style={{ padding: '10px' }}>Status</th>
                 <th style={{ padding: '10px' }}>Amount</th>
               </tr>
             </thead>
             <tbody>
               {completedOrders && completedOrders.length > 0 ? (
                 completedOrders.map((order, idx) => (
                   <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                     <td style={{ padding: '10px', color: '#64748b' }}>#{order.id}</td>
                     <td style={{ padding: '10px', fontWeight: '500' }}>{order.order_type}</td>
                     <td style={{ padding: '10px' }}>
                       <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                         {order.status}
                       </span>
                     </td>
                     <td style={{ padding: '10px', fontWeight: 'bold', color: '#334155' }}>PKR {order.total_amount}</td>
                   </tr>
                 ))
               ) : (
                 <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No sales data yet.</td></tr>
               )}
             </tbody>
           </table>
         </div>
      </div>

    </div>
  );
};

export default Reports;
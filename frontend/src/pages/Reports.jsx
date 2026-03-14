import React, { useState, useEffect } from 'react';
import { BarChart2, Banknote, CreditCard, Download, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const Reports = () => {
  const [dateRange, setDateRange] = useState('all'); 
  
  // NEW: Added cogs and net_profit to the state
  const [data, setData] = useState({
    total_income: 0, cogs: 0, net_profit: 0, cash_income: 0, online_income: 0, top_items: [], low_stock: [], recent_orders: []
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/reports/dashboard/?range=${dateRange}`);
      setData(res.data);
    } catch (error) {
      console.error("Error fetching report data:", error);
    }
  };

  const handleExportCSV = () => {
    if (data.recent_orders.length === 0) {
      alert("No data available to export.");
      return;
    }

    let csvContent = "Order ID,Order Type,Payment Method,Total Amount (PKR),Date\n";

    data.recent_orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleString();
      csvContent += `"${order.id}","${order.order_type}","${order.payment_method}","${order.total_amount}","${date}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Nashta_Sales_Report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="reports-page-wrapper" style={{ flex: 1, padding: '30px', background: '#f8fafc', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart2 size={28} color="#4f46e5" />
          <h2 style={{ margin: 0, color: '#1e293b' }}>Analytics & Reports</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="month">This Month</option>
          </select>

          <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* NEW: UPGRADED PROFIT METRICS CARDS */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '200px', background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Total Revenue</p>
          <h3 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#1e293b' }}>PKR {data.total_income}</h3>
        </div>
        
        <div style={{ flex: '1', minWidth: '200px', background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #ef4444', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Cost of Goods (COGS)</p>
          <h3 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#1e293b' }}>PKR {data.cogs}</h3>
        </div>

        <div style={{ flex: '1', minWidth: '200px', background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Net Profit</p>
          <h3 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#1e293b' }}>PKR {data.net_profit}</h3>
        </div>

        <div style={{ flex: '1', minWidth: '200px', background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #8b5cf6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Profit Margin</p>
          <h3 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#1e293b' }}>
            {data.total_income > 0 ? ((data.net_profit / data.total_income) * 100).toFixed(1) : 0}%
          </h3>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: '300px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}><TrendingUp size={20}/> Top Selling Items</h3>
          {data.top_items.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.top_items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#334155' }}>{item.name}</span>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ color: '#64748b' }}>Sold: {item.total_sold}</span>
                    <strong style={{ color: '#10b981' }}>PKR {item.revenue}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (<p style={{ color: '#94a3b8' }}>No sales data yet.</p>)}
        </div>

        {/* NEW: UPDATED LOW STOCK MAPPING */}
        <div style={{ flex: 1, minWidth: '250px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}><AlertTriangle size={20}/> Raw Ingredients Alert</h3>
          {data.low_stock.length > 0 ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             {data.low_stock.map((item, idx) => (
               <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                 <span style={{ fontWeight: 'bold', color: '#991b1b' }}>{item.name}</span>
                 {/* Replaced stock_available with quantity_on_hand and unit */}
                 <strong style={{ color: '#dc2626' }}>{item.quantity_on_hand} {item.unit} left</strong>
               </div>
             ))}
           </div>
          ) : (<p style={{ color: '#16a34a', fontWeight: 'bold' }}>All stock levels look good! ✅</p>)}
        </div>
      </div>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
         <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}><Calendar size={20}/> Order History</h3>
         
         <div className="table-responsive-wrapper" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
           <table className="custom-data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
             <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>
               <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                 <th style={{ padding: '10px' }}>Order ID</th>
                 <th style={{ padding: '10px' }}>Date</th>
                 <th style={{ padding: '10px' }}>Type</th>
                 <th style={{ padding: '10px' }}>Method</th>
                 <th style={{ padding: '10px' }}>Amount</th>
               </tr>
             </thead>
             <tbody>
               {data.recent_orders.length > 0 ? (
                 data.recent_orders.map((order, idx) => (
                   <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                     <td style={{ padding: '10px', color: '#64748b' }}>#{order.id}</td>
                     <td style={{ padding: '10px', color: '#64748b' }}>{new Date(order.created_at).toLocaleString()}</td>
                     <td style={{ padding: '10px', fontWeight: '500' }}>{order.order_type}</td>
                     <td style={{ padding: '10px', color: '#0ea5e9' }}>{order.payment_method}</td>
                     <td style={{ padding: '10px', fontWeight: 'bold', color: '#334155' }}>PKR {order.total_amount}</td>
                   </tr>
                 ))
               ) : (
                 <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No sales data yet.</td></tr>
               )}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
};

export default Reports;
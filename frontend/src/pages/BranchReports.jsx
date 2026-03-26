import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, TrendingUp, DollarSign, MapPin, Building, CreditCard, Activity } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

function BranchReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMasterReports(); }, []);

  const fetchMasterReports = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/reports/master/`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` }
      });
      setReports(res.data);
    } catch (err) {
      console.error("Failed to load master reports", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Global Network Totals
  const networkRevenue = reports.reduce((sum, r) => sum + parseFloat(r.total_income || 0), 0);
  const networkExpenses = reports.reduce((sum, r) => sum + parseFloat(r.total_expenses || 0), 0);
  const networkProfit = networkRevenue - networkExpenses;

  return (
    <>
      <style>{`
        .full-width-wrapper { padding: 30px; width: 100%; box-sizing: border-box; }
        .desktop-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .profit-positive { color: #10b981; background: #d1fae5; }
        .profit-negative { color: #ef4444; background: #fee2e2; }
        
        @media (max-width: 768px) {
          .full-width-wrapper { padding: 15px; }
          .page-title { font-size: 22px !important; }
          .network-summary { grid-template-columns: 1fr !important; }
          .desktop-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="full-width-wrapper">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', marginBottom: '25px', fontSize: '28px' }}>
          <PieChart size={30} color="#8b5cf6" /> Master Network Analytics
        </h1>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', marginTop: '50px' }}>Aggregating real-time network data...</p>
        ) : (
          <>
            {/* --- GLOBAL NETWORK SUMMARY --- */}
            <div className="network-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '35px' }}>
              <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', padding: '25px', borderRadius: '12px', color: 'white', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>
                <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.9 }}>Total Network Revenue</p>
                <h2 style={{ margin: '10px 0 0 0', fontSize: '32px' }}>PKR {networkRevenue.toLocaleString()}</h2>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', padding: '25px', borderRadius: '12px', color: 'white', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)' }}>
                <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.9 }}>Total Network Expenses</p>
                <h2 style={{ margin: '10px 0 0 0', fontSize: '32px' }}>PKR {networkExpenses.toLocaleString()}</h2>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '25px', borderRadius: '12px', color: 'white', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' }}>
                <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.9 }}>Estimated Network Profit</p>
                <h2 style={{ margin: '10px 0 0 0', fontSize: '32px' }}>PKR {networkProfit.toLocaleString()}</h2>
              </div>
            </div>

            {/* --- INDIVIDUAL BRANCH CARDS --- */}
            <h2 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '15px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>Branch Performance Breakdown</h2>
            
            <div className="desktop-grid">
              {reports.map((branch) => {
                const profit = branch.total_income - branch.total_expenses;
                const isProfitable = profit >= 0;

                return (
                  <div key={branch.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    
                    <div style={{ background: '#f8fafc', padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building size={18} color="#3b82f6"/> {branch.name}
                      </h3>
                      <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12}/> {branch.address}
                      </p>
                    </div>

                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                        <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={16} color="#10b981"/> Revenue</span>
                        <strong style={{ color: '#0f172a' }}>PKR {branch.total_income.toLocaleString()}</strong>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '15px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '15px' }}>
                        <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={16} color="#ef4444"/> Expenses</span>
                        <strong style={{ color: '#ef4444' }}>- PKR {branch.total_expenses.toLocaleString()}</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px' }}>
                        <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Net Profit</span>
                        <span className={isProfitable ? 'profit-positive' : 'profit-negative'} style={{ padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                          PKR {profit.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Payment Split */}
                      <div style={{ marginTop: '20px', background: '#f1f5f9', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DollarSign size={14}/> Cash: {branch.cash_income}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={14}/> Online: {branch.online_income}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default BranchReports;
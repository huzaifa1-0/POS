import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, TrendingUp, DollarSign, Activity, Search, Building, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// 🚨 IMPORT YOUR BRAND NEW PROFILE COMPONENT!
import BranchProfile from './BranchProfile';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

function BranchReports() {
  const [reports, setReports] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Controls which branch is currently open in the new Popup
  const [selectedBranch, setSelectedBranch] = useState(null);

  useEffect(() => { fetchMasterData(); }, []);

  const getConfig = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } });

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const [reportsRes, staffRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/reports/master/`, getConfig()),
        axios.get(`${API_BASE_URL}/staff-list/`, getConfig())
      ]);
      setReports(reportsRes.data.branch_reports);
      setTrendData(reportsRes.data.network_trend);
      setAllStaff(staffRes.data.filter(u => u.role !== 'Admin')); 
    } catch (err) {
      console.error("Failed to load master reports data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.address.toLowerCase().includes(searchQuery.toLowerCase()));
  const networkRevenue = reports.reduce((sum, r) => sum + parseFloat(r.total_income || 0), 0);
  const networkExpenses = reports.reduce((sum, r) => sum + parseFloat(r.total_expenses || 0), 0);
  const networkProfit = networkRevenue - networkExpenses;

  return (
    <>
      <style>{`
        .full-width-wrapper { padding: 30px; width: 100%; box-sizing: border-box; }
        .profit-positive { color: #10b981; background: #dcfce3; padding: 4px 8px; border-radius: 6px; font-weight: bold; }
        .profit-negative { color: #ef4444; background: #fee2e2; padding: 4px 8px; border-radius: 6px; font-weight: bold; }
        
        /* 🚨 REVERTED TO BEAUTIFUL GRID CONTAINERS! */
        .branch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        
        .branch-card { 
          background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: all 0.2s ease; cursor: pointer;
        }
        .branch-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #cbd5e1; }

        @media (max-width: 768px) {
          .full-width-wrapper { padding: 15px; }
          .network-summary { grid-template-columns: 1fr !important; }
          .branch-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="full-width-wrapper">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', marginBottom: '25px', fontSize: '28px' }}>
          <PieChart size={30} color="#8b5cf6" /> Network Financial Reports
        </h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}><Activity className="animate-spin" size={30} style={{ margin: '0 auto 15px auto', color: '#3b82f6' }} /> Loading...</div>
        ) : (
          <>
            <div className="network-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', padding: '25px', borderRadius: '12px', color: 'white', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>
                <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={16}/> Total Revenue</p>
                <h2 style={{ margin: '10px 0 0 0', fontSize: '32px' }}>PKR {networkRevenue.toLocaleString()}</h2>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', padding: '25px', borderRadius: '12px', color: 'white', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)' }}>
                <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={16}/> Total Expenses</p>
                <h2 style={{ margin: '10px 0 0 0', fontSize: '32px' }}>PKR {networkExpenses.toLocaleString()}</h2>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '25px', borderRadius: '12px', color: 'white', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' }}>
                <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={16}/> Estimated Profit</p>
                <h2 style={{ margin: '10px 0 0 0', fontSize: '32px' }}>PKR {networkProfit.toLocaleString()}</h2>
              </div>
            </div>

            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '18px', margin: '0 0 20px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={20} color="#3b82f6"/> Network Revenue Timeline</h2>
              <div style={{ width: '100%', height: 320, minHeight: 320, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `Rs.${value >= 1000 ? (value/1000)+'k' : value}`} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(value) => [`PKR ${value.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <h2 style={{ fontSize: '20px', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><Building size={20} color="#64748b"/> Branch Directory</h2>
              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input type="text" placeholder="Search branches..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '11px 12px 11px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
              </div>
            </div>

            {/* 🚨 THE BEAUTIFUL GRID OF CONTAINERS */}
            <div className="branch-grid">
              {filteredReports.map((branch) => {
                const profit = branch.total_income - branch.total_expenses;
                return (
                  <div key={branch.id} className="branch-card" onClick={() => setSelectedBranch(branch)}>
                    <div style={{ background: '#f8fafc', padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><Building size={16} color="#3b82f6"/> {branch.name}</h3>
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12}/> {branch.address}</p>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                        <span style={{ color: '#475569' }}>Revenue:</span><strong style={{ color: '#0f172a' }}>PKR {branch.total_income.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px', paddingBottom: '15px', borderBottom: '1px dashed #e2e8f0' }}>
                        <span style={{ color: '#475569' }}>Expenses:</span><strong style={{ color: '#ef4444' }}>- PKR {branch.total_expenses.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px' }}>
                        <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Net Profit:</span>
                        <span className={profit >= 0 ? 'profit-positive' : 'profit-negative'}>PKR {profit.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 🚨 EMBEDS THE POPUP COMPONENT WE JUST MADE! */}
      {selectedBranch && (
        <BranchProfile 
          branch={selectedBranch} 
          allStaff={allStaff} 
          onClose={() => setSelectedBranch(null)} 
        />
      )}
    </>
  );
}

export default BranchReports;
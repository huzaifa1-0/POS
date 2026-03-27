import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, TrendingUp, DollarSign, Activity, Search, Building, MapPin, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import BranchProfile from './BranchProfile';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

function BranchReports() {
  const [reports, setReports] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
        /* 🚨 DASHBOARD LOCK: Locks the page to the screen height */
        .full-width-wrapper { 
          padding: 24px 30px; 
          width: 100%; 
          box-sizing: border-box; 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
          height: calc(100vh - 60px); /* Adjusts for your top navbar */
          display: flex;
          flex-direction: column;
          overflow: hidden; /* Prevents the whole page from scrolling */
        }
        
        .profit-positive { color: #16a34a; background: #dcfce3; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-flex; align-items: center; gap: 4px; }
        .profit-negative { color: #dc2626; background: #fee2e2; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-flex; align-items: center; gap: 4px; }
        
        /* 🚨 TOP FIXED SECTION (Never Moves!) */
        .top-fixed-section {
          flex-shrink: 0; 
        }

        .top-dashboard-layout {
          display: grid;
          grid-template-columns: 680px 1fr; 
          gap: 25px;
          margin-bottom: 25px;
        }

        .metrics-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .summary-card {
          border-radius: 12px; color: white; padding: 20px 25px;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.15); flex: 1; 
          display: flex; flex-direction: column; justify-content: center;
          transition: transform 0.2s ease;
        }
        .summary-card:hover { transform: translateY(-2px); }

        /* Reduced min-height slightly so it fits on 13-inch laptops safely */
        .chart-box {
          background: white; padding: 25px; border-radius: 12px; 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;
          display: flex; flex-direction: column; min-height: 320px;
        }

        .branch-section-header {
          display: flex; justify-content: space-between; align-items: center; 
          margin-bottom: 20px; flex-wrap: wrap; gap: 15px;
        }

        /* 🚨 INDEPENDENT SCROLL AREA FOR BRANCHES */
        .branch-scroll-area {
          flex: 1; /* Takes up all remaining screen height */
          overflow-y: auto; /* ONLY this area scrolls */
          padding-right: 10px; /* Room for the scrollbar */
          padding-bottom: 20px;
        }

        /* Custom scrollbar for branch list */
        .branch-scroll-area::-webkit-scrollbar { width: 6px; }
        .branch-scroll-area::-webkit-scrollbar-track { background: transparent; }
        .branch-scroll-area::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

        .branch-grid { 
          display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; 
        }
        .branch-card { 
          background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.04); transition: all 0.2s ease; cursor: pointer; 
          display: flex; flex-direction: column; overflow: hidden;
        }
        .branch-card:hover { border-color: #3b82f6; box-shadow: 0 12px 20px -5px rgba(59,130,246,0.15); transform: translateY(-4px); }

        @media (max-width: 1100px) {
          .top-dashboard-layout { grid-template-columns: 1fr; } 
          .metrics-column { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; } 
          .summary-card { padding: 20px; }
        }

        /* 🚨 ON MOBILE: Turn scrolling off so it acts like a normal page */
        @media (max-width: 768px) {
          .full-width-wrapper { height: auto; overflow: visible; display: block; padding: 15px; }
          .branch-scroll-area { overflow-y: visible; padding-right: 0; }
          .metrics-column { grid-template-columns: 1fr; gap: 10px; } 
          .summary-card { padding: 15px 20px !important; flex-direction: row !important; justify-content: space-between !important; align-items: center !important; }
          .summary-card h2 { font-size: 20px !important; margin: 0 !important; }
          .summary-card p { font-size: 12px !important; margin: 0 !important; }
          .chart-box { padding: 15px; min-height: 280px; }
          .branch-grid { grid-template-columns: 1fr; gap: 15px; }
        }
      `}</style>

      <div className="full-width-wrapper">
        
        {/* 🚨 THIS TOP SECTION IS FIXED AND NEVER SCROLLS */}
        <div className="top-fixed-section">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', marginBottom: '20px', fontSize: '24px', fontWeight: '800' }}>
            <PieChart size={28} color="#3b82f6" /> Global Analytics
          </h1>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}><Activity className="animate-spin" size={30} style={{ margin: '0 auto 15px auto', color: '#3b82f6' }} /> Loading...</div>
          ) : (
            <>
              <div className="top-dashboard-layout">
                <div className="metrics-column">
                  <div className="summary-card" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                    <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={16}/> Total Revenue</p>
                    <h2 style={{ margin: '8px 0 0 0', fontSize: '32px' }}>PKR {networkRevenue.toLocaleString()}</h2>
                  </div>
                  <div className="summary-card" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                    <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={16}/> Total Expenses</p>
                    <h2 style={{ margin: '8px 0 0 0', fontSize: '32px' }}>PKR {networkExpenses.toLocaleString()}</h2>
                  </div>
                  <div className="summary-card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={16}/> Net Profit</p>
                    <h2 style={{ margin: '8px 0 0 0', fontSize: '32px' }}>PKR {networkProfit.toLocaleString()}</h2>
                  </div>
                </div>

                <div className="chart-box">
                  <div style={{ marginBottom: '15px' }}>
                    <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}><TrendingUp size={20} color="#3b82f6"/> Network Revenue Timeline</h2>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>Historical performance from first transaction to present</p>
                  </div>
                  <div style={{ flex: 1, width: '100%', minHeight: '220px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `Rs.${value >= 1000 ? (value/1000)+'k' : value}`} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(value) => [`PKR ${value.toLocaleString()}`, 'Revenue']} />
                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="branch-section-header">
                <div>
                  <h2 style={{ fontSize: '20px', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}><Building size={20} color="#64748b"/> Branch Directory</h2>
                </div>
                <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
                  <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input type="text" placeholder="Search branches..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '11px 12px 11px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* 🚨 THIS BOTTOM SECTION INDEPENDENTLY SCROLLS! */}
        {!loading && (
          <div className="branch-scroll-area">
            <div className="branch-grid">
              {filteredReports.map((branch) => {
                const profit = branch.total_income - branch.total_expenses;
                const isProfitable = profit >= 0;
                return (
                  <div key={branch.id} className="branch-card" onClick={() => setSelectedBranch(branch)}>
                    <div style={{ background: '#f8fafc', padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <div style={{ background: 'white', padding: '10px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: '#3b82f6' }}>
                        <Building size={24} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: '700' }}>{branch.name}</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12}/> {branch.address}</p>
                      </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                        <span style={{ color: '#475569', fontWeight: '500' }}>Gross Revenue</span><strong style={{ color: '#0f172a' }}>PKR {branch.total_income.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', paddingBottom: '16px', borderBottom: '1px dashed #e2e8f0' }}>
                        <span style={{ color: '#475569', fontWeight: '500' }}>Operating Expenses</span><strong style={{ color: '#ef4444' }}>- PKR {branch.total_expenses.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px' }}>
                        <span style={{ fontWeight: '700', color: '#1e293b' }}>Net Profit</span>
                        <span className={isProfitable ? 'profit-positive' : 'profit-negative'}>
                          {isProfitable ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>} PKR {Math.abs(profit).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedBranch && (
        <BranchProfile branch={selectedBranch} allStaff={allStaff} onClose={() => setSelectedBranch(null)} />
      )}
    </>
  );
}

export default BranchReports;
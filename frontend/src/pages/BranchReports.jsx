import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PieChart, TrendingUp, DollarSign, MapPin, Building, CreditCard, 
  Activity, Search, Users, AlertTriangle, Package, BarChart2, X 
} from 'lucide-react';
// 🚨 IMPORT RECHARTS FOR THE GRAPH
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

function BranchReports() {
  const [reports, setReports] = useState([]);
  const [trendData, setTrendData] = useState([]); // 🚨 NEW STATE FOR GRAPH
  const [allStaff, setAllStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchDashboardStats, setBranchDashboardStats] = useState(null);
  const [loadingModalStats, setLoadingModalStats] = useState(false);

  useEffect(() => { fetchMasterData(); }, []);

  const getConfig = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } });

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const [reportsRes, staffRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/reports/master/`, getConfig()),
        axios.get(`${API_BASE_URL}/staff-list/`, getConfig())
      ]);
      
      // 🚨 Set Table Data & Graph Data
      setReports(reportsRes.data.branch_reports);
      setTrendData(reportsRes.data.network_trend);
      
      setAllStaff(staffRes.data.filter(u => u.role !== 'Admin')); 
    } catch (err) {
      console.error("Failed to load master reports data", err);
    } finally {
      setLoading(false);
    }
  };

  const openBranchModal = async (branch) => {
    setSelectedBranch(branch);
    setIsModalOpen(true);
    setLoadingModalStats(true);
    setBranchDashboardStats(null);

    try {
      const originalRole = sessionStorage.getItem('active_role');
      const originalBranch = sessionStorage.getItem('branch_id');
      
      sessionStorage.setItem('active_role', 'Manager');
      sessionStorage.setItem('branch_id', branch.id);

      const res = await axios.get(`${API_BASE_URL}/reports/dashboard/`, getConfig());
      setBranchDashboardStats(res.data);

      if(originalRole) sessionStorage.setItem('active_role', originalRole);
      else sessionStorage.removeItem('active_role');
      if(originalBranch) sessionStorage.setItem('branch_id', originalBranch);
      else sessionStorage.removeItem('branch_id');

    } catch (err) {
      console.error("Failed to load detailed branch stats", err);
    } finally {
      setLoadingModalStats(false);
    }
  };

  const filteredReports = reports.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const networkRevenue = reports.reduce((sum, r) => sum + parseFloat(r.total_income || 0), 0);
  const networkExpenses = reports.reduce((sum, r) => sum + parseFloat(r.total_expenses || 0), 0);
  const networkProfit = networkRevenue - networkExpenses;
  const branchEmployees = selectedBranch ? allStaff.filter(s => s.branch_id === selectedBranch.id) : [];

  return (
    <>
      <style>{`
        .full-width-wrapper { padding: 30px; width: 100%; box-sizing: border-box; }
        .profit-positive { color: #10b981; background: #dcfce3; padding: 4px 8px; border-radius: 6px; font-weight: bold; }
        .profit-negative { color: #ef4444; background: #fee2e2; padding: 4px 8px; border-radius: 6px; font-weight: bold; }
        
        .modern-table { width: 100%; border-collapse: collapse; min-width: 800px; }
        .modern-table th { background: #f8fafc; color: #475569; font-weight: 700; padding: 16px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
        .modern-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
        .modern-table tr { transition: all 0.2s ease; cursor: pointer; }
        .modern-table tr:hover td { background-color: #f8fafc; }
        
        .dashboard-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(8px); z-index: 9999; display: flex; justify-content: center; align-items: center; padding: 20px; opacity: 0; animation: fadeIn 0.2s forwards ease-out; }
        .dashboard-modal { background: #f8fafc; width: 100%; max-width: 1200px; height: auto; max-height: 90vh; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4); display: flex; flex-direction: column; transform: translateY(30px) scale(0.95); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; overflow: hidden; }
        .modal-body { padding: 25px; overflow-y: auto; flex: 1; }
        .compact-scroll::-webkit-scrollbar { width: 6px; }
        .compact-scroll::-webkit-scrollbar-track { background: transparent; }
        .compact-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes slideUp { to { transform: translateY(0) scale(1); } }

        .action-btn { background: #eff6ff; color: #3b82f6; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; font-weight: 600; font-size: 13px; transition: all 0.2s; }
        .action-btn:hover { background: #dbeafe; transform: translateY(-1px); }

        @media (max-width: 768px) {
          .full-width-wrapper { padding: 15px; }
          .network-summary { grid-template-columns: 1fr !important; }
          .table-container { padding: 10px !important; }
          .modern-table { min-width: 100% !important; font-size: 12px !important; }
          .modern-table th, .modern-table td { padding: 10px 6px !important; }
          .mobile-hide { display: none !important; }
          .dashboard-modal { margin: 10px; width: calc(100vw - 20px); max-height: 85vh; border-radius: 12px; }
          .modal-body { padding: 15px; }
          .metric-container { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .metric-card { padding: 12px !important; }
          .desktop-grid { grid-template-columns: 1fr !important; gap: 15px !important; }
          .search-bar { width: 100% !important; }
        }
      `}</style>

      <div className="full-width-wrapper">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', marginBottom: '25px', fontSize: '28px' }}>
          <PieChart size={30} color="#8b5cf6" /> Network Financial Reports
        </h1>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '50px', fontSize: '16px' }}>
            <Activity className="animate-spin" size={30} style={{ margin: '0 auto 15px auto', color: '#3b82f6' }} />
            Aggregating real-time network data...
          </div>
        ) : (
          <>
            <div className="network-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', padding: '25px', borderRadius: '12px', color: 'white', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>
                <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={16}/> Total Network Revenue</p>
                <h2 style={{ margin: '10px 0 0 0', fontSize: '32px' }}>PKR {networkRevenue.toLocaleString()}</h2>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', padding: '25px', borderRadius: '12px', color: 'white', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)' }}>
                <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={16}/> Total Network Expenses</p>
                <h2 style={{ margin: '10px 0 0 0', fontSize: '32px' }}>PKR {networkExpenses.toLocaleString()}</h2>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '25px', borderRadius: '12px', color: 'white', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' }}>
                <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={16}/> Estimated Network Profit</p>
                <h2 style={{ margin: '10px 0 0 0', fontSize: '32px' }}>PKR {networkProfit.toLocaleString()}</h2>
              </div>
            </div>

            {/* 🚨 NEW: BEAUTIFUL RECHARTS GRAPH */}
            <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} color="#3b82f6"/> 6-Month Network Revenue Trend
                </h2>
              </div>
              <div style={{ width: '100%', height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `Rs.${value >= 1000 ? (value/1000)+'k' : value}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(value) => [`PKR ${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* --- DATA TABLE CONTAINER --- */}
            <div className="table-container" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building size={18} color="#64748b"/> Branch Performance Directory
                </h2>
                <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
                  <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input 
                    type="text" 
                    placeholder="Search branches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '11px 12px 11px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              
              <div style={{ width: '100%', overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th style={{ width: '250px' }}>Branch Name & Address</th>
                      <th>Revenue</th>
                      <th className="mobile-hide">Expenses</th>
                      <th>Net Profit</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No branches found matching your search.</td></tr>
                    ) : (
                      filteredReports.map((branch) => {
                        const profit = branch.total_income - branch.total_expenses;
                        const isProfitable = profit >= 0;
                        return (
                          <tr key={branch.id} onClick={() => openBranchModal(branch)}>
                            <td>
                              <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>{branch.name}</strong>
                              <span style={{ color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12}/> {branch.address}</span>
                            </td>
                            <td style={{ fontWeight: '600', color: '#334155' }}>PKR {branch.total_income.toLocaleString()}</td>
                            <td className="mobile-hide" style={{ color: '#ef4444' }}>PKR {branch.total_expenses.toLocaleString()}</td>
                            <td>
                              <span className={isProfitable ? 'profit-positive' : 'profit-negative'}>
                                {isProfitable ? '+' : ''}PKR {profit.toLocaleString()}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button className="action-btn" onClick={(e) => { e.stopPropagation(); openBranchModal(branch); }}>
                                <BarChart2 size={16} /> <span className="mobile-hide">View Report</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- MASTER ANALYTICS MODAL --- */}
      {isModalOpen && selectedBranch && (
        <div className="dashboard-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="dashboard-modal" onClick={e => e.stopPropagation()}>
            <div style={{ background: '#ffffff', padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}><Building size={24} color="#3b82f6"/> {selectedBranch.name} Report</h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={14}/> {selectedBranch.address}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: '#475569', display: 'flex' }}><X size={20}/></button>
            </div>

            <div className="modal-body">
              {loadingModalStats ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                  <Activity className="animate-spin" size={40} style={{ margin: '0 auto 20px auto', color: '#3b82f6' }} />
                  <div style={{ fontSize: '16px' }}>Fetching deep analytics for {selectedBranch.name}...</div>
                </div>
              ) : branchDashboardStats ? (
                <>
                  <div className="metric-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                    <div className="metric-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #3b82f6', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Total Revenue</p>
                      <h3 style={{ margin: '8px 0 0 0', fontSize: '24px', color: '#1e293b' }}>PKR {selectedBranch.total_income.toLocaleString()}</h3>
                    </div>
                    <div className="metric-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #10b981', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Branch Expenses</p>
                      <h3 style={{ margin: '8px 0 0 0', fontSize: '24px', color: '#ef4444' }}>PKR {selectedBranch.total_expenses.toLocaleString()}</h3>
                    </div>
                    <div className="metric-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #f59e0b', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Cash / Online Split</p>
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#334155', fontWeight: '500' }}>
                        <div><DollarSign size={12} color="#10b981"/> Cash: {selectedBranch.cash_income}</div>
                        <div style={{ marginTop: '4px' }}><CreditCard size={12} color="#3b82f6"/> Web: {selectedBranch.online_income}</div>
                      </div>
                    </div>
                    <div className="metric-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #8b5cf6', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Net Branch Profit</p>
                      <h3 style={{ margin: '8px 0 0 0', fontSize: '24px', color: (selectedBranch.total_income - selectedBranch.total_expenses) >= 0 ? '#10b981' : '#ef4444' }}>
                        PKR {(selectedBranch.total_income - selectedBranch.total_expenses).toLocaleString()}
                      </h3>
                    </div>
                  </div>

                  <div className="desktop-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontSize: '16px' }}><Users size={18} color="#3b82f6"/> Assigned Employees</h3>
                      </div>
                      <div className="compact-scroll" style={{ maxHeight: '250px', overflowY: 'auto', padding: '10px' }}>
                        {branchEmployees.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {branchEmployees.map(emp => (
                              <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px', background: '#ffffff' }}>
                                <div><strong style={{ display: 'block', color: '#1e293b', fontSize: '14px' }}>{emp.name}</strong><span style={{ color: '#64748b', fontSize: '12px' }}>{emp.email}</span></div>
                                <span style={{ background: emp.role === 'Manager' ? '#fef3c7' : '#e0f2fe', color: emp.role === 'Manager' ? '#b45309' : '#0369a1', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>{emp.role}</span>
                              </div>
                            ))}
                          </div>
                        ) : (<div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '14px' }}>No employees assigned to this branch.</div>)}
                      </div>
                    </div>

                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontSize: '16px' }}><AlertTriangle size={18} color="#ef4444"/> Critical Stock Levels</h3>
                      </div>
                      <div className="compact-scroll" style={{ maxHeight: '250px', overflowY: 'auto', padding: '10px' }}>
                        {branchDashboardStats.low_stock.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {branchDashboardStats.low_stock.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Package size={14} color="#dc2626" /><span style={{ fontWeight: '600', color: '#991b1b', fontSize: '14px' }}>{item.name}</span></div>
                                <strong style={{ color: '#dc2626', fontSize: '14px', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px' }}>{item.quantity_on_hand} {item.unit}</strong>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '30px 20px', color: '#16a34a', fontSize: '14px', fontWeight: 'bold' }}><Package size={30} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />All stock levels are healthy! ✅</div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BranchReports;
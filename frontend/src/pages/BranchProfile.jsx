import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, MapPin, X, Activity, DollarSign, CreditCard, Users, AlertTriangle, Package, TrendingUp, Receipt } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export default function BranchProfile({ branch, allStaff, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');

  const getConfig = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}`, 'X-Branch-Id': branch.id } });

  useEffect(() => {
    const fetchBranchData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/reports/dashboard/`, getConfig());
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load branch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBranchData();
  }, [branch.id]);

  const branchEmployees = allStaff.filter(s => s.branch_id === branch.id);

  return (
    <>
      <style>{`
        .profile-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(8px); z-index: 9999; display: flex; justify-content: center; align-items: center; padding: 20px; opacity: 0; animation: fadeIn 0.2s forwards ease-out; }
        .profile-modal { background: #f8fafc; width: 100%; max-width: 1100px; height: 90vh; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); display: flex; flex-direction: column; transform: translateY(30px) scale(0.95); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; overflow: hidden; }
        .profile-header { background: white; padding: 20px 25px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        
        .profile-tabs { display: flex; background: #f1f5f9; padding: 0 20px; border-bottom: 1px solid #e2e8f0; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .tab-btn { padding: 16px 20px; background: none; border: none; border-bottom: 3px solid transparent; color: #64748b; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px; transition: all 0.2s; white-space: nowrap; }
        .tab-btn.active { background-color: #3b82f6; color: #ffffff; border-bottom-color: #3b82f6; border-radius: 8px 8px 0 0; }
        .tab-btn:hover:not(.active) { color: #0f172a; }
        
        /* New class for the text inside the tab */
        .tab-label { transition: all 0.2s ease; }

        .profile-body { padding: 25px; overflow-y: auto; flex: 1; }
        .modern-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .modern-table th { background: #f8fafc; color: #475569; font-weight: 700; padding: 12px 16px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; position: sticky; top: 0; z-index: 10; }
        .modern-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; }
        .modern-table tr:hover td { background-color: #f8fafc; }
        
        /* 🚨 Desktop Chart Height */
        .modal-chart-wrapper { width: 100%; height: 300px; min-height: 300px; position: relative; }

        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes slideUp { to { transform: translateY(0) scale(1); } }

        /* 🚨 ULTIMATE MOBILE VIEW SETTINGS */
        @media (max-width: 768px) {
          .profile-modal { margin: 0; width: 100vw; height: 100vh; border-radius: 0; max-height: 100vh; } 
          .profile-overlay { padding: 0; }
          
          /* Header */
          .profile-header { padding: 12px 15px !important; }
          .profile-header h2 { font-size: 16px !important; }
          .profile-header p { font-size: 11px !important; }
          
          /* 🚨 MOBILE TABS: Hide text unless active to save space! */
          .profile-tabs { padding: 0 5px !important; gap: 5px; justify-content: space-around; }
          .tab-btn { padding: 12px 15px !important; font-size: 12px !important; flex: 1; justify-content: center; }
          .tab-btn .tab-label { display: none; } /* Hide text by default on mobile */
          .tab-btn.active .tab-label { display: inline-block; } /* Show text only on active tab */
          .tab-btn svg { width: 16px; height: 16px; }
          
          /* Body & Metrics */
          .profile-body { padding: 12px !important; }
          .metric-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; margin-bottom: 15px !important; }
          .metric-grid > div { padding: 10px !important; border-width: 1px !important; border-left-width: 3px !important; }
          .metric-grid p { font-size: 9px !important; letter-spacing: -0.5px; }
          .metric-grid h3 { font-size: 14px !important; margin-top: 4px !important; }
          
          /* 🚨 Shrink Chart Height on Mobile */
          .modal-chart-wrapper { height: 180px !important; min-height: 180px !important; }
          .profile-body > div > div:nth-child(2) { padding: 12px !important; }
          .profile-body > div > div:nth-child(2) h3 { font-size: 13px !important; margin-bottom: 10px !important; }
          
          /* Stack Split Grids */
          .split-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
          .split-grid > div { padding: 12px !important; }
          .split-grid h3 { font-size: 13px !important; margin-bottom: 10px !important; }
          
          /* Keep table scrollable but don't break page */
          .modern-table { min-width: 400px; } 
          .modern-table th, .modern-table td { padding: 8px !important; font-size: 11px !important; }
        }
      `}</style>

      <div className="profile-overlay" onClick={onClose}>
        <div className="profile-modal" onClick={e => e.stopPropagation()}>
          
          <div className="profile-header">
            <div>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}><Building size={24} color="#3b82f6"/> {branch.name}</h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={14}/> {branch.address}</p>
            </div>
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: '#475569' }}><X size={20}/></button>
          </div>

          <div className="profile-tabs compact-scroll">
            <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
              <TrendingUp size={16}/> <span className="tab-label">Analytics</span>
            </button>
            <button className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
              <Receipt size={16}/> <span className="tab-label">Expenses</span>
            </button>
            <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
              <Package size={16}/> <span className="tab-label">Inventory</span>
            </button>
            <button className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>
              <Users size={16}/> <span className="tab-label">Staff</span>
            </button>
          </div>

          <div className="profile-body compact-scroll">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                <Activity className="animate-spin" size={40} style={{ margin: '0 auto 20px auto', color: '#3b82f6' }} />
                <div style={{ fontSize: '16px' }}>Fetching branch profile...</div>
              </div>
            ) : (
              <>
                {/* TAB 1: ANALYTICS */}
                {activeTab === 'analytics' && (
                  <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    <div className="metric-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' }}>
                      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #3b82f6', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Total Revenue</p>
                        <h3 style={{ margin: '8px 0 0 0', fontSize: '22px', color: '#1e293b' }}>PKR {stats.total_income.toLocaleString()}</h3>
                      </div>
                      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ef4444', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Total Expenses</p>
                        <h3 style={{ margin: '8px 0 0 0', fontSize: '22px', color: '#ef4444' }}>PKR {stats.total_expenses.toLocaleString()}</h3>
                      </div>
                      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #10b981', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Net Branch Profit</p>
                        <h3 style={{ margin: '8px 0 0 0', fontSize: '22px', color: '#10b981' }}>PKR {stats.net_profit.toLocaleString()}</h3>
                      </div>
                      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #f59e0b', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Cash / Online</p>
                        <div style={{ marginTop: '8px', fontSize: '14px', color: '#334155', fontWeight: '500' }}>
                          <div><DollarSign size={12} color="#10b981"/> Csh: {stats.cash_income}</div>
                          <div style={{ marginTop: '4px' }}><CreditCard size={12} color="#3b82f6"/> Web: {stats.online_income}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={18} color="#3b82f6"/> Branch Revenue Timeline</h3>
                      <div className="modal-chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats.trend_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="branchColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `Rs.${value >= 1000 ? (value/1000)+'k' : value}`} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(value) => [`PKR ${value.toLocaleString()}`, 'Revenue']} />
                            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#branchColor)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: EXPENSES */}
                {activeTab === 'expenses' && (
                  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto', animation: 'fadeIn 0.2s ease-out' }}>
                    <table className="modern-table">
                      <thead><tr><th>Date</th><th>Category</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                      <tbody>
                        {stats.recent_expenses.length === 0 ? <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No expenses logged for this branch.</td></tr> : (
                          stats.recent_expenses.map(exp => (
                            <tr key={exp.id}>
                              <td style={{ color: '#64748b' }}>{exp.date}</td>
                              <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{exp.category}</span></td>
                              <td>{exp.description}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>-PKR {exp.amount}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 3: INVENTORY */}
                {activeTab === 'inventory' && (
                  <div className="split-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', animation: 'fadeIn 0.2s ease-out' }}>
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
                      <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}><TrendingUp size={18}/> Top Selling Items</h3>
                      {stats.top_items.length === 0 ? <p style={{ color: '#94a3b8' }}>No sales data yet.</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {stats.top_items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <span style={{ fontWeight: 'bold', color: '#334155' }}>{item.name}</span>
                              <div style={{ display: 'flex', gap: '15px' }}><span style={{ color: '#64748b' }}>Sold: {item.total_sold}</span><strong style={{ color: '#10b981' }}>PKR {item.revenue}</strong></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
                      <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}><AlertTriangle size={18}/> Low Stock Alerts</h3>
                      {stats.low_stock.length === 0 ? <p style={{ color: '#10b981', fontWeight: 'bold' }}>All stock levels healthy! ✅</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {stats.low_stock.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                              <span style={{ fontWeight: 'bold', color: '#991b1b' }}>{item.name}</span>
                              <strong style={{ color: '#dc2626' }}>{item.quantity_on_hand} {item.unit}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: STAFF */}
                {activeTab === 'staff' && (
                  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto', animation: 'fadeIn 0.2s ease-out' }}>
                    <table className="modern-table">
                      <thead><tr><th>Name</th><th>Email</th><th>Assigned Role</th></tr></thead>
                      <tbody>
                        {branchEmployees.length === 0 ? <tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No employees assigned to this location.</td></tr> : (
                          branchEmployees.map(emp => (
                            <tr key={emp.id}>
                              <td style={{ fontWeight: 'bold', color: '#0f172a' }}>{emp.name}</td>
                              <td style={{ color: '#64748b' }}>{emp.email}</td>
                              <td><span style={{ background: emp.role === 'Manager' ? '#fef3c7' : '#e0f2fe', color: emp.role === 'Manager' ? '#b45309' : '#0369a1', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{emp.role}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
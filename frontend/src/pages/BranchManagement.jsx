import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MapPin, Plus, Edit, Trash2, Building, UserPlus, X, 
  TrendingUp, AlertTriangle, Calendar, BarChart2, Users, Search 
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]); 
  const [message, setMessage] = useState('');
  
  // --- NEW: SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form States
  const [activeForm, setActiveForm] = useState('branch');
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState('Cashier');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Edit States
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchAddress, setEditBranchAddress] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchStats, setBranchStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => { 
    fetchBranches(); 
    fetchUsers(); 
  }, []);

  const getConfig = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } });

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/branches/`, getConfig());
      setBranches(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/users/`, getConfig());
      setUsers(res.data.filter(u => u.role !== 'Admin')); 
    } catch (err) { console.error(err); }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/branches/`, { name: branchName, address: branchAddress, is_active: true }, getConfig());
      setMessage('Branch created successfully!');
      setBranchName(''); setBranchAddress('');
      fetchBranches();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert("Failed to create branch."); }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/auth/create-cashier/`, { 
        name: staffName, email: staffEmail, password: staffPassword, branch_id: selectedBranchId, role: staffRole 
      }, getConfig());
      
      setMessage(`${staffRole} assigned successfully!`);
      setStaffName(''); setStaffEmail(''); setStaffPassword(''); setSelectedBranchId(''); setStaffRole('Cashier'); 
      fetchUsers(); 
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert(err.response?.data?.error || "Failed to create staff member."); }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm("WARNING: Are you sure you want to delete this branch?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/branches/${id}/`, getConfig());
      setMessage('Branch deleted successfully!');
      fetchBranches();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert("Failed to delete branch."); }
  };

  const startEditingBranch = (branch) => {
    setEditingBranchId(branch.id);
    setEditBranchName(branch.name);
    setEditBranchAddress(branch.address);
  };

  const handleUpdateBranch = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/branches/${editingBranchId}/`, { name: editBranchName, address: editBranchAddress, is_active: true }, getConfig());
      setMessage('Branch updated successfully!');
      setEditingBranchId(null);
      fetchBranches();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert("Failed to update branch."); }
  };

  const openBranchModal = async (branch) => {
    setSelectedBranch(branch);
    setIsModalOpen(true);
    setLoadingStats(true);
    setBranchStats(null);

    try {
      const originalRole = sessionStorage.getItem('active_role');
      const originalBranch = sessionStorage.getItem('branch_id');
      
      sessionStorage.setItem('active_role', 'Manager');
      sessionStorage.setItem('branch_id', branch.id);

      const res = await axios.get(`${API_BASE_URL}/reports/dashboard/`, getConfig());
      setBranchStats(res.data);

      if(originalRole) sessionStorage.setItem('active_role', originalRole);
      else sessionStorage.removeItem('active_role');
      if(originalBranch) sessionStorage.setItem('branch_id', originalBranch);
      else sessionStorage.removeItem('branch_id');

    } catch (err) {
      console.error("Failed to load branch stats", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // --- NEW: FILTER LOGIC ---
  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.branch_name && u.branch_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <style>{`
        .full-width-wrapper { padding: 30px; width: 100%; max-width: 100%; box-sizing: border-box; }
        
        .dashboard-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px);
          z-index: 9999; display: flex; justify-content: center; align-items: center;
          padding: 20px; opacity: 0; animation: fadeIn 0.25s forwards ease-out;
        }
        .dashboard-modal {
          background: #f8fafc; width: 100%; max-width: 1300px; max-height: 95vh;
          border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          display: flex; flex-direction: column; transform: translateY(30px) scale(0.95);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; overflow: hidden;
        }
        .modal-body { padding: 25px; overflow-y: auto; flex: 1; }

        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes slideUp { to { transform: translateY(0) scale(1); } }

        .modern-table { width: 100%; border-collapse: collapse; min-width: 700px; }
        .modern-table th { background: #f1f5f9; color: #475569; font-weight: 700; padding: 16px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 14px; text-transform: uppercase; }
        .modern-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
        .modern-table tr:hover td { background-color: #f8fafc; }
        .action-btn { background: none; border: none; padding: 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 5px; font-weight: 600; font-size: 13px; }
        .action-btn.view { background: #eff6ff; color: #3b82f6; }
        
        /* 🚨 EXTREME MOBILE RESPONSIVENESS FIXES */
        @media (max-width: 768px) {
          .full-width-wrapper { padding: 10px; }
          .page-title { font-size: 20px !important; margin-bottom: 15px !important; }
          
          /* Keep tabs on same row */
          .tab-btn-title { font-size: 13px !important; padding: 12px 5px !important; flex: 1; text-align: center; }
          
          /* Table squeeze fix */
          .table-container { padding: 10px !important; }
          .modern-table { min-width: 100% !important; font-size: 12px !important; }
          .modern-table th, .modern-table td { padding: 8px 4px !important; }
          .modern-table th { font-size: 10px !important; letter-spacing: 0; }
          .mobile-hide { display: none !important; } /* Hides ID column */
          
          /* Shrink Action Buttons (Hide Text, Keep Icon) */
          .action-text { display: none; } 
          .action-btn { padding: 6px !important; justify-content: center; }
          .action-btn-container { gap: 4px !important; }
          
          /* Modal Adjustments */
          /* 🚨 UPGRADED: Sleek Floating Mobile Modal */
          .dashboard-modal { 
            margin: 15px; 
            width: calc(100vw - 30px); 
            height: auto; /* Lets the modal shrink if there is less data */
            max-height: 85vh; /* Prevents it from touching the very top/bottom of the screen */
            border-radius: 16px !important; /* Keeps the modern rounded corners */
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
          }
          .modal-body { 
            padding: 15px; 
            overflow-y: auto; /* Ensures only the inside scrolls, not the whole page */
          }
          .modal-title { font-size: 18px !important; }
          
          /* 4 Metric Cards -> 2x2 Grid */
          .metric-container { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; margin-bottom: 15px !important;}
          .metric-card { padding: 12px !important; }
          .metric-card p { font-size: 9px !important; }
          .metric-card h3 { font-size: 16px !important; margin-top: 5px !important; }
          
          /* Split Grid to Column */
          .desktop-grid { grid-template-columns: 1fr !important; gap: 15px !important; }
          .mobile-col { flex-direction: column !important; align-items: stretch !important; }
          .mobile-col-btn { width: 100% !important; margin-top: 10px; }
        }
      `}</style>

      <div className="full-width-wrapper">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#0f172a', marginBottom: '25px', fontSize: '28px' }}>
          <Building size={28} color="#3b82f6" /> Business Management
        </h1>
        
        {message && <div style={{ padding: '16px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', fontSize: '14px' }}>✓ {message}</div>}

        {/* --- UNIFIED MANAGEMENT CONTAINER --- */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '25px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {/* 🚨 Tabs kept on the SAME row */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <button className="tab-btn-title" onClick={() => setActiveForm('branch')} style={{ padding: '16px', background: 'none', border: 'none', borderBottom: activeForm === 'branch' ? '3px solid #3b82f6' : '3px solid transparent', color: activeForm === 'branch' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}>
              <Building size={16}/> Locations
            </button>
            <button className="tab-btn-title" onClick={() => setActiveForm('staff')} style={{ padding: '16px', background: 'none', border: 'none', borderBottom: activeForm === 'staff' ? '3px solid #10b981' : '3px solid transparent', color: activeForm === 'staff' ? '#10b981' : '#64748b', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}>
              <Users size={16}/> Employees
            </button>
          </div>

          <div style={{ padding: '20px' }}>
            {activeForm === 'branch' ? (
              <form onSubmit={handleCreateBranch} className="mobile-col desktop-grid" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px', display: 'block' }}>Branch Name</label>
                  <input type="text" placeholder="e.g., Gulberg Branch" value={branchName} onChange={e => setBranchName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                </div>
                <div style={{ flex: 2, minWidth: '200px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px', display: 'block' }}>Complete Address</label>
                  <input type="text" placeholder="e.g., Main Boulevard, Lahore" value={branchAddress} onChange={e => setBranchAddress(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="mobile-col-btn" style={{ padding: '10px 20px', height: '42px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>+ Add</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateStaff} className="desktop-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                <input type="text" placeholder="Staff Name" value={staffName} onChange={e => setStaffName(e.target.value)} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                <input type="email" placeholder="Staff Email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                <input type="password" placeholder="Password" value={staffPassword} onChange={e => setStaffPassword(e.target.value)} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                <select value={staffRole} onChange={e => setStaffRole(e.target.value)} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}>
                  <option value="Cashier">Role: Cashier</option>
                  <option value="Manager">Role: Manager</option>
                </select>
                <select value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}>
                  <option value="" disabled>Select Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <button type="submit" style={{ padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>Hire Staff</button>
              </form>
            )}
          </div>
        </div>

        {/* --- DYNAMIC DATA TABLE --- */}
        <div className="table-container" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          
          {/* Header & Search Bar Row */}
          <div className="mobile-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
            <h2 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>
              {activeForm === 'branch' ? 'Active Locations' : 'Hired Employees'}
            </h2>
            <div style={{ position: 'relative', width: window.innerWidth < 768 ? '100%' : '300px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input 
                type="text" 
                placeholder={`Search ${activeForm === 'branch' ? 'branches' : 'employees'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          
          <div style={{ width: '100%', overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {activeForm === 'branch' ? (
              // BRANCHES TABLE
              <table className="modern-table">
                <thead>
                  <tr>
                    <th className="mobile-hide" style={{ width: '60px' }}>ID</th>
                    <th>Branch Details</th>
                    <th className="mobile-hide">Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBranches.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No matches found.</td></tr>
                  ) : (
                    filteredBranches.map(b => (
                      <tr key={b.id} style={{ cursor: editingBranchId === b.id ? 'default' : 'pointer' }} onClick={(e) => {
                        if(editingBranchId !== b.id && !e.target.closest('.no-modal-click')) openBranchModal(b);
                      }}>
                        <td className="mobile-hide" style={{ color: '#64748b', fontWeight: 'bold' }}>#{b.id}</td>
                        <td>
                          {editingBranchId === b.id ? (
                            <form onSubmit={handleUpdateBranch} className="no-modal-click mobile-col" style={{ display: 'flex', gap: '8px', width: '100%' }}>
                              <input type="text" value={editBranchName} onChange={e => setEditBranchName(e.target.value)} required style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', flex: 1, fontSize: '12px' }} />
                              <input type="text" value={editBranchAddress} onChange={e => setEditBranchAddress(e.target.value)} required style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', flex: 2, fontSize: '12px' }} />
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button type="submit" style={{ background: '#10b981', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12px' }}>Save</button>
                                <button type="button" onClick={() => setEditingBranchId(null)} style={{ background: '#94a3b8', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '12px' }}>Cancel</button>
                              </div>
                            </form>
                          ) : (
                            <div>
                              <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block', marginBottom: '2px' }}>{b.name}</strong>
                              <span style={{ color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12}/> {b.address}</span>
                            </div>
                          )}
                        </td>
                        <td className="mobile-hide"><span style={{ background: '#dcfce3', color: '#16a34a', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>Active</span></td>
                        <td style={{ textAlign: 'right' }}>
                          {editingBranchId !== b.id && (
                            <div className="no-modal-click action-btn-container" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button onClick={(e) => { e.stopPropagation(); openBranchModal(b); }} className="action-btn view">
                                <BarChart2 size={14}/><span className="action-text">Report</span>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); startEditingBranch(b); }} style={{ background: 'none', color: '#64748b', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '6px' }}>
                                <Edit size={14}/><span className="action-text">Edit</span>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteBranch(b.id); }} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px', borderRadius: '6px' }}>
                                <Trash2 size={14}/><span className="action-text">Del</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              // EMPLOYEES TABLE
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Name & Email</th>
                    <th>Role</th>
                    <th>Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No matches found.</td></tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>{u.name}</strong>
                          <span style={{ fontSize: '12px', color: '#64748b', wordBreak: 'break-all' }}>{u.email}</span>
                        </td>
                        <td><span style={{ background: u.role === 'Manager' ? '#fef3c7' : '#e0f2fe', color: u.role === 'Manager' ? '#b45309' : '#0369a1', padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>{u.role}</span></td>
                        <td style={{ color: '#334155', fontWeight: '500', fontSize: '13px' }}>{u.branch_name || 'Unassigned'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* --- DASHBOARD POPUP MODAL --- */}
      {isModalOpen && selectedBranch && (
        <div className="dashboard-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="dashboard-modal" onClick={e => e.stopPropagation()}>
            
            <div style={{ background: '#ffffff', padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="modal-title" style={{ margin: 0, color: '#0f172a', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart2 size={20} color="#3b82f6"/> {selectedBranch.name} Report</h2>
                <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12}/> {selectedBranch.address}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#475569', display: 'flex' }}><X size={18}/></button>
            </div>

            <div className="modal-body">
              {loadingStats ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>Fetching branch data...</div>
              ) : branchStats ? (
                <>
                  {/* 🚨 2x2 GRID ON MOBILE, 4-COLUMN ON DESKTOP */}
                  <div className="metric-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                    <div className="metric-card" style={{ background: 'white', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #3b82f6', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                      <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>Total Revenue</p>
                      <h3 style={{ margin: '8px 0 0 0', fontSize: '20px', color: '#1e293b' }}>PKR {branchStats.total_income}</h3>
                    </div>
                    <div className="metric-card" style={{ background: 'white', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #10b981', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                      <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>Cash Payments</p>
                      <h3 style={{ margin: '8px 0 0 0', fontSize: '20px', color: '#1e293b' }}>PKR {branchStats.cash_income}</h3>
                    </div>
                    <div className="metric-card" style={{ background: 'white', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #8b5cf6', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                      <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>Online/Bank</p>
                      <h3 style={{ margin: '8px 0 0 0', fontSize: '20px', color: '#1e293b' }}>PKR {branchStats.online_income}</h3>
                    </div>
                    <div className="metric-card" style={{ background: 'white', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #ef4444', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                      <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>Cost of Goods</p>
                      <h3 style={{ margin: '8px 0 0 0', fontSize: '20px', color: '#1e293b' }}>PKR {branchStats.cogs}</h3>
                    </div>
                  </div>

                  <div className="desktop-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <h3 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontSize: '15px' }}><TrendingUp size={16}/> Top Selling Items</h3>
                      {branchStats.top_items.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {branchStats.top_items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                              <span style={{ fontWeight: 'bold', color: '#334155' }}>{item.name}</span>
                              <div style={{ display: 'flex', gap: '15px' }}>
                                <span style={{ color: '#64748b' }}>Sold: {item.total_sold}</span>
                                <strong style={{ color: '#10b981' }}>PKR {item.revenue}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (<p style={{ color: '#94a3b8', fontSize: '13px' }}>No sales data yet.</p>)}
                    </div>

                    <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <h3 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '15px' }}><AlertTriangle size={16}/> Low Stock Alert</h3>
                      {branchStats.low_stock.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {branchStats.low_stock.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '13px' }}>
                              <span style={{ fontWeight: 'bold', color: '#991b1b' }}>{item.name}</span>
                              <strong style={{ color: '#dc2626' }}>{item.quantity_on_hand} {item.unit}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (<p style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '13px' }}>All stock levels good! ✅</p>)}
                    </div>
                  </div>

                  <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '15px' }}><Calendar size={16}/> Order History</h3>
                    <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                      <table className="modern-table" style={{ minWidth: '100%', fontSize: '12px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                          <tr><th>Order ID</th><th>Date</th><th>Type</th><th>Amount</th></tr>
                        </thead>
                        <tbody>
                          {branchStats.recent_orders.length > 0 ? (
                            branchStats.recent_orders.map((order, idx) => (
                              <tr key={idx}>
                                <td style={{ color: '#64748b' }}>#{order.id}</td>
                                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                <td style={{ fontWeight: '500' }}>{order.order_type}</td>
                                <td style={{ fontWeight: 'bold', color: '#334155' }}>PKR {order.total_amount}</td>
                              </tr>
                            ))
                          ) : (<tr><td colSpan="4" style={{ textAlign: 'center', padding: '15px', color: '#94a3b8' }}>No recent orders.</td></tr>)}
                        </tbody>
                      </table>
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

export default BranchManagement;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MapPin, Plus, Edit, Trash2, Building, UserPlus, X, 
  TrendingUp, AlertTriangle, Calendar, BarChart2, Users 
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]); // 🚨 NEW: State for Employees
  const [message, setMessage] = useState('');
  
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

  // 🚨 NEW: Fetch Employees
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/users/`, getConfig());
      // Filter out Admins, so we only see the employees we hired
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
      fetchUsers(); // Refresh employee list
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

  return (
    <>
      <style>{`
        .full-width-wrapper {
          padding: 30px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .dashboard-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px);
          z-index: 9999; display: flex; justify-content: center; align-items: center;
          padding: 20px; opacity: 0; animation: fadeIn 0.25s forwards ease-out;
        }
        
        .dashboard-modal {
          background: #f8fafc; width: 100%; max-width: 1300px; max-height: 95vh;
          border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          display: flex; flex-direction: column;
          transform: translateY(30px) scale(0.95);
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
        
        /* 🚨 MOBILE RESPONSIVE FIXES */
        @media (max-width: 768px) {
          .full-width-wrapper { padding: 15px; }
          .dashboard-modal { margin: 0; width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; }
          .modal-body { padding: 15px; }
          .desktop-grid { grid-template-columns: 1fr !important; }
          .mobile-col { flex-direction: column !important; align-items: stretch !important; }
          .mobile-col-btn { width: 100% !important; margin-top: 10px; }
        }
      `}</style>

      <div className="full-width-wrapper">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#0f172a', marginBottom: '25px', fontSize: '28px' }}>
          <Building size={32} color="#3b82f6" /> Business Management
        </h1>
        
        {message && <div style={{ padding: '16px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '25px', fontWeight: 'bold' }}>✓ {message}</div>}

        {/* --- UNIFIED MANAGEMENT CONTAINER --- */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '35px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <div className="mobile-col" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <button onClick={() => setActiveForm('branch')} style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeForm === 'branch' ? '3px solid #3b82f6' : '3px solid transparent', color: activeForm === 'branch' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}>
              <Building size={18}/> Branch Locations
            </button>
            <button onClick={() => setActiveForm('staff')} style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeForm === 'staff' ? '3px solid #10b981' : '3px solid transparent', color: activeForm === 'staff' ? '#10b981' : '#64748b', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px' }}>
              <Users size={18}/> Employees & Staff
            </button>
          </div>

          <div style={{ padding: '25px' }}>
            {activeForm === 'branch' ? (
              <form onSubmit={handleCreateBranch} className="mobile-col desktop-grid" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px', display: 'block' }}>Branch Name</label>
                  <input type="text" placeholder="e.g., Gulberg Branch" value={branchName} onChange={e => setBranchName(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }} />
                </div>
                <div style={{ flex: 2, minWidth: '250px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '8px', display: 'block' }}>Complete Address</label>
                  <input type="text" placeholder="e.g., Main Boulevard, Lahore" value={branchAddress} onChange={e => setBranchAddress(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="mobile-col-btn" style={{ padding: '12px 24px', height: '46px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>+ Register Branch</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateStaff} className="desktop-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <input type="text" placeholder="Staff Full Name" value={staffName} onChange={e => setStaffName(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }} />
                <input type="email" placeholder="Staff Email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }} />
                <input type="password" placeholder="Password" value={staffPassword} onChange={e => setStaffPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }} />
                <select value={staffRole} onChange={e => setStaffRole(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}>
                  <option value="Cashier">Role: Cashier</option>
                  <option value="Manager">Role: Manager</option>
                </select>
                <select value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}>
                  <option value="" disabled>Select Target Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <button type="submit" style={{ padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>Hire Staff Member</button>
              </form>
            )}
          </div>
        </div>

        {/* --- DYNAMIC DATA TABLE --- */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '20px', marginTop: 0, marginBottom: '20px', color: '#0f172a' }}>
            {activeForm === 'branch' ? 'Active Network Locations' : 'Hired Employees'}
          </h2>
          
          <div style={{ width: '100%', overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {activeForm === 'branch' ? (
              // BRANCHES TABLE
              <table className="modern-table">
                <thead>
                  <tr>
                    <th style={{ width: '100px' }}>ID</th>
                    <th>Branch Name & Address</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No branches found.</td></tr>
                  ) : (
                    branches.map(b => (
                      <tr key={b.id} style={{ cursor: editingBranchId === b.id ? 'default' : 'pointer' }} onClick={(e) => {
                        if(editingBranchId !== b.id && !e.target.closest('.no-modal-click')) openBranchModal(b);
                      }}>
                        <td style={{ color: '#64748b', fontWeight: 'bold' }}>#{b.id}</td>
                        <td>
                          {editingBranchId === b.id ? (
                            <form onSubmit={handleUpdateBranch} className="no-modal-click mobile-col" style={{ display: 'flex', gap: '10px', width: '100%' }}>
                              <input type="text" value={editBranchName} onChange={e => setEditBranchName(e.target.value)} required style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', flex: 1 }} />
                              <input type="text" value={editBranchAddress} onChange={e => setEditBranchAddress(e.target.value)} required style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', flex: 2 }} />
                              <button type="submit" style={{ background: '#10b981', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px' }}>Save</button>
                              <button type="button" onClick={() => setEditingBranchId(null)} style={{ background: '#94a3b8', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px' }}>Cancel</button>
                            </form>
                          ) : (
                            <div>
                              <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>{b.name}</strong>
                              <span style={{ color: '#64748b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14}/> {b.address}</span>
                            </div>
                          )}
                        </td>
                        <td><span style={{ background: '#dcfce3', color: '#16a34a', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>Active</span></td>
                        <td style={{ textAlign: 'right' }}>
                          {editingBranchId !== b.id && (
                            <div className="no-modal-click" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                              <button onClick={(e) => { e.stopPropagation(); openBranchModal(b); }} className="action-btn view"><BarChart2 size={16}/> Dashboard</button>
                              <button onClick={(e) => { e.stopPropagation(); startEditingBranch(b); }} style={{ background: 'none', color: '#64748b', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '6px' }}><Edit size={16}/></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteBranch(b.id); }} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '8px', borderRadius: '6px' }}><Trash2 size={16}/></button>
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
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Assigned Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No employees hired yet.</td></tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 'bold', color: '#0f172a' }}>{u.name}</td>
                        <td style={{ color: '#64748b' }}>{u.email}</td>
                        <td><span style={{ background: u.role === 'Manager' ? '#fef3c7' : '#e0f2fe', color: u.role === 'Manager' ? '#b45309' : '#0369a1', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{u.role}</span></td>
                        <td style={{ color: '#334155', fontWeight: '500' }}>{u.branch_name || 'Unassigned'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* --- DASHBOARD POPUP MODAL (Matches rasad.jpeg perfectly) --- */}
      {isModalOpen && selectedBranch && (
        <div className="dashboard-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="dashboard-modal" onClick={e => e.stopPropagation()}>
            
            <div style={{ background: '#ffffff', padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart2 size={24} color="#3b82f6"/> {selectedBranch.name} Dashboard</h2>
                <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={14}/> {selectedBranch.address}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: '#475569', display: 'flex' }}><X size={20}/></button>
            </div>

            <div className="modal-body">
              {loadingStats ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', fontSize: '16px' }}>Fetching branch data...</div>
              ) : branchStats ? (
                <>
                  <div className="desktop-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Total Revenue</p>
                      <h3 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#1e293b' }}>PKR {branchStats.total_income}</h3>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Cash Payments</p>
                      <h3 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#1e293b' }}>PKR {branchStats.cash_income}</h3>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #8b5cf6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Online/Bank</p>
                      <h3 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#1e293b' }}>PKR {branchStats.online_income}</h3>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #ef4444', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <p style={{ margin: 0, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px' }}>Cost of Goods</p>
                      <h3 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#1e293b' }}>PKR {branchStats.cogs}</h3>
                    </div>
                  </div>

                  <div className="desktop-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '25px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontSize: '16px' }}><TrendingUp size={18}/> Top Selling Items</h3>
                      {branchStats.top_items.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {branchStats.top_items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <span style={{ fontWeight: 'bold', color: '#334155' }}>{item.name}</span>
                              <div style={{ display: 'flex', gap: '20px' }}>
                                <span style={{ color: '#64748b' }}>Sold: {item.total_sold}</span>
                                <strong style={{ color: '#10b981' }}>PKR {item.revenue}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (<p style={{ color: '#94a3b8' }}>No sales data yet.</p>)}
                    </div>

                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '16px' }}><AlertTriangle size={18}/> Low Stock Alert</h3>
                      {branchStats.low_stock.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {branchStats.low_stock.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                              <span style={{ fontWeight: 'bold', color: '#991b1b' }}>{item.name}</span>
                              <strong style={{ color: '#dc2626' }}>{item.quantity_on_hand} {item.unit}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (<p style={{ color: '#16a34a', fontWeight: 'bold' }}>All stock levels good! ✅</p>)}
                    </div>
                  </div>

                  <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '16px' }}><Calendar size={18}/> Order History</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <table className="modern-table" style={{ minWidth: '100%' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                          <tr><th>Order ID</th><th>Date</th><th>Type</th><th>Method</th><th>Amount</th></tr>
                        </thead>
                        <tbody>
                          {branchStats.recent_orders.length > 0 ? (
                            branchStats.recent_orders.map((order, idx) => (
                              <tr key={idx}>
                                <td style={{ color: '#64748b' }}>#{order.id}</td>
                                <td>{new Date(order.created_at).toLocaleString()}</td>
                                <td style={{ fontWeight: '500' }}>{order.order_type}</td>
                                <td style={{ color: '#0ea5e9' }}>{order.payment_method}</td>
                                <td style={{ fontWeight: 'bold', color: '#334155' }}>PKR {order.total_amount}</td>
                              </tr>
                            ))
                          ) : (<tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No recent orders.</td></tr>)}
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
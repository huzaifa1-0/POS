import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Settings() {
  const [activeTab, setActiveTab] = useState('permissions');

  const [screens, setScreens] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [message, setMessage] = useState('');
  
  const [branches, setBranches] = useState([]);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  
  const [cashierName, setCashierName] = useState('');
  const [cashierEmail, setCashierEmail] = useState('');
  const [cashierPassword, setCashierPassword] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branchSales, setBranchSales] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
  const fetchBranchSales = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/reports/branch-sales/`, { 
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } 
      });
      setBranchSales(res.data);
    } catch (err) { 
      console.error("Failed to load branch sales reports"); 
    }
  };
  useEffect(() => {
    fetchMatrix();
    fetchUsers();
    fetchBranches();
    fetchBranchSales();
  }, []);

  const fetchMatrix = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/role-permissions/`, { headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } });
      setScreens(res.data.screens);
      setMatrix(res.data.matrix);
    } catch (err) { console.error("Failed to load settings matrix"); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/users/`, { headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } });
      setUsers(res.data.users);
      setAvailableRoles(res.data.roles);
      setAssignments(res.data.assignments);
    } catch (err) { console.error("Failed to load staff list"); }
  };

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/branches/`, { headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } });
      setBranches(res.data);
    } catch (err) { console.error("Failed to load branches"); }
  };

  const handleCheckboxChange = async (roleId, permissionKey, isChecked) => {
    const roleToUpdate = matrix.find(r => r.role_id === roleId);
    let newPermissions = [...roleToUpdate.permissions];
    if (isChecked) newPermissions.push(permissionKey);
    else newPermissions = newPermissions.filter(key => key !== permissionKey);

    setMatrix(prevMatrix => prevMatrix.map(role => role.role_id === roleId ? { ...role, permissions: newPermissions } : role));

    try {
      await axios.post(`${API_BASE_URL}/auth/role-permissions/`, { role_id: roleId, permissions: newPermissions }, { headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } });
      setMessage('Screen permissions saved instantly!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) { alert("Failed to save changes."); fetchMatrix(); }
  };

  const handleRoleAssignment = async (userId, roleName) => {
    try {
      await axios.post(`${API_BASE_URL}/auth/users/`, { user_id: userId, role_name: roleName }, { headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } });
      setMessage('Staff access updated successfully!');
      setTimeout(() => setMessage(''), 2000);
      fetchUsers(); 
    } catch (err) { alert("Failed to update staff access."); }
  };

  // --- NEW FUNCTION: Reassign Cashier Branch ---
  const handleBranchReassignment = async (userId, branchId) => {
    try {
      await axios.post(`${API_BASE_URL}/auth/change-cashier-branch/`, 
      { 
        cashier_id: userId, 
        branch_id: branchId 
      }, 
      { headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } });
      
      setMessage('Staff branch reassigned successfully!');
      setTimeout(() => setMessage(''), 2000);
      fetchUsers();
    } catch (err) { 
      alert(err.response?.data?.error || "Failed to reassign branch. Ensure you are an Admin."); 
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/branches/`, { name: branchName, address: branchAddress, is_active: true }, { headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } });
      setMessage('Branch created successfully!');
      setBranchName(''); setBranchAddress(''); fetchBranches();
      setTimeout(() => setMessage(''), 2000);
    } catch (err) { alert("Failed to create branch."); }
  };

  const handleCreateCashier = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/auth/create-cashier/`, { name: cashierName, email: cashierEmail, password: cashierPassword, branch_id: selectedBranchId }, { headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } });
      setMessage('Cashier created and assigned to branch!');
      setCashierName(''); setCashierEmail(''); setCashierPassword(''); setSelectedBranchId(''); fetchUsers();
      setTimeout(() => setMessage(''), 2000);
    } catch (err) { alert(err.response?.data?.error || "Failed to create cashier."); }
  };

  return (
    <div className="settings-container">
      <h1 className="settings-header">System Settings</h1>
      
      <div className="settings-tabs">
        <button className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}>
          Staff & Permissions
        </button>
        <button className={`tab-btn ${activeTab === 'branches' ? 'active' : ''}`} onClick={() => setActiveTab('branches')}>
          Branch Management
        </button>
        <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          Branch Sales Reports
        </button>
      </div>

      {message && <div className="settings-success-alert">✓ {message}</div>}

      {/* --- TAB 1: PERMISSIONS & APPROVALS --- */}
      {activeTab === 'permissions' && (
        <div className="settings-layout-wrapper">
          <div className="settings-card matrix-card">
            <div className="settings-card-header"><h2>Screen Access Matrix</h2></div>
            <div className="table-responsive-wrapper">
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>App Screen</th>
                    {matrix.map(role => <th key={role.role_id} className="center-text">{role.role_name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {screens.map(screen => (
                    <tr key={screen.key}>
                      <td>{screen.label}</td>
                      {matrix.map(role => (
                        <td key={role.role_id} className="center-text">
                          <input type="checkbox" className="settings-checkbox" checked={role.permissions.includes(screen.key)} onChange={(e) => handleCheckboxChange(role.role_id, screen.key, e.target.checked)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="settings-card approvals-card">
             <div className="settings-card-header"><h2>Staff Approvals & Routing</h2></div>
             <div className="table-responsive-wrapper scrollable-table">
              <table className="settings-table">
                <thead>
                  {/* Added Branch column header */}
                  <tr><th>Email</th><th>Status</th><th>Role Assignment</th><th>Branch Reassignment</th></tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.email || user.username}</td>
                      <td>
                        <span className={`status-badge ${assignments[user.id] === 'Pending' ? 'pending' : 'approved'}`}>
                          {assignments[user.id]}
                        </span>
                      </td>
                      <td>
                        <select className="role-select" value={assignments[user.id]} onChange={(e) => handleRoleAssignment(user.id, e.target.value)}>
                          <option value="Pending">Revoke Access</option>
                          {availableRoles.map(role => <option key={role.id} value={role.name}>Approve as {role.name}</option>)}
                        </select>
                      </td>
                      {/* --- NEW: Branch Assignment Dropdown --- */}
                      <td>
                        <select 
                          className="role-select" 
                          defaultValue="" 
                          onChange={(e) => handleBranchReassignment(user.id, e.target.value)}
                        >
                          <option value="" disabled>Move to Branch...</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: BRANCH MANAGEMENT --- */}
      {activeTab === 'branches' && (
        <div className="settings-layout-wrapper">
          
          <div className="settings-card form-card">
            <div className="settings-card-header"><h2>Create New Branch</h2></div>
            <div className="card-body">
              <form className="settings-form" onSubmit={handleCreateBranch}>
                <input type="text" className="form-input" placeholder="Branch Name (e.g., Gulberg Branch)" value={branchName} onChange={e => setBranchName(e.target.value)} required />
                <input type="text" className="form-input" placeholder="Branch Address" value={branchAddress} onChange={e => setBranchAddress(e.target.value)} required />
                <button type="submit" className="btn-primary">+ Add Branch</button>
              </form>

              <h3 className="sub-header">Existing Branches</h3>
              <ul className="branch-list">
                {branches.map(b => (
                  <li key={b.id}><strong>{b.name}</strong> <br/> <span className="branch-address">{b.address}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="settings-card form-card">
            <div className="settings-card-header"><h2>Assign New Cashier to Branch</h2></div>
            <div className="card-body">
              <form className="settings-form" onSubmit={handleCreateCashier}>
                <input type="text" className="form-input" placeholder="Cashier Full Name" value={cashierName} onChange={e => setCashierName(e.target.value)} required />
                <input type="email" className="form-input" placeholder="Cashier Email" value={cashierEmail} onChange={e => setCashierEmail(e.target.value)} required />
                <input type="password" className="form-input" placeholder="Password" value={cashierPassword} onChange={e => setCashierPassword(e.target.value)} required />
                
                <select className="form-select" value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} required>
                  <option value="" disabled>Select a Branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>

                <button type="submit" className="btn-success">Create Cashier</button>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 3: BRANCH SALES REPORTS --- */}
      {activeTab === 'reports' && (
        <div className="settings-layout-wrapper">
          <div className="settings-card form-card" style={{ flex: 1, minWidth: '100%' }}>
            <div className="settings-card-header">
              <h2>Total Revenue by Branch</h2>
            </div>
            <div className="table-responsive-wrapper scrollable-table">
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Branch Name</th>
                    <th className="center-text">Total Orders Completed</th>
                    <th className="center-text">Total Revenue Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {branchSales.length > 0 ? (
                    branchSales.map((report, index) => (
                      <tr key={index}>
                        <td><strong style={{ color: '#0f172a' }}>{report.branch_name}</strong></td>
                        <td className="center-text">{report.total_orders}</td>
                        <td className="center-text" style={{ color: '#10b981', fontWeight: '900', fontSize: '16px' }}>
                          Rs. {Number(report.total_revenue).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="center-text" style={{ padding: '30px', color: '#64748b' }}>
                        No sales data available yet. Start making sales!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Settings;
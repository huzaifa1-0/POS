import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";

function Settings() {
  const token = sessionStorage.getItem('access_token');
  let realRole = null;
  if (token) {
    try { realRole = jwtDecode(token).role; } catch(e) {}
  }
  
  const [activeTab, setActiveTab] = useState('permissions');

  // Core Settings States
  const [screens, setScreens] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [message, setMessage] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
  const getConfig = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } });

  useEffect(() => {
    fetchMatrix();
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchMatrix = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/role-permissions/`, getConfig());
      setScreens(res.data.screens);
      setMatrix(res.data.matrix);
    } catch (err) { console.error("Failed to load settings matrix"); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/staff-list/`, getConfig());
      setUsers(res.data.filter(u => u.role !== 'Admin')); 
    } catch (err) { console.error("Failed to load staff list"); }
  };

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/branches/`, getConfig());
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
      await axios.post(`${API_BASE_URL}/auth/role-permissions/`, { role_id: roleId, permissions: newPermissions }, getConfig());
      setMessage('Screen permissions saved instantly!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) { alert("Failed to save changes."); fetchMatrix(); }
  };

  const handleRoleAssignment = async (userId, roleName) => {
    try {
      await axios.post(`${API_BASE_URL}/update-role/`, { user_id: userId, role_name: roleName }, getConfig());
      setMessage('Staff access updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      fetchUsers(); 
    } catch (err) { 
      alert(err.response?.data?.error || "Failed to update staff access."); 
      fetchUsers(); 
    }
  };

  const handleBranchReassignment = async (userId, branchId) => {
    try {
      await axios.post(`${API_BASE_URL}/update-staff-branch/`, { 
        user_id: userId,
        branch_id: branchId
      }, getConfig());
      
      setMessage('Staff branch reassigned successfully!');
      setTimeout(() => setMessage(''), 3000);
      fetchUsers();
    } catch (err) { 
      alert(err.response?.data?.error || "Failed to reassign branch."); 
      fetchUsers(); 
    }
  };

  return (
    <div className="settings-container" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', overflowX: 'hidden' }}>
      <h1 className="settings-header" style={{ fontSize: '28px', color: '#0f172a', marginBottom: '20px' }}>System Settings</h1>
      
      <div className="settings-tabs" style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
        <button 
          style={{ padding: '12px 20px', background: 'none', border: 'none', borderBottom: '3px solid #3b82f6', color: '#3b82f6', fontWeight: 'bold', cursor: 'default', fontSize: '15px' }}
        >
          Staff & Permissions
        </button>
      </div>

      {message && <div className="settings-success-alert" style={{ padding: '15px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>✓ {message}</div>}

      <div className="settings-layout-wrapper">
        <div className="settings-card matrix-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
          <div className="settings-card-header"><h2 style={{ fontSize: '18px', margin: '0 0 15px 0' }}>Screen Access Matrix</h2></div>
          <div className="table-responsive-wrapper" style={{ overflowX: 'auto' }}>
            <table className="settings-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>App Screen</th>
                  {matrix.map(role => <th key={role.role_id} className="center-text" style={{ padding: '12px', color: '#475569' }}>{role.role_name}</th>)}
                </tr>
              </thead>
              <tbody>
                {screens.map(screen => (
                  <tr key={screen.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', color: '#334155', fontWeight: '500' }}>{screen.label}</td>
                    {matrix.map(role => (
                      <td key={role.role_id} className="center-text" style={{ padding: '12px', textAlign: 'center' }}>
                        <input type="checkbox" className="settings-checkbox" checked={role.permissions.includes(screen.key)} onChange={(e) => handleCheckboxChange(role.role_id, screen.key, e.target.checked)} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="settings-card approvals-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
           <div className="settings-card-header"><h2 style={{ fontSize: '18px', margin: '0 0 15px 0' }}>Staff Approvals & Routing</h2></div>
           <div className="table-responsive-wrapper scrollable-table" style={{ overflowX: 'auto' }}>
            <table className="settings-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Staff Member</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Role Assignment</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#475569' }}>Branch Transfer</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>
                      <strong style={{ display: 'block', color: '#0f172a' }}>{user.name}</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{user.email || user.username}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: user.role === 'Pending' ? '#fef3c7' : '#dcfce3', color: user.role === 'Pending' ? '#b45309' : '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <select className="role-select" value={user.role} onChange={(e) => handleRoleAssignment(user.id, e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                        <option value="Pending">Revoke Access</option>
                        <option value="Cashier">Approve as Cashier</option>
                        <option value="Manager">Approve as Manager</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <select className="role-select" value={user.branch_id || ""} onChange={(e) => handleBranchReassignment(user.id, e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                        <option value="" disabled>Move to Branch...</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No staff hired yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
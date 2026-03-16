import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Settings() {
  const [screens, setScreens] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [message, setMessage] = useState('');
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    fetchMatrix();
    fetchUsers();
  }, []);

  const fetchMatrix = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/role-permissions/`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` }
      });
      setScreens(res.data.screens);
      setMatrix(res.data.matrix);
    } catch (err) {
      console.error("Failed to load settings matrix");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/users/`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` }
      });
      setUsers(res.data.users);
      setAvailableRoles(res.data.roles);
      setAssignments(res.data.assignments);
    } catch (err) {
      console.error("Failed to load staff list");
    }
  };

  const handleCheckboxChange = async (roleId, permissionKey, isChecked) => {
    const roleToUpdate = matrix.find(r => r.role_id === roleId);
    let newPermissions = [...roleToUpdate.permissions];

    if (isChecked) newPermissions.push(permissionKey);
    else newPermissions = newPermissions.filter(key => key !== permissionKey);

    try {
      await axios.post(`${API_BASE_URL}/auth/role-permissions/`, {
        role_id: roleId,
        permissions: newPermissions
      }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` }
      });
      setMessage('Screen permissions saved instantly!');
      setTimeout(() => setMessage(''), 2000);
      fetchMatrix(); 
    } catch (err) {
      alert("Failed to save changes.");
    }
  };

  const handleRoleAssignment = async (userId, roleName) => {
    try {
      await axios.post(`${API_BASE_URL}/auth/users/`, {
        user_id: userId,
        role_name: roleName
      }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` }
      });
      setMessage('Staff access updated successfully!');
      setTimeout(() => setMessage(''), 2000);
      fetchUsers(); 
    } catch (err) {
      alert("Failed to update staff access.");
    }
  };

  return (
    <div className="settings-container">
      <h1 className="settings-header">Admin & Staff Settings</h1>
      <p className="settings-description">
        Approve new staff accounts and manage which screens they are allowed to access.
      </p>

      {message && (
        <div className="settings-success-alert">
          ✓ {message}
        </div>
      )}

      {/* --- STAFF APPROVALS TABLE --- */}
      <div className="settings-card" style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', padding: '15px 20px', borderBottom: '1px solid #e2e8f0', margin: 0, color: '#1e293b' }}>
          Staff Approvals
        </h2>
        <div className="table-responsive-wrapper">
          <table className="settings-table">
            <thead>
              <tr>
                <th>Email / Name</th>
                <th>Current Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.email || user.username}</td>
                  <td>
                    {assignments[user.id] === 'Pending' ? (
                      <span style={{ background: '#fef08a', color: '#b45309', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Pending</span>
                    ) : (
                      <span style={{ background: '#dcfce3', color: '#15803d', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{assignments[user.id]}</span>
                    )}
                  </td>
                  <td>
                    <select 
                      value={assignments[user.id]} 
                      onChange={(e) => handleRoleAssignment(user.id, e.target.value)}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', background: 'white' }}
                    >
                      <option value="Pending">Revoke Access (Pending)</option>
                      {availableRoles.map(role => (
                        <option key={role.id} value={role.name}>Approve as {role.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SCREEN PERMISSIONS MATRIX --- */}
      <div className="settings-card">
        <h2 style={{ fontSize: '18px', padding: '15px 20px', borderBottom: '1px solid #e2e8f0', margin: 0, color: '#1e293b' }}>
          Screen Access Matrix
        </h2>
        <div className="table-responsive-wrapper">
          <table className="settings-table">
            <thead>
              <tr>
                <th>App Screen</th>
                {matrix.map(role => (
                  <th key={role.role_id} style={{ textAlign: 'center' }}>{role.role_name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {screens.map(screen => (
                <tr key={screen.key}>
                  <td>{screen.label}</td>
                  {matrix.map(role => (
                    <td key={role.role_id} style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        className="settings-checkbox"
                        checked={role.permissions.includes(screen.key)}
                        onChange={(e) => handleCheckboxChange(role.role_id, screen.key, e.target.checked)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}

export default Settings;
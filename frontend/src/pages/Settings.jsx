import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Settings() {
  // --- TAB STATE ---
  const [activeTab, setActiveTab] = useState('permissions');

  // --- EXISTING STATES ---
  const [screens, setScreens] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [message, setMessage] = useState('');
  
  // --- NEW BRANCH STATES ---
  const [branches, setBranches] = useState([]);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  
  // --- NEW CASHIER STATES ---
  const [cashierName, setCashierName] = useState('');
  const [cashierEmail, setCashierEmail] = useState('');
  const [cashierPassword, setCashierPassword] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    fetchMatrix();
    fetchUsers();
    fetchBranches(); // Load branches on mount
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

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/branches/`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` }
      });
      setBranches(res.data);
    } catch (err) {
      console.error("Failed to load branches");
    }
  };

  const handleCheckboxChange = async (roleId, permissionKey, isChecked) => {
    const roleToUpdate = matrix.find(r => r.role_id === roleId);
    let newPermissions = [...roleToUpdate.permissions];

    if (isChecked) newPermissions.push(permissionKey);
    else newPermissions = newPermissions.filter(key => key !== permissionKey);

    setMatrix(prevMatrix => prevMatrix.map(role => 
      role.role_id === roleId ? { ...role, permissions: newPermissions } : role
    ));

    try {
      await axios.post(`${API_BASE_URL}/auth/role-permissions/`, {
        role_id: roleId,
        permissions: newPermissions
      }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` }
      });
      setMessage('Screen permissions saved instantly!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      alert("Failed to save changes.");
      fetchMatrix();
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

  // --- NEW: Create Branch ---
  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/branches/`, {
        name: branchName,
        address: branchAddress,
        is_active: true
      }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` }
      });
      setMessage('Branch created successfully!');
      setBranchName('');
      setBranchAddress('');
      fetchBranches();
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      alert("Failed to create branch.");
    }
  };

  // --- NEW: Create Cashier & Assign to Branch ---
  const handleCreateCashier = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/auth/create-cashier/`, {
        name: cashierName,
        email: cashierEmail,
        password: cashierPassword,
        branch_id: selectedBranchId
      }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` }
      });
      setMessage('Cashier created and assigned to branch!');
      setCashierName('');
      setCashierEmail('');
      setCashierPassword('');
      setSelectedBranchId('');
      fetchUsers();
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create cashier.");
    }
  };

  return (
    <div className="settings-container" style={{ padding: '20px' }}>
      <h1 className="settings-header">System Settings</h1>
      
      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('permissions')} 
          style={{ padding: '10px 20px', fontWeight: 'bold', background: activeTab === 'permissions' ? '#3b82f6' : '#f1f5f9', color: activeTab === 'permissions' ? 'white' : 'black', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Staff & Permissions
        </button>
        <button 
          onClick={() => setActiveTab('branches')} 
          style={{ padding: '10px 20px', fontWeight: 'bold', background: activeTab === 'branches' ? '#3b82f6' : '#f1f5f9', color: activeTab === 'branches' ? 'white' : 'black', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Branch Management
        </button>
      </div>

      {message && (
        <div className="settings-success-alert" style={{ background: '#dcfce3', color: '#16a34a', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontWeight: 'bold' }}>
          ✓ {message}
        </div>
      )}

      {/* --- TAB 1: PERMISSIONS & APPROVALS --- */}
      {activeTab === 'permissions' && (
        <div className="settings-layout-wrapper" style={{ display: 'flex', gap: '20px' }}>
          
          <div className="settings-card matrix-card" style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h2>Screen Access Matrix</h2>
            <table className="settings-table" style={{ width: '100%', textAlign: 'left', marginTop: '15px' }}>
              <thead>
                <tr>
                  <th>App Screen</th>
                  {matrix.map(role => <th key={role.role_id} style={{ textAlign: 'center' }}>{role.role_name}</th>)}
                </tr>
              </thead>
              <tbody>
                {screens.map(screen => (
                  <tr key={screen.key}>
                    <td style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>{screen.label}</td>
                    {matrix.map(role => (
                      <td key={role.role_id} style={{ textAlign: 'center', borderBottom: '1px solid #eee' }}>
                        <input 
                          type="checkbox" 
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

          <div className="settings-card approvals-card" style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h2>Staff Approvals</h2>
            <table className="settings-table" style={{ width: '100%', textAlign: 'left', marginTop: '15px' }}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>{user.email || user.username}</td>
                    <td style={{ borderBottom: '1px solid #eee' }}>{assignments[user.id]}</td>
                    <td style={{ borderBottom: '1px solid #eee' }}>
                      <select value={assignments[user.id]} onChange={(e) => handleRoleAssignment(user.id, e.target.value)}>
                        <option value="Pending">Revoke Access</option>
                        {availableRoles.map(role => <option key={role.id} value={role.name}>Approve as {role.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2: BRANCH MANAGEMENT --- */}
      {activeTab === 'branches' && (
        <div className="settings-layout-wrapper" style={{ display: 'flex', gap: '20px' }}>
          
          {/* CREATE BRANCH FORM */}
          <div className="settings-card" style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h2>Create New Branch</h2>
            <form onSubmit={handleCreateBranch} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <input type="text" placeholder="Branch Name (e.g., Gulberg Branch)" value={branchName} onChange={e => setBranchName(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}/>
              <input type="text" placeholder="Branch Address" value={branchAddress} onChange={e => setBranchAddress(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}/>
              <button type="submit" style={{ padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add Branch</button>
            </form>

            <h3 style={{ marginTop: '30px' }}>Existing Branches</h3>
            <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
              {branches.map(b => (
                <li key={b.id} style={{ marginBottom: '10px' }}><strong>{b.name}</strong> - {b.address}</li>
              ))}
            </ul>
          </div>

          {/* CREATE CASHIER FORM */}
          <div className="settings-card" style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h2>Assign New Cashier to Branch</h2>
            <form onSubmit={handleCreateCashier} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              <input type="text" placeholder="Cashier Full Name" value={cashierName} onChange={e => setCashierName(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}/>
              <input type="email" placeholder="Cashier Email" value={cashierEmail} onChange={e => setCashierEmail(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}/>
              <input type="password" placeholder="Password" value={cashierPassword} onChange={e => setCashierPassword(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}/>
              
              <select value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}>
                <option value="" disabled>Select a Branch</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <button type="submit" style={{ padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Create Cashier</button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}

export default Settings;
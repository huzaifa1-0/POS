import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Settings() {
  const [screens, setScreens] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [message, setMessage] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/role-permissions/`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` }
      });
      setScreens(res.data.screens);
      setMatrix(res.data.matrix);
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  };

  const handleCheckboxChange = async (roleId, permissionKey, isChecked) => {
    const roleToUpdate = matrix.find(r => r.role_id === roleId);
    let newPermissions = [...roleToUpdate.permissions];

    if (isChecked) {
      newPermissions.push(permissionKey);
    } else {
      newPermissions = newPermissions.filter(key => key !== permissionKey);
    }

    try {
      await axios.post(`${API_BASE_URL}/auth/role-permissions/`, {
        role_id: roleId,
        permissions: newPermissions
      }, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` }
      });

      setMessage('Changes saved instantly!');
      setTimeout(() => setMessage(''), 2000);
      fetchMatrix(); 
    } catch (err) {
      alert("Failed to save changes.");
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Role & Screen Management</h1>
      <p style={{ color: '#64748b', marginBottom: '20px' }}>
        Check the boxes below to grant Managers or Cashiers access to specific screens. (Admins have access to everything by default).
      </p>

      {message && <div style={{ padding: '10px', background: '#dcfce3', color: '#16a34a', marginBottom: '20px', borderRadius: '5px' }}>{message}</div>}

      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px' }}>App Screen</th>
              {matrix.map(role => (
                <th key={role.role_id} style={{ padding: '12px', textAlign: 'center' }}>{role.role_name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {screens.map(screen => (
              <tr key={screen.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: '500' }}>{screen.label}</td>
                
                {matrix.map(role => (
                  <td key={role.role_id} style={{ padding: '12px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
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
  );
}

export default Settings;
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
    <div className="settings-container">
      <h1 className="settings-header">Role & Screen Management</h1>
      <p className="settings-description">
        Check the boxes below to grant Managers or Cashiers access to specific screens. (Admins have access to everything by default).
      </p>

      {message && (
        <div className="settings-success-alert">
          ✓ {message}
        </div>
      )}

      <div className="settings-card">
        {/* THIS WRAPPER MAKES IT MOBILE RESPONSIVE! */}
        <div className="table-responsive-wrapper">
          <table className="settings-table">
            <thead>
              <tr>
                <th>App Screen</th>
                {matrix.map(role => (
                  <th key={role.role_id} style={{ textAlign: 'center' }}>
                    {role.role_name}
                  </th>
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
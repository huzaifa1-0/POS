import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [message, setMessage] = useState('');
  
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [editBranchName, setEditBranchName] = useState('');
  const [editBranchAddress, setEditBranchAddress] = useState('');

  useEffect(() => { fetchBranches(); }, []);

  const getConfig = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('access_token')}` } });

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/branches/`, getConfig());
      setBranches(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/branches/`, { name: branchName, address: branchAddress, is_active: true }, getConfig());
      setMessage('Branch created successfully!');
      setBranchName(''); setBranchAddress('');
      fetchBranches();
      setTimeout(() => setMessage(''), 2000);
    } catch (err) { alert("Failed to create branch."); }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/branches/${id}/`, getConfig());
      setMessage('Branch deleted successfully!');
      fetchBranches();
      setTimeout(() => setMessage(''), 2000);
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
      setTimeout(() => setMessage(''), 2000);
    } catch (err) { alert("Failed to update branch."); }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', width: '100%', overflowY: 'auto' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
        <MapPin size={28} color="#3b82f6" /> Global Branch Management
      </h1>
      
      {message && <div style={{ padding: '15px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '20px' }}>✓ {message}</div>}

      {/* CREATE FORM */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', marginTop: 0 }}>Register New Branch</h2>
        <form onSubmit={handleCreateBranch} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Branch Name" value={branchName} onChange={e => setBranchName(e.target.value)} required style={{ flex: 1, minWidth: '200px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          <input type="text" placeholder="Branch Address" value={branchAddress} onChange={e => setBranchAddress(e.target.value)} required style={{ flex: 2, minWidth: '250px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          <button type="submit" style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Plus size={18}/> Add Branch</button>
        </form>
      </div>

      {/* LIST / EDIT FORM */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '18px', marginTop: 0 }}>Active Locations</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {branches.map(b => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc', flexWrap: 'wrap', gap: '10px' }}>
              {editingBranchId === b.id ? (
                <form onSubmit={handleUpdateBranch} style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
                  <input type="text" value={editBranchName} onChange={e => setEditBranchName(e.target.value)} required style={{ flex: 1, padding: '8px' }} />
                  <input type="text" value={editBranchAddress} onChange={e => setEditBranchAddress(e.target.value)} required style={{ flex: 2, padding: '8px' }} />
                  <button type="submit" style={{ background: '#10b981', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '5px' }}>Save</button>
                  <button type="button" onClick={() => setEditingBranchId(null)} style={{ background: '#94a3b8', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '5px' }}>Cancel</button>
                </form>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '16px' }}>{b.name}</strong> <br/>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>{b.address}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button type="button" onClick={() => startEditingBranch(b)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><Edit size={18}/></button>
                    <button type="button" onClick={() => handleDeleteBranch(b.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18}/></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {branches.length === 0 && <p style={{ color: '#64748b' }}>No branches found.</p>}
        </div>
      </div>
    </div>
  );
}
export default BranchManagement;
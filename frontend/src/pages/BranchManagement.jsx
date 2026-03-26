import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Plus, Edit, Trash2, Building, UserPlus, ExternalLink } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [message, setMessage] = useState('');
  
  // Unified Container State
  const [activeForm, setActiveForm] = useState('branch'); // 'branch' or 'staff'

  // Create Branch States
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  
  // Create Staff States
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState('Cashier');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Edit Branch States
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
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert("Failed to create branch."); }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/auth/create-cashier/`, { 
        name: staffName, email: staffEmail, password: staffPassword, branch_id: selectedBranchId, role: staffRole 
      }, getConfig());
      
      setMessage(`${staffRole} created and assigned to branch successfully!`);
      setStaffName(''); setStaffEmail(''); setStaffPassword(''); setSelectedBranchId(''); setStaffRole('Cashier'); 
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { alert(err.response?.data?.error || "Failed to create staff member."); }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;
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

  // --- 🚨 NEW: INSTANT WORKSPACE TELEPORTATION ---
  const enterBranchWorkspace = (branchId) => {
    sessionStorage.setItem('active_role', 'Manager'); // Simulate Manager to safely view this specific branch
    sessionStorage.setItem('branch_id', branchId);
    window.location.href = '/reports'; // Teleport directly to their reports!
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%', overflowY: 'auto' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', marginBottom: '20px', fontSize: '24px' }}>
        <MapPin size={28} color="#3b82f6" /> Global Branch Management
      </h1>
      
      {message && <div style={{ padding: '15px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>✓ {message}</div>}

      {/* --- UNIFIED MANAGEMENT CONTAINER --- */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '30px', overflow: 'hidden' }}>
        
        {/* Container Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button onClick={() => setActiveForm('branch')} style={{ flex: 1, padding: '15px', background: 'none', border: 'none', borderBottom: activeForm === 'branch' ? '3px solid #3b82f6' : '3px solid transparent', color: activeForm === 'branch' ? '#3b82f6' : '#64748b', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
            <Building size={18}/> Register New Branch
          </button>
          <button onClick={() => setActiveForm('staff')} style={{ flex: 1, padding: '15px', background: 'none', border: 'none', borderBottom: activeForm === 'staff' ? '3px solid #10b981' : '3px solid transparent', color: activeForm === 'staff' ? '#10b981' : '#64748b', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
            <UserPlus size={18}/> Assign Staff to Branch
          </button>
        </div>

        {/* Container Body */}
        <div style={{ padding: '20px' }}>
          {activeForm === 'branch' ? (
            <form onSubmit={handleCreateBranch} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px', display: 'block' }}>Branch Name</label>
                <input type="text" placeholder="e.g., Gulberg Branch" className="form-input" value={branchName} onChange={e => setBranchName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ flex: 2, minWidth: '250px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px', display: 'block' }}>Complete Address</label>
                <input type="text" placeholder="e.g., Main Boulevard, Lahore" className="form-input" value={branchAddress} onChange={e => setBranchAddress(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', width: window.innerWidth < 768 ? '100%' : 'auto' }}>
                <button type="submit" style={{ width: '100%', padding: '10px 20px', height: '42px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontWeight: 'bold' }}><Plus size={18}/> Create Branch</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateStaff} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <input type="text" placeholder="Staff Full Name" className="form-input" value={staffName} onChange={e => setStaffName(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <input type="email" placeholder="Staff Email" className="form-input" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <input type="password" placeholder="Password" className="form-input" value={staffPassword} onChange={e => setStaffPassword(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              
              <select className="form-input" value={staffRole} onChange={e => setStaffRole(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="Cashier">Assign as Cashier</option>
                <option value="Manager">Assign as Manager</option>
              </select>

              <select className="form-input" value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <option value="" disabled>Select a Target Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>

              <button type="submit" style={{ gridColumn: '1 / -1', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18}/> Register & Assign Staff Member
              </button>
            </form>
          )}
        </div>
      </div>

      {/* --- ACTIVE BRANCHES LIST --- */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '18px', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>Active Network Locations</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {branches.map(b => (
            <div key={b.id} style={{ display: 'flex', flexDirection: 'column', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#f8fafc', transition: 'transform 0.2s', position: 'relative' }}>
              
              {editingBranchId === b.id ? (
                <form onSubmit={handleUpdateBranch} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  <input type="text" value={editBranchName} onChange={e => setEditBranchName(e.target.value)} required style={{ padding: '8px', borderRadius: '5px', border: '1px solid #cbd5e1' }} />
                  <input type="text" value={editBranchAddress} onChange={e => setEditBranchAddress(e.target.value)} required style={{ padding: '8px', borderRadius: '5px', border: '1px solid #cbd5e1' }} />
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button type="submit" style={{ flex: 1, background: '#10b981', color: 'white', padding: '8px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save</button>
                    <button type="button" onClick={() => setEditingBranchId(null)} style={{ flex: 1, background: '#94a3b8', color: 'white', padding: '8px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}><Building size={18} color="#3b82f6"/> {b.name}</strong>
                    <div style={{ color: '#64748b', fontSize: '13px', marginTop: '5px', display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                       <MapPin size={14} style={{ marginTop: '2px', minWidth: '14px' }}/> {b.address}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
                    <button type="button" onClick={() => startEditingBranch(b)} style={{ flex: 1, background: 'none', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '6px', color: '#475569', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', fontSize: '13px' }}><Edit size={14}/> Edit</button>
                    <button type="button" onClick={() => handleDeleteBranch(b.id)} style={{ flex: 1, background: '#fef2f2', border: '1px solid #fecaca', padding: '8px', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', fontSize: '13px' }}><Trash2 size={14}/> Delete</button>
                  </div>

                  {/* 🚨 THE TELEPORT BUTTON */}
                  <button 
                    onClick={() => enterBranchWorkspace(b.id)} 
                    style={{ width: '100%', marginTop: '10px', background: '#3b82f6', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px', transition: 'background 0.2s' }}
                  >
                    View Branch Data <ExternalLink size={16}/>
                  </button>
                </>
              )}
            </div>
          ))}
          {branches.length === 0 && <p style={{ color: '#64748b', gridColumn: '1/-1', textAlign: 'center', padding: '20px' }}>No branches found. Register one above!</p>}
        </div>
      </div>
    </div>
  );
}
export default BranchManagement;
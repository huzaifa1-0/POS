import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Users, PlusCircle, Edit, X } from 'lucide-react'; // Added Edit and X icons

const BASE_URL = 'http://127.0.0.1:8000/api';

const Vendors = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    payment_method: 'Cash',
    payment_account: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null); // NEW: Tracks which vendor we are editing

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/vendors/`);
      setVendors(res.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // NEW: Triggers when you click the Edit button in the table
  const handleEditClick = (vendor) => {
    setFormData({
      name: vendor.name,
      address: vendor.address || '',
      payment_method: vendor.payment_method || 'Cash',
      payment_account: vendor.payment_account || ''
    });
    setEditingId(vendor.id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scrolls up to the form
  };

  // NEW: Cancels edit mode and clears the form
  const handleCancelEdit = () => {
    setFormData({ name: '', address: '', payment_method: 'Cash', payment_account: '' });
    setEditingId(null);
  };

  // UPDATED: Now handles BOTH saving new vendors and updating existing ones
  const handleSubmitVendor = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        // If we are editing, send a PUT request to update
        await axios.put(`${BASE_URL}/vendors/${editingId}/`, formData);
        alert("Vendor updated successfully!");
        setEditingId(null); // Exit edit mode
      } else {
        // If we are NOT editing, send a POST request to create
        await axios.post(`${BASE_URL}/vendors/`, formData);
        alert("Vendor added successfully!");
      }
      
      // Reset form on success
      setFormData({ name: '', address: '', payment_method: 'Cash', payment_account: '' });
      fetchVendors();
    } catch (error) {
      console.error("Error saving vendor:", error);
      alert(editingId ? "Failed to update vendor." : "Failed to add vendor. A vendor with this name might already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVendor = async (id, name) => {
    if (window.confirm(`WARNING: Are you sure you want to delete ${name}? This will also delete ALL stock history associated with this vendor!`)) {
      try {
        await axios.delete(`${BASE_URL}/vendors/${id}/`);
        // If we delete the vendor we are currently editing, cancel edit mode
        if (editingId === id) handleCancelEdit();
        fetchVendors();
      } catch (error) {
        console.error("Error deleting vendor:", error);
        alert("Failed to delete vendor.");
      }
    }
  };

  return (
    <div className="inv-page-container">
      <div className="inv-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate('/inventory')} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
            <ArrowLeft size={20} color="#475569" />
          </button>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} color="#3b82f6" /> Manage Vendors
          </h2>
        </div>
      </div>

      {/* Add / Edit Vendor Form */}
      <div className="manage-form-container" style={{ background: editingId ? '#f0fdf4' : '#fff', padding: '20px', borderRadius: '12px', border: editingId ? '2px solid #22c55e' : '1px solid #e2e8f0', marginBottom: '25px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', transition: 'all 0.3s ease' }}>
        <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: editingId ? '#16a34a' : '#0ea5e9' }}>
          {editingId ? <Edit size={20}/> : <PlusCircle size={20}/>} 
          {editingId ? 'Edit Vendor Details' : 'Add New Vendor'}
        </h3>
        
        <form onSubmit={handleSubmitVendor} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
              <label className="form-label">Vendor Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleFormChange} required placeholder="e.g. Ali Traders" className="form-input" />
            </div>

            <div className="form-group" style={{ flex: '1.5', minWidth: '250px', marginBottom: 0 }}>
              <label className="form-label">Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleFormChange} placeholder="e.g. Shop #12, Main Market" className="form-input" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
              <label className="form-label">Payment Method</label>
              <select name="payment_method" value={formData.payment_method} onChange={handleFormChange} className="form-input">
                <option value="Cash">Cash</option>
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="Bank Account">Bank Account</option>
              </select>
            </div>

            <div className="form-group" style={{ flex: '1.5', minWidth: '250px', marginBottom: 0 }}>
              <label className="form-label">Account Details (Phone/IBAN)</label>
              <input type="text" name="payment_account" value={formData.payment_account} onChange={handleFormChange} placeholder="e.g. 0300-1234567 or PK34MEZN..." className="form-input" />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={isSubmitting} style={{ padding: '0 20px', height: '42px', background: editingId ? '#3b82f6' : '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={18}/> {isSubmitting ? 'Saving...' : (editingId ? 'Update Vendor' : 'Save Vendor')}
              </button>
              
              {/* Show Cancel button only when in Edit Mode */}
              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={{ padding: '0 15px', height: '42px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <X size={18}/> Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Vendors List */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#475569' }}>Registered Vendors List</h3>
        <div className="table-responsive-wrapper">
          <table className="custom-data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px' }}>ID</th>
                <th style={{ padding: '12px' }}>Vendor Name</th>
                <th style={{ padding: '12px' }}>Address</th>
                <th style={{ padding: '12px' }}>Payment Info</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} style={{ borderBottom: '1px solid #f1f5f9', background: editingId === vendor.id ? '#f0fdf4' : 'transparent' }}>
                  <td style={{ padding: '12px', color: '#64748b' }}>#{vendor.id}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{vendor.name}</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{vendor.address || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontWeight: '500', color: '#0ea5e9' }}>{vendor.payment_method}</span>
                    {vendor.payment_account && <div style={{ fontSize: '12px', color: '#64748b' }}>{vendor.payment_account}</div>}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      {/* NEW Edit Button */}
                      <button onClick={() => handleEditClick(vendor)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }} title="Edit Vendor">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteVendor(vendor.id, vendor.name)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete Vendor">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {vendors.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No vendors registered yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Vendors;
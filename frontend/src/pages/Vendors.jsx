import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Users, PlusCircle, Edit, X } from 'lucide-react';

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
  const [editingId, setEditingId] = useState(null);

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
    const { name, value } = e.target;
    // If the user switches back to Cash, clear the hidden account field
    if (name === 'payment_method' && value === 'Cash') {
      setFormData({ ...formData, [name]: value, payment_account: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleEditClick = (vendor) => {
    setFormData({
      name: vendor.name,
      address: vendor.address || '',
      payment_method: vendor.payment_method || 'Cash',
      payment_account: vendor.payment_account || ''
    });
    setEditingId(vendor.id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleCancelEdit = () => {
    setFormData({ name: '', address: '', payment_method: 'Cash', payment_account: '' });
    setEditingId(null);
  };

  const handleSubmitVendor = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/vendors/${editingId}/`, formData);
        alert("Vendor updated successfully!");
        setEditingId(null); 
      } else {
        await axios.post(`${BASE_URL}/vendors/`, formData);
        alert("Vendor added successfully!");
      }
      
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

      {/* Add / Edit Vendor Form - ADJUSTED FOR MOBILE COMPACTNESS */}
      <div className="manage-form-container" style={{ background: editingId ? '#f0fdf4' : '#fff', padding: '15px', borderRadius: '12px', border: editingId ? '2px solid #22c55e' : '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', transition: 'all 0.3s ease' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: editingId ? '#16a34a' : '#0ea5e9' }}>
          {editingId ? <Edit size={18}/> : <PlusCircle size={18}/>} 
          {editingId ? 'Edit Vendor Details' : 'Add New Vendor'}
        </h3>
        
        {/* Reduced gaps and minWidths so they fit better on mobile screens */}
        <form onSubmit={handleSubmitVendor} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1', minWidth: '140px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '13px' }}>Vendor Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleFormChange} required placeholder="e.g. Ali Traders" className="form-input" style={{ padding: '8px', fontSize: '14px' }} />
            </div>

            <div className="form-group" style={{ flex: '1.5', minWidth: '160px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '13px' }}>Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleFormChange} placeholder="e.g. Main Market" className="form-input" style={{ padding: '8px', fontSize: '14px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1', minWidth: '140px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '13px' }}>Payment Method</label>
              <select name="payment_method" value={formData.payment_method} onChange={handleFormChange} className="form-input" style={{ padding: '8px', fontSize: '14px' }}>
                <option value="Cash">Cash</option>
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="Bank Account">Bank</option>
              </select>
            </div>

            {/* ONLY SHOW THIS IF PAYMENT METHOD IS NOT CASH */}
            {formData.payment_method !== 'Cash' && (
              <div className="form-group" style={{ flex: '1.5', minWidth: '160px', marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '13px' }}>Account Details</label>
                <input type="text" name="payment_account" value={formData.payment_account} onChange={handleFormChange} placeholder="Phone or IBAN" className="form-input" style={{ padding: '8px', fontSize: '14px' }} required />
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
              <button type="submit" disabled={isSubmitting} style={{ padding: '0 15px', height: '36px', background: editingId ? '#3b82f6' : '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                <Save size={16}/> {isSubmitting ? 'Saving...' : (editingId ? 'Update' : 'Save')}
              </button>
              
              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={{ padding: '0 10px', height: '36px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                  <X size={16}/> Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Vendors List - ADDED SCROLLING HERE */}
      <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#475569', fontSize: '16px' }}>Registered Vendors List</h3>
        
        {/* This wrapper limits the height and adds the vertical scrollbar */}
        <div className="table-responsive-wrapper" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
          <table className="custom-data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc' }}>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '10px' }}>ID</th>
                <th style={{ padding: '10px' }}>Vendor Name</th>
                <th style={{ padding: '10px' }}>Address</th>
                <th style={{ padding: '10px' }}>Payment Info</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} style={{ borderBottom: '1px solid #f1f5f9', background: editingId === vendor.id ? '#f0fdf4' : 'transparent' }}>
                  <td style={{ padding: '10px', color: '#64748b', fontSize: '13px' }}>#{vendor.id}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#334155', fontSize: '13px' }}>{vendor.name}</td>
                  <td style={{ padding: '10px', color: '#64748b', fontSize: '13px' }}>{vendor.address || '-'}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ fontWeight: '500', color: '#0ea5e9', fontSize: '13px' }}>{vendor.payment_method}</span>
                    {vendor.payment_account && <div style={{ fontSize: '11px', color: '#64748b' }}>{vendor.payment_account}</div>}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => handleEditClick(vendor)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }} title="Edit Vendor">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteVendor(vendor.id, vendor.name)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete Vendor">
                        <Trash2 size={16} />
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
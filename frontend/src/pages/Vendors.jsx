import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Users, PlusCircle } from 'lucide-react';

const BASE_URL = 'http://127.0.0.1:8000/api';

const Vendors = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [vendorName, setVendorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddVendor = async (e) => {
    e.preventDefault();
    if (!vendorName.trim()) return;
    setIsSubmitting(true);
    
    try {
      await axios.post(`${BASE_URL}/vendors/`, { name: vendorName.trim() });
      setVendorName('');
      fetchVendors();
      alert("Vendor added successfully!");
    } catch (error) {
      console.error("Error adding vendor:", error);
      alert("Failed to add vendor. It might already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVendor = async (id, name) => {
    if (window.confirm(`WARNING: Are you sure you want to delete ${name}? This will also delete ALL stock history associated with this vendor!`)) {
      try {
        await axios.delete(`${BASE_URL}/vendors/${id}/`);
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

      {/* Add Vendor Form */}
      <div className="manage-form-container" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0ea5e9' }}>
          <PlusCircle size={20}/> Add New Vendor
        </h3>
        <form onSubmit={handleAddVendor} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '250px', marginBottom: 0 }}>
            <label className="form-label">Vendor Name</label>
            <input 
              type="text" 
              value={vendorName} 
              onChange={(e) => setVendorName(e.target.value)} 
              required 
              placeholder="e.g. Ali Traders" 
              className="form-input" 
            />
          </div>
          <button type="submit" disabled={isSubmitting} style={{ padding: '0 20px', height: '42px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={18}/> {isSubmitting ? 'Saving...' : 'Save Vendor'}
          </button>
        </form>
      </div>

      {/* Vendors List */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#475569' }}>Registered Vendors List</h3>
        <div className="table-responsive-wrapper">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vendor Name</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td style={{ color: '#64748b' }}>#{vendor.id}</td>
                  <td style={{ fontWeight: 'bold', color: '#334155' }}>{vendor.name}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => handleDeleteVendor(vendor.id, vendor.name)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete Vendor">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {vendors.length === 0 && (
                <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No vendors registered yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Vendors;
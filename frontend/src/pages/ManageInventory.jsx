import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Edit2, X, PlusCircle, Search } from 'lucide-react';

const BASE_URL = 'http://127.0.0.1:8000/api';

const ManageInventory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  
  // States for Adding
  const [formData, setFormData] = useState({ itemName: '', vendorName: '', qty: '', unit: 'KG', price: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for Editing
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ itemName: '', vendorName: '', qty: '', unit: 'KG', price: '' });

  // State for Searching History
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, vendorsRes, stockRes] = await Promise.all([
        axios.get(`${BASE_URL}/items/`),
        axios.get(`${BASE_URL}/vendors/`),
        axios.get(`${BASE_URL}/stock-entries/`)
      ]);
      setItems(itemsRes.data);
      setVendors(vendorsRes.data);
      setStockEntries(stockRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // --- ADD STOCK LOGIC ---
  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddStock = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let selectedItem = items.find(i => i.name.toLowerCase() === formData.itemName.trim().toLowerCase());
      if (!selectedItem) {
        const itemRes = await axios.post(`${BASE_URL}/items/`, { name: formData.itemName.trim(), unit: formData.unit });
        selectedItem = itemRes.data;
      }

      let selectedVendor = vendors.find(v => v.name.toLowerCase() === formData.vendorName.trim().toLowerCase());
      if (!selectedVendor) {
        const vendorRes = await axios.post(`${BASE_URL}/vendors/`, { name: formData.vendorName.trim() });
        selectedVendor = vendorRes.data;
      }

      await axios.post(`${BASE_URL}/stock-entries/`, {
        item_id: selectedItem.id, vendor_id: selectedVendor.id, quantity: formData.qty, price: formData.price
      });

      alert("Stock entry added successfully!");
      setFormData({ itemName: '', vendorName: '', qty: '', unit: 'KG', price: '' });
      fetchData(); 
    } catch (error) {
      console.error("Error saving stock:", error);
      alert("Failed to add stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- EDIT & DELETE LOGIC ---
  const handleEditClick = (entry) => {
    setEditingId(entry.id);
    setEditFormData({
      itemName: entry.item?.name || '',
      vendorName: entry.vendor?.name || '',
      qty: entry.quantity,
      unit: entry.item?.unit || 'KG',
      price: entry.price
    });
  };

  const handleEditChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

  const handleSaveEdit = async (id) => {
    try {
      let selectedItem = items.find(i => i.name.toLowerCase() === editFormData.itemName.trim().toLowerCase());
      if (!selectedItem) {
        const itemRes = await axios.post(`${BASE_URL}/items/`, { name: editFormData.itemName.trim(), unit: editFormData.unit });
        selectedItem = itemRes.data;
      }

      let selectedVendor = vendors.find(v => v.name.toLowerCase() === editFormData.vendorName.trim().toLowerCase());
      if (!selectedVendor) {
        const vendorRes = await axios.post(`${BASE_URL}/vendors/`, { name: editFormData.vendorName.trim() });
        selectedVendor = vendorRes.data;
      }

      await axios.put(`${BASE_URL}/stock-entries/${id}/`, {
        item_id: selectedItem.id,
        vendor_id: selectedVendor.id,
        quantity: editFormData.qty,
        price: editFormData.price
      });

      setEditingId(null);
      fetchData();
      alert("Entry updated successfully!");
    } catch (error) {
      console.error("Error updating entry:", error);
      alert("Failed to update entry.");
    }
  };

  const handleDeleteEntry = async (id) => {
    if (window.confirm("Are you sure you want to delete this specific stock entry record?")) {
      try {
        await axios.delete(`${BASE_URL}/stock-entries/${id}/`);
        fetchData();
      } catch (error) {
        console.error("Error deleting entry:", error);
      }
    }
  };

  // Filter entries based on search term
  const filteredEntries = stockEntries.filter(entry => {
    const searchLower = searchTerm.toLowerCase();
    const itemName = entry.item?.name?.toLowerCase() || '';
    const vendorName = entry.vendor?.name?.toLowerCase() || '';
    return itemName.includes(searchLower) || vendorName.includes(searchLower);
  });

  return (
    <div className="inv-page-container">
      
      <div className="inv-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate('/inventory')} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
            <ArrowLeft size={20} color="#475569" />
          </button>
          <h2 style={{ margin: 0, color: '#1e293b' }}>Manage & Add Stock</h2>
        </div>
      </div>

      {/* TOP SECTION: Add Stock Form */}
      <div className="manage-form-container" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0ea5e9' }}>
          <PlusCircle size={20}/> New Stock Entry
        </h3>
        
        <form onSubmit={handleAddStock} className="horizontal-form-row">
          <div className="form-group">
            <label className="form-label">Item Name</label>
            <input list="items-list" name="itemName" value={formData.itemName} onChange={handleFormChange} required placeholder="e.g. Flour" className="form-input" />
            <datalist id="items-list">{items.map(i => <option key={i.id} value={i.name} />)}</datalist>
          </div>

          <div className="form-group">
            <label className="form-label">Vendor Name</label>
            <input list="vendors-list" name="vendorName" value={formData.vendorName} onChange={handleFormChange} required placeholder="e.g. Huzaifa" className="form-input" />
            <datalist id="vendors-list">{vendors.map(v => <option key={v.id} value={v.name} />)}</datalist>
          </div>

          <div className="form-group" style={{ flex: '0.5' }}>
            <label className="form-label">Qty</label>
            <input type="number" name="qty" min="0" step="0.01" value={formData.qty} onChange={handleFormChange} required placeholder="0" className="form-input" />
          </div>

          <div className="form-group" style={{ flex: '0.5' }}>
            <label className="form-label">Unit</label>
            <select name="unit" value={formData.unit} onChange={handleFormChange} className="form-select">
              <option value="KG">KG</option><option value="Litre">Litre</option><option value="Dozen">Dozen</option><option value="Pcs">Pcs</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Price (PKR)</label>
            <input type="number" name="price" min="0" step="0.01" value={formData.price} onChange={handleFormChange} required placeholder="0" className="form-input" />
          </div>

          <button type="submit" className="submit-btn-mobile" disabled={isSubmitting} style={{ padding: '10px 20px', height: '42px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={18}/> {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>

      {/* BOTTOM SECTION: Full Width Table */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        
        {/* NEW HEADER WITH SEARCH BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ margin: '0', color: '#475569' }}>Recent Stock Entries (History)</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', maxWidth: '300px' }}>
            <Search size={16} color="#94a3b8" style={{ marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '14px' }}
            />
          </div>
        </div>
        
        <div className="table-responsive-wrapper">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Vendor</th>
                <th>Quantity</th>
                <th>Price</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Map over filteredEntries instead of stockEntries */}
              {filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.created_at).toLocaleDateString()}</td>
                  
                  {editingId === entry.id ? (
                    <>
                      <td><input type="text" name="itemName" value={editFormData.itemName} onChange={handleEditChange} className="edit-table-input" /></td>
                      <td><input type="text" name="vendorName" value={editFormData.vendorName} onChange={handleEditChange} className="edit-table-input" /></td>
                      <td style={{ display: 'flex', gap: '5px' }}>
                        <input type="number" name="qty" value={editFormData.qty} onChange={handleEditChange} className="edit-table-input" style={{ width: '60px' }} />
                        <select name="unit" value={editFormData.unit} onChange={handleEditChange} className="edit-table-input" style={{ width: '70px', padding: '8px 2px' }}>
                          <option value="KG">KG</option><option value="Litre">Litre</option><option value="Dozen">Dozen</option><option value="Pcs">Pcs</option>
                        </select>
                      </td>
                      <td><input type="number" name="price" value={editFormData.price} onChange={handleEditChange} className="edit-table-input" style={{ width: '80px' }} /></td>
                      <td>
                        {/* EDIT MODE BUTTONS */}
                        <div className="action-buttons-wrapper">
                          <button onClick={() => handleSaveEdit(entry.id)} style={{ background: '#10b981', border: 'none', color: '#fff', padding: '6px', borderRadius: '4px', cursor: 'pointer' }} title="Save"><Save size={16} /></button>
                          <button onClick={() => setEditingId(null)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '6px', borderRadius: '4px', cursor: 'pointer' }} title="Cancel"><X size={16} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ fontWeight: 'bold' }}>{entry.item?.name}</td>
                      <td>{entry.vendor?.name}</td>
                      <td style={{ color: '#0ea5e9', fontWeight: 'bold' }}>{entry.quantity} {entry.item?.unit}</td>
                      <td>PKR {entry.price}</td>
                      <td>
                        {/* DISPLAY MODE BUTTONS */}
                        <div className="action-buttons-wrapper">
                          <button onClick={() => handleEditClick(entry)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }} title="Edit"><Edit2 size={18} /></button>
                          <button onClick={() => handleDeleteEntry(entry.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No stock history found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageInventory;
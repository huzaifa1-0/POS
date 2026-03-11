import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, PlusCircle, Search } from 'lucide-react';

const BASE_URL = 'http://127.0.0.1:8000/api';

const ManageInventory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  
  const [formData, setFormData] = useState({ itemName: '', vendorName: '', qty: '', unit: 'KG', price: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 1. Find or Create Item
      let selectedItem = items.find(i => i.name.toLowerCase() === formData.itemName.trim().toLowerCase());
      if (!selectedItem) {
        const itemRes = await axios.post(`${BASE_URL}/items/`, { name: formData.itemName.trim(), unit: formData.unit });
        selectedItem = itemRes.data;
      }

      // 2. Find or Create Vendor
      let selectedVendor = vendors.find(v => v.name.toLowerCase() === formData.vendorName.trim().toLowerCase());
      if (!selectedVendor) {
        const vendorRes = await axios.post(`${BASE_URL}/vendors/`, { name: formData.vendorName.trim() });
        selectedVendor = vendorRes.data;
      }

      // 3. Create Stock Entry Transaction
      await axios.post(`${BASE_URL}/stock-entries/`, {
        item_id: selectedItem.id,
        vendor_id: selectedVendor.id,
        quantity: formData.qty,
        price: formData.price
      });

      alert("Stock entry added successfully!");
      setFormData({ itemName: '', vendorName: '', qty: '', unit: 'KG', price: '' });
      fetchData(); // Refresh the history list
    } catch (error) {
      console.error("Error saving stock:", error);
      alert("Failed to add stock. Please check the network tab.");
    } finally {
      setIsSubmitting(false);
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

  return (
    <div style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <button onClick={() => navigate('/inventory')} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
          <ArrowLeft size={20} color="#475569" />
        </button>
        <h2 style={{ margin: 0, color: '#1e293b' }}>Manage & Add Stock</h2>
      </div>

      {/* ADD STOCK FORM */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#0ea5e9' }}>
          <PlusCircle size={20}/> New Stock Entry
        </h3>
        
        <form onSubmit={handleAddStock} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Item Name</label>
            <input list="items-list" name="itemName" value={formData.itemName} onChange={handleFormChange} required placeholder="e.g. Flour" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            <datalist id="items-list">{items.map(i => <option key={i.id} value={i.name} />)}</datalist>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Vendor Name</label>
            <input list="vendors-list" name="vendorName" value={formData.vendorName} onChange={handleFormChange} required placeholder="e.g. Huzaifa" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            <datalist id="vendors-list">{vendors.map(v => <option key={v.id} value={v.name} />)}</datalist>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '80px' }}>
            <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Unit</label>
            <select name="unit" value={formData.unit} onChange={handleFormChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="KG">KG</option><option value="Litre">Litre</option><option value="Dozen">Dozen</option><option value="Pcs">Pcs</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100px' }}>
            <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Quantity</label>
            <input type="number" name="qty" min="0" step="0.01" value={formData.qty} onChange={handleFormChange} required placeholder="0" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '120px' }}>
            <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Price (Per Unit)</label>
            <input type="number" name="price" min="0" step="0.01" value={formData.price} onChange={handleFormChange} required placeholder="PKR 0" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>

          <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', height: '42px' }}>
            <Save size={18}/> {isSubmitting ? 'Saving...' : 'Save Stock'}
          </button>
        </form>
      </div>

      {/* STOCK HISTORY TABLE */}
      <h3 style={{ color: '#475569', marginBottom: '10px' }}>Recent Stock Entries (History)</h3>
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '14px' }}>Date</th>
              <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '14px' }}>Item</th>
              <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '14px' }}>Vendor</th>
              <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '14px' }}>Quantity</th>
              <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '14px' }}>Price</th>
              <th style={{ padding: '12px 15px', color: '#64748b', fontSize: '14px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {stockEntries.map((entry) => (
              <tr key={entry.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 15px', fontSize: '14px' }}>{new Date(entry.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{entry.item?.name}</td>
                <td style={{ padding: '12px 15px' }}>{entry.vendor?.name}</td>
                <td style={{ padding: '12px 15px', color: '#0ea5e9', fontWeight: 'bold' }}>{entry.quantity} {entry.item?.unit}</td>
                <td style={{ padding: '12px 15px' }}>PKR {entry.price}</td>
                <td style={{ padding: '12px 15px' }}>
                  <button onClick={() => handleDeleteEntry(entry.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {stockEntries.length === 0 && (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No stock history found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default ManageInventory;
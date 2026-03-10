import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Edit2, X } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api/inventory/';

const ManageInventory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', qty: 0, unit: 'KG', price: 0 });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get(API_URL);
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditFormData({ name: item.name, qty: item.qty, unit: item.unit, price: item.price });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  // Saves the edited item back to Django
  const handleSaveEdit = async (id) => {
    try {
      await axios.put(`${API_URL}${id}/`, editFormData);
      setEditingId(null);
      fetchInventory(); // Refresh the list to show updated data
      alert("Item updated successfully!");
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item.");
    }
  };

  // Deletes the item from Django
  const handleDeleteItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await axios.delete(`${API_URL}${id}/`);
        fetchInventory(); // Refresh the list
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  return (
    <div style={{ flex: 1, padding: '20px', background: '#f8fafc', height: '100%', overflowY: 'auto' }}>
      
      {/* Header with Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <button 
          onClick={() => navigate('/inventory')}
          style={{ background: 'white', border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}
        >
          <ArrowLeft size={20} color="#475569" />
        </button>
        <h2 style={{ margin: 0, color: '#1e293b' }}>Manage & Edit Inventory</h2>
      </div>

      {/* List of Items for Editing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item) => (
          <div key={item.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {editingId === item.id ? (
              // --- EDIT MODE UI ---
              <div style={{ display: 'flex', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
                <input type="text" name="name" value={editFormData.name} onChange={handleFormChange} placeholder="Name" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                <input type="number" name="price" value={editFormData.price} onChange={handleFormChange} placeholder="Price" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100px' }} />
                <input type="number" name="qty" value={editFormData.qty} onChange={handleFormChange} placeholder="Qty" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '80px' }} />
                <select name="unit" value={editFormData.unit} onChange={handleFormChange} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  <option value="KG">KG</option>
                  <option value="Litre">Litre</option>
                  <option value="Dozen">Dozen</option>
                  <option value="Pcs">Pcs</option>
                </select>
                
                <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
                  <button onClick={() => handleSaveEdit(item.id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Save size={16}/> Save</button>
                  <button onClick={handleCancelEdit} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><X size={16}/> Cancel</button>
                </div>
              </div>
            ) : (
              // --- DISPLAY MODE UI ---
              <>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '16px', color: '#1e293b' }}>{item.name}</strong>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>PKR {item.price} • {item.qty} {item.unit} in stock</span>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleEditClick(item)} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}><Edit2 size={18}/></button>
                  <button onClick={() => handleDeleteItem(item.id)} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={18}/></button>
                </div>
              </>
            )}

          </div>
        ))}
        {items.length === 0 && <p style={{ textAlign: 'center', color: '#64748b' }}>No inventory items found.</p>}
      </div>
    </div>
  );
};

export default ManageInventory;
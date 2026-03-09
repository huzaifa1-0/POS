import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, X, Wallet, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';

const Inventory = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', qty: '', unit: 'KG', price: '' });

  // Get your backend URL and auth token (if you use token auth)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
  const token = localStorage.getItem('access_token');
  
  // Headers for API calls
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // 1. FETCH INVENTORY FROM DATABASE ON LOAD
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory/`, config);
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  // Automatically calculate total value directly from database items
  const totalInventoryValue = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);
  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // 2. SAVE NEW ITEM TO DATABASE
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.qty || !newItem.price) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/inventory/`, newItem, config);
      setItems([response.data, ...items]); // Add new item to the top of the list
      setNewItem({ name: '', qty: '', unit: 'KG', price: '' });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding inventory item:", error);
      alert("Failed to save item to database.");
    }
  };

  // 3. UPDATE EXISTING ITEM IN DATABASE
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_BASE_URL}/inventory/${editingItem.id}/`, editingItem, config);
      setItems(items.map(item => item.id === editingItem.id ? response.data : item));
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      alert("Failed to update item in database.");
    }
  };

  // 4. DELETE ITEM FROM DATABASE
  const handleDeleteItem = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this stock item?")) {
      try {
        await axios.delete(`${API_BASE_URL}/inventory/${id}/`, config);
        setItems(items.filter(item => item.id !== id));
      } catch (error) {
        console.error("Error deleting inventory item:", error);
        alert("Failed to delete item from database.");
      }
    }
  };

  return (
    <div style={{ flex: 1, padding: '20px', background: '#f8fafc', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <Package size={28} color="#ff6b6b" />
        <h2 style={{ margin: 0, color: '#1e293b' }}>Stock Inventory</h2>
      </div>

      <div className="inventory-summary-card">
        <div className="summary-icon"><Wallet size={28} color="#fff"/></div>
        <div>
          <p>Total Inventory Value</p>
          <h3>PKR {totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
        </div>
      </div>

      <div className="inventory-actions-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search stock..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="inventory-search-input" />
        </div>
        <button className="add-stock-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Add Stock
        </button>
      </div>

      <div className="inventory-list">
        {filteredItems.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', marginTop: '20px' }}>No items found in database.</p>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="inventory-item-card">
              <div className="item-info">
                <h4>{item.name}</h4>
                <span className="item-price">PKR {Number(item.price).toFixed(2)} / {item.unit}</span>
              </div>
              <div className="item-right-section">
                <div className="item-qty-badge">
                  <span className="qty-number">{Number(item.qty)}</span>
                  <span className="qty-unit">{item.unit}</span>
                </div>
                <div className="item-action-buttons">
                  <button className="action-icon-btn edit-btn" onClick={() => setEditingItem(item)} title="Edit Item"><Edit2 size={16} /></button>
                  <button className="action-icon-btn delete-btn" onClick={() => handleDeleteItem(item.id)} title="Delete Item"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content inventory-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20}/> Add New Stock</h3>
              <button className="modal-close-icon" onClick={() => setShowAddModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleAddItem} className="inventory-form">
              <div>
                <label>Item Name</label>
                <input type="text" placeholder="e.g., Sugar, Eggs" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
              </div>
              <div className="form-row">
                <div>
                  <label>Quantity</label>
                  <input type="number" step="0.01" placeholder="0" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: e.target.value})} required />
                </div>
                <div>
                  <label>Unit Type</label>
                  <select value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})}>
                    <option value="KG">Kilogram (KG)</option>
                    <option value="Litre">Litre (L)</option>
                    <option value="Dozen">Dozen</option>
                    <option value="Pcs">Pieces (Pcs)</option>
                    <option value="Pack">Packet</option>
                  </select>
                </div>
              </div>
              <div>
                <label>Price Per Unit (PKR)</label>
                <input type="number" step="0.01" placeholder="e.g., 150" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required />
              </div>
              <button type="submit" className="save-inventory-btn">Save Item to Database</button>
            </form>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="modal-content inventory-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Edit2 size={20}/> Edit Stock</h3>
              <button className="modal-close-icon" onClick={() => setEditingItem(null)}><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdateItem} className="inventory-form">
              <div>
                <label>Item Name</label>
                <input type="text" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required />
              </div>
              <div className="form-row">
                <div>
                  <label>Quantity</label>
                  <input type="number" step="0.01" value={editingItem.qty} onChange={e => setEditingItem({...editingItem, qty: e.target.value})} required />
                </div>
                <div>
                  <label>Unit Type</label>
                  <select value={editingItem.unit} onChange={e => setEditingItem({...editingItem, unit: e.target.value})}>
                    <option value="KG">Kilogram (KG)</option>
                    <option value="Litre">Litre (L)</option>
                    <option value="Dozen">Dozen</option>
                    <option value="Pcs">Pieces (Pcs)</option>
                    <option value="Pack">Packet</option>
                  </select>
                </div>
              </div>
              <div>
                <label>Price Per Unit (PKR)</label>
                <input type="number" step="0.01" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: e.target.value})} required />
              </div>
              <button type="submit" className="save-inventory-btn" style={{ background: '#3b82f6', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}>Update in Database</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
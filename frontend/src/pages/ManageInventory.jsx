import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Edit2, X, Search } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api/inventory/';

const ManageInventory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleSaveEdit = async (id) => {
    try {
      await axios.put(`${API_URL}${id}/`, editFormData);
      setEditingId(null);
      fetchInventory();
      alert("Item updated successfully!");
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item.");
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await axios.delete(`${API_URL}${id}/`);
        fetchInventory();
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="manage-inv-container">
      
      {/* Header Area */}
      <div className="manage-inv-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="back-btn" onClick={() => navigate('/inventory')}>
            <ArrowLeft size={20} />
          </button>
          <h2>Manage Inventory</h2>
        </div>
        
        {/* Added a Search Bar for easier editing! */}
        <div className="search-bar-container" style={{ margin: 0, maxWidth: '250px' }}>
          <Search size={18} className="search-icon-inside" />
          <input 
            type="text" placeholder="Search items to edit..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="inventory-search-input"
          />
        </div>
      </div>

      {/* Item List Area */}
      <div className="manage-inv-list">
        {filteredItems.map((item) => (
          <div key={item.id} className={`manage-inv-card ${editingId === item.id ? 'editing' : ''}`}>
            
            {editingId === item.id ? (
              // --- EDIT MODE UI (Clean Grid) ---
              <div className="manage-inv-edit-form">
                <div className="edit-inputs-grid">
                  <div className="edit-field">
                    <label>Item Name</label>
                    <input type="text" name="name" value={editFormData.name} onChange={handleFormChange} />
                  </div>
                  <div className="edit-field-row">
                    <div className="edit-field">
                      <label>Price (PKR)</label>
                      <input type="number" name="price" value={editFormData.price} onChange={handleFormChange} />
                    </div>
                    <div className="edit-field">
                      <label>Quantity</label>
                      <input type="number" name="qty" value={editFormData.qty} onChange={handleFormChange} />
                    </div>
                    <div className="edit-field">
                      <label>Unit</label>
                      <select name="unit" value={editFormData.unit} onChange={handleFormChange}>
                        <option value="KG">KG</option>
                        <option value="Litre">Litre</option>
                        <option value="Dozen">Dozen</option>
                        <option value="Pcs">Pcs</option>
                        <option value="Pack">Pack</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="edit-actions">
                  <button className="btn-cancel-edit" onClick={handleCancelEdit}><X size={16}/> Cancel</button>
                  <button className="btn-save-edit" onClick={() => handleSaveEdit(item.id)}><Save size={16}/> Save</button>
                </div>
              </div>
            ) : (
              // --- DISPLAY MODE UI (Sleek Card) ---
              <div className="manage-inv-display">
                <div className="manage-inv-info">
                  <h3 className="inv-item-name">{item.name}</h3>
                  <div className="inv-item-details">
                    <span className="inv-price-badge">PKR {item.price}</span>
                    <span className="inv-qty-badge">{item.qty} {item.unit} in stock</span>
                  </div>
                </div>
                
                <div className="manage-inv-actions">
                  <button className="btn-icon-edit" onClick={() => handleEditClick(item)}><Edit2 size={18}/></button>
                  <button className="btn-icon-delete" onClick={() => handleDeleteItem(item.id)}><Trash2 size={18}/></button>
                </div>
              </div>
            )}

          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="empty-state">No inventory items found.</div>
        )}
      </div>

    </div>
  );
};

export default ManageInventory;
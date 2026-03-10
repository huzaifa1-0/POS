import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Edit2, X, Search, DollarSign } from 'lucide-react';

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
      
      <div className="manage-inv-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="back-btn" onClick={() => navigate('/inventory')}>
            <ArrowLeft size={20} />
          </button>
          <h2>Manage Inventory</h2>
        </div>
        
        <div className="search-bar-container" style={{ margin: 0, maxWidth: '250px' }}>
          <Search size={18} className="search-icon-inside" />
          <input 
            type="text" placeholder="Search items..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="inventory-search-input"
          />
        </div>
      </div>

      <div className="manage-inv-list">
        {filteredItems.map((item) => (
          <div key={item.id} className={`manage-inv-card ${editingId === item.id ? 'editing' : ''}`}>
            
            {editingId === item.id ? (
              // --- EDIT MODE UI (Single Flat Row Structure) ---
              <div className="manage-inv-edit-form single-row-edit">
                
                <input type="text" name="name" value={editFormData.name} onChange={handleFormChange} className="name-input" placeholder="Item Name"/>
                
                <div className="compact-price-input">
                  <DollarSign size={14} className="prefix-icon"/>
                  <input type="number" name="price" value={editFormData.price} onChange={handleFormChange} className="price-input" placeholder="Price"/>
                </div>

                <input type="number" name="qty" value={editFormData.qty} onChange={handleFormChange} className="qty-input" placeholder="Qty" />
                
                <select name="unit" value={editFormData.unit} onChange={handleFormChange} className="unit-select">
                  <option value="KG">KG</option>
                  <option value="Litre">Litre</option>
                  <option value="Dozen">Dozen</option>
                  <option value="Pcs">Pcs</option>
                  <option value="Pack">Pack</option>
                </select>
                
                {/* Save/Cancel locked to the right */}
                <div className="edit-actions right-aligned-actions">
                  <button className="btn-cancel-edit" onClick={handleCancelEdit}><X size={16}/></button>
                  <button className="btn-save-edit" onClick={() => handleSaveEdit(item.id)}><Save size={16}/> <span className="mobile-hide-text">Save</span></button>
                </div>
              </div>
            ) : (
              // --- DISPLAY MODE UI (Info on Left, Actions strictly on Right) ---
              <div className="manage-inv-display">
                
                <div className="display-info-section">
                  <h3 className="inv-item-name">{item.name}</h3>
                  <div className="inv-item-details">
                    <span className="inv-price-badge">PKR {item.price}</span>
                    <span className="inv-qty-badge">{item.qty} {item.unit} in stock</span>
                  </div>
                </div>
                
                {/* Edit/Delete strictly locked to the right */}
                <div className="manage-inv-actions right-aligned-actions">
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
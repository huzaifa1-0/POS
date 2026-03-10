import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Wallet, Plus, Check, Search, Settings} from 'lucide-react';
import axios from 'axios'; // NEW: Imported Axios

// NEW: Point this to your Django API
const API_URL = 'http://127.0.0.1:8000/api/inventory/';

const Inventory = () => {
  // CHANGED: Starts empty and fetches from the database
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // NEW: Fetch items from the database when the page loads
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

  const handleAddNewRow = () => {
    // Uses a temporary negative ID so it doesn't mess with real database IDs
    const newRow = { id: -Date.now(), name: '', qty: 0, unit: 'KG', price: 0, isNew: true };
    setItems([newRow, ...items]);
    setSearchTerm(''); 
  };

  const handleUpdateField = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const finalValue = (field === 'qty' || field === 'price') ? Number(value) : value;
        return { ...item, [field]: finalValue };
      }
      return item;
    }));
  };

  // NEW: Saves the item directly to the Django database
  const handleSaveNewItem = async (id) => {
    const itemToSave = items.find(i => i.id === id);
    
    if (!itemToSave.name.trim()) {
      alert("Please enter an item name before saving.");
      return;
    }

    try {
      // Send the data to your backend
      const response = await axios.post(API_URL, {
        name: itemToSave.name,
        qty: itemToSave.qty,
        unit: itemToSave.unit,
        price: itemToSave.price
      });
      
      // Update the table with the real item returned from Django (which includes the real database ID)
      setItems(items.map(item => item.id === id ? { ...response.data, isNew: false } : item));
    } catch (error) {
      console.error("Error saving item to database:", error);
      alert("Failed to save item. Make sure your Django server is running!");
    }
  };

  const totalInventoryValue = items.reduce((sum, item) => sum + (item.qty * item.price), 0);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ flex: 1, padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      <div className="inventory-main-header">
        <div className="inventory-title-group">
          <Package size={28} color="#ff6b6b" />
          <h2>Stock Manager</h2>
        </div>
        
        <button 
          className="manage-inv-nav-btn"
          onClick={() => navigate('/manage-inventory')}
        >
          <Settings size={18} /> Manage Inventory
        </button>
      </div>

      <div className="inventory-summary-card" style={{ flexShrink: 0 }}>
        <div className="summary-icon"><Wallet size={28} color="#fff"/></div>
        <div>
          <p>Total Inventory Value</p>
          <h3>PKR {totalInventoryValue.toLocaleString()}</h3>
        </div>
      </div>

      <div className="inventory-action-header">
        <h3 style={{ margin: 0, color: '#475569' }}>Current Stock Items</h3>
        <div className="inventory-action-controls">
          
          <div className="search-bar-container">
            <Search size={18} className="search-icon-inside" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="inventory-search-input"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="add-stock-btn" onClick={handleAddNewRow}>
              <Plus size={18} /> Add New Item
            </button>
          </div>
        </div>
      </div>

      <div className="scrollable-table-container">
        <div className="fixed-inventory-list">
          
          <div className="fixed-inventory-header hide-on-mobile split-header">
            <span className="inventory-left-side">Item Details</span>
            <div className="inventory-right-side">
              <span className="col-price">Unit Price</span>
              <span className="col-qty">Quantity</span>
              <span className="col-total">Total Price</span>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
              No inventory found in database.
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="fixed-inventory-row split-row">
                
                <div className="inventory-left-side">
                  {item.isNew ? (
                    <div className="new-item-inputs">
                      <input 
                        type="text" placeholder="Item Name..." 
                        value={item.name} 
                        onChange={(e) => handleUpdateField(item.id, 'name', e.target.value)}
                        className="new-name-input"
                        autoFocus
                      />
                      <select 
                        value={item.unit} 
                        onChange={(e) => handleUpdateField(item.id, 'unit', e.target.value)}
                        className="new-unit-select"
                      >
                        <option value="KG">KG</option>
                        <option value="Litre">Litre</option>
                        <option value="Dozen">Dozen</option>
                        <option value="Pcs">Pcs</option>
                        <option value="Pack">Pack</option>
                      </select>
                      <button 
                        onClick={() => handleSaveNewItem(item.id)} 
                        className="save-new-item-btn"
                        title="Save Item"
                      >
                        <Check size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="item-details-stack">
                      <strong className="item-title">{item.name}</strong>
                      <span className="item-unit-badge">{item.unit}</span>
                    </div>
                  )}
                </div>
                
                <div className="inventory-right-side">
                  
                  <div className="col-price">
                    <label className="mobile-label">Price</label>
                    {item.isNew ? (
                      <div className="input-with-prefix">
                        <span>PKR</span>
                        <input 
                          type="number" min="0" placeholder="0"
                          value={item.price === 0 ? '' : item.price} 
                          onChange={(e) => handleUpdateField(item.id, 'price', e.target.value)}
                        />
                      </div>
                    ) : (
                      <strong className="static-val">PKR {item.price}</strong>
                    )}
                  </div>

                  <div className="col-qty">
                    <label className="mobile-label">Qty</label>
                    {item.isNew ? (
                      <div className="qty-update-wrapper">
                        <button onClick={() => handleUpdateField(item.id, 'qty', Math.max(0, item.qty - 1))}>-</button>
                        <input 
                          type="number" min="0" placeholder="0"
                          value={item.qty === 0 ? '' : item.qty} 
                          onChange={(e) => handleUpdateField(item.id, 'qty', e.target.value)}
                        />
                        <button onClick={() => handleUpdateField(item.id, 'qty', item.qty + 1)}>+</button>
                      </div>
                    ) : (
                      <strong className="static-val">{item.qty}</strong>
                    )}
                  </div>

                  <div className="col-total">
                    <label className="mobile-label">Total</label>
                    <strong className="static-total-val">PKR {(item.qty * item.price).toLocaleString()}</strong>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default Inventory;
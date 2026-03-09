import React, { useState, useEffect } from 'react';
import { Package, Wallet, Plus, Check, Search } from 'lucide-react'; // Removed Trash2 and AlertTriangle

const PRE_BUILT_STOCK = [
  { id: 1, name: 'Oil', qty: 0, unit: 'Litre', price: 600 },
  { id: 2, name: 'Flour (Atta)', qty: 0, unit: 'KG', price: 150 },
  { id: 3, name: 'Channay', qty: 0, unit: 'KG', price: 300 },
  { id: 4, name: 'Eggs', qty: 0, unit: 'Dozen', price: 400 },
  { id: 5, name: 'Milk', qty: 0, unit: 'Litre', price: 200 },
];

const Inventory = () => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('nashta_pos_inline_inventory');
    return saved ? JSON.parse(saved) : PRE_BUILT_STOCK;
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    localStorage.setItem('nashta_pos_inline_inventory', JSON.stringify(items));
  }, [items]);

  const handleAddNewRow = () => {
    const newRow = { id: Date.now(), name: '', qty: 0, unit: 'KG', price: 0, isNew: true };
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

  const handleSaveNewItem = (id, name) => {
    if (!name.trim()) {
      alert("Please enter an item name before saving.");
      return;
    }
    setItems(items.map(item => item.id === id ? { ...item, isNew: false } : item));
  };

  // --- DELETE LOGIC HAS BEEN COMPLETELY REMOVED ---

  const totalInventoryValue = items.reduce((sum, item) => sum + (item.qty * item.price), 0);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ flex: 1, padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <Package size={28} color="#ff6b6b" />
        <h2 style={{ margin: 0, color: '#1e293b' }}>Stock Manager</h2>
      </div>

      {/* Total Value Card */}
      <div className="inventory-summary-card" style={{ flexShrink: 0 }}>
        <div className="summary-icon"><Wallet size={28} color="#fff"/></div>
        <div>
          <p>Total Inventory Value</p>
          <h3>PKR {totalInventoryValue.toLocaleString()}</h3>
        </div>
      </div>

      {/* Action Bar */}
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

      {/* --- SCROLLABLE TABLE CONTAINER --- */}
      <div className="scrollable-table-container">
        <div className="fixed-inventory-list">
          
          <div className="fixed-inventory-header hide-on-mobile split-header">
            <span className="inventory-left-side">Item Details</span>
            <div className="inventory-right-side">
              <span className="col-price">Unit Price</span>
              <span className="col-qty">Quantity</span>
              <span className="col-total">Total Price</span>
              {/* Removed Actions Header */}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
              No items match your search.
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="fixed-inventory-row split-row">
                
                {/* 1. LEFT SIDE: Name & Unit */}
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
                        onClick={() => handleSaveNewItem(item.id, item.name)} 
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
                
                {/* 2. RIGHT SIDE: Inputs & Calculations */}
                <div className="inventory-right-side">
                  
                  {/* UNIT PRICE */}
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

                  {/* QUANTITY */}
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

                  {/* TOTAL */}
                  <div className="col-total">
                    <label className="mobile-label">Total</label>
                    <strong className="static-total-val">PKR {(item.qty * item.price).toLocaleString()}</strong>
                  </div>

                  {/* DELETE BUTTON SECTION COMPLETELY REMOVED */}

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
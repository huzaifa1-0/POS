import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Wallet, Plus, Check, Search, Settings, X, Truck } from 'lucide-react';
import axios from 'axios'; 

const API_URL = 'http://127.0.0.1:8000/api/inventory/';

const Inventory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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
    // NEW: Added vendor_name to the default state
    const newRow = { id: -Date.now(), name: '', vendor_name: '', qty: 0, unit: 'KG', price: 0, isNew: true };
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

  const handleSaveNewItem = async (id) => {
    const itemToSave = items.find(i => i.id === id);
    
    if (!itemToSave.name.trim()) {
      alert("Please enter an item name before saving.");
      return;
    }

    try {
      const response = await axios.post(API_URL, {
        name: itemToSave.name,
        vendor_name: itemToSave.vendor_name || 'General Vendor', // NEW: Sends vendor to Django
        qty: itemToSave.qty,
        unit: itemToSave.unit,
        price: itemToSave.price
      });
      
      // We fetch the whole inventory again so the grouping logic recalculates perfectly
      fetchInventory(); 
    } catch (error) {
      console.error("Error saving item to database:", error);
      alert("Failed to save item. Make sure your Django server is running!");
    }
  };

  const handleCancelNewItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalInventoryValue = items.reduce((sum, item) => sum + (item.qty * item.price), 0);

  // --- NEW: LOGIC TO GROUP ITEMS BY VENDOR ---
  // 1. Separate unsaved new items from saved items
  const newItemsList = items.filter(item => item.isNew);
  const savedItems = items.filter(item => !item.isNew);

  // 2. Filter saved items by search term (searches BOTH item name and vendor name)
  const filteredSaved = savedItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.vendor_name && item.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 3. Group the filtered items together using reduce
  const aggregatedStock = filteredSaved.reduce((acc, item) => {
    const key = item.name.toLowerCase();
    if (!acc[key]) {
      acc[key] = { name: item.name, totalQty: 0, unit: item.unit, vendors: [] };
    }
    acc[key].totalQty += parseFloat(item.qty) || 0;
    
    // Add the specific vendor breakdown to the list
    const vName = item.vendor_name || 'General Vendor';
    acc[key].vendors.push(`${vName} (${item.qty} ${item.unit})`);
    
    return acc;
  }, {});

  // Convert the grouped object back into an array so we can map over it in the UI
  const summaryList = Object.values(aggregatedStock);


  return (
    <div className="inventory-page-wrapper" style={{ flex: 1, padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      
      <div className="inventory-main-header">
        <div className="inventory-title-group">
          <Package size={28} color="#ff6b6b" />
          <h2>Stock Manager</h2>
        </div>
        
        <button className="manage-inv-nav-btn" onClick={() => navigate('/manage-inventory')}>
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
              placeholder="Search items or vendors..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="inventory-search-input"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="add-stock-btn" onClick={handleAddNewRow}>
              <Plus size={18} /> Add Stock
            </button>
          </div>
        </div>
      </div>

      <div className="scrollable-table-container" style={{ paddingBottom: '50px' }}>
        
        {/* --- SECTION 1: ADDING NEW ITEMS (Keeps your table style) --- */}
        {newItemsList.length > 0 && (
          <div className="fixed-inventory-list" style={{ marginBottom: '20px' }}>
            {newItemsList.map(item => (
              <div key={item.id} className="fixed-inventory-row split-row" style={{ background: '#fffbeb', border: '2px dashed #f59e0b' }}>
                <div className="inventory-left-side">
                  <div className="new-item-inputs">
                    <input 
                      type="text" placeholder="Item Name (e.g. Flour)..." 
                      value={item.name} onChange={(e) => handleUpdateField(item.id, 'name', e.target.value)}
                      className="new-name-input" autoFocus
                    />
                    {/* NEW VENDOR INPUT */}
                    <input 
                      type="text" placeholder="Vendor Name..." 
                      value={item.vendor_name} onChange={(e) => handleUpdateField(item.id, 'vendor_name', e.target.value)}
                      className="new-name-input" style={{ width: '130px', marginLeft: '10px' }}
                    />
                    <select 
                      value={item.unit} onChange={(e) => handleUpdateField(item.id, 'unit', e.target.value)}
                      className="new-unit-select"
                    >
                      <option value="KG">KG</option>
                      <option value="Litre">Litre</option>
                      <option value="Dozen">Dozen</option>
                      <option value="Pcs">Pcs</option>
                    </select>
                    <button onClick={() => handleSaveNewItem(item.id)} className="save-new-item-btn" title="Save Item"><Check size={18} /></button>
                    <button onClick={() => handleCancelNewItem(item.id)} className="cancel-new-item-btn" title="Cancel"><X size={18} /></button>
                  </div>
                </div>
                
                <div className="inventory-right-side">
                  <div className="col-price">
                    <label className="mobile-label">Price</label>
                    <div className="input-with-prefix">
                      <span>PKR</span>
                      <input type="number" min="0" placeholder="0" value={item.price === 0 ? '' : item.price} onChange={(e) => handleUpdateField(item.id, 'price', e.target.value)} />
                    </div>
                  </div>
                  <div className="col-qty">
                    <label className="mobile-label">Qty</label>
                    <div className="qty-update-wrapper">
                      <input type="number" min="0" placeholder="0" value={item.qty === 0 ? '' : item.qty} onChange={(e) => handleUpdateField(item.id, 'qty', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- SECTION 2: THE NEW CARD-BASED VENDOR GRID --- */}
        {summaryList.length === 0 && newItemsList.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            No inventory found matching your search.
          </div>
        ) : (
          <div className="inventory-grid">
            {summaryList.map((item, index) => (
              <div className="inventory-card" key={index}>
                <div className="card-header">
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{item.name}</h3>
                  <span className="total-badge">{item.totalQty} {item.unit}</span>
                </div>
                <div className="card-body">
                  <p className="vendor-title" style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Truck size={14}/> Stock Provided By:
                  </p>
                  <div className="vendor-tags">
                     {item.vendors.map((v, i) => <span key={i} className="vendor-tag">{v}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Inventory;
import React, { useState, useEffect } from 'react';
import './App.css';
import { FileText, X, ChefHat, Receipt, Package, Plus } from 'lucide-react'; // Added Plus icon
import axios from 'axios';
import { usePDF } from 'react-to-pdf';

function App() {
  const [activeOrder, setActiveOrder] = useState('Table 1');
  const [menuItems, setMenuItems] = useState([]);
  
  // New State for Dynamic Income
  const [dailyIncome, setDailyIncome] = useState(0);
  
  const { toPDF, targetRef } = usePDF({ filename: `${activeOrder}_Receipt.pdf` });

  const [orders, setOrders] = useState({
    'Table 1': { type: 'Dine-In', items: [], status: 'Draft' },
    'Table 2': { type: 'Dine-In', items: [], status: 'Draft' },
    'Table 3': { type: 'Dine-In', items: [], status: 'Draft' },
    'Table 4': { type: 'Dine-In', items: [], status: 'Draft' },
    'Takeaway 1': { type: 'Takeaway', items: [], status: 'Draft' },
    'Takeaway 2': { type: 'Takeaway', items: [], status: 'Draft' },
  });

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/menu-items/')
      .then(response => {
        const liveItems = response.data.map(item => ({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          icon: item.image_url || '🍽️'
        }));
        setMenuItems(liveItems);
      })
      .catch(error => console.error("Backend Error:", error));
  }, []);

  // --- NEW FUNCTIONS FOR DYNAMIC TABLES ---
  const handleAddTable = () => {
    const dineInKeys = Object.keys(orders).filter(k => orders[k].type === 'Dine-In');
    const newTableName = `Table ${dineInKeys.length + 1}`;
    setOrders(prev => ({
      ...prev,
      [newTableName]: { type: 'Dine-In', items: [], status: 'Draft' }
    }));
    setActiveOrder(newTableName);
  };

  const handleAddTakeaway = () => {
    const takeawayKeys = Object.keys(orders).filter(k => orders[k].type === 'Takeaway');
    const newTakeawayName = `Takeaway ${takeawayKeys.length + 1}`;
    setOrders(prev => ({
      ...prev,
      [newTakeawayName]: { type: 'Takeaway', items: [], status: 'Draft' }
    }));
    setActiveOrder(newTakeawayName);
  };

  // --- ITEM MANAGEMENT ---
  const handleAddItem = (item) => {
    setOrders(prev => {
      const currentOrder = prev[activeOrder];
      const existingItem = currentOrder.items.find(i => i.id === item.id);
      let newItems = existingItem 
        ? currentOrder.items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
        : [...currentOrder.items, { ...item, qty: 1 }];
      return { ...prev, [activeOrder]: { ...currentOrder, items: newItems } };
    });
  };

  const handleRemoveItem = (itemId) => {
    setOrders(prev => ({
      ...prev,
      [activeOrder]: { ...prev[activeOrder], items: prev[activeOrder].items.filter(i => i.id !== itemId) }
    }));
  };

  // Calculations
  const currentOrderData = orders[activeOrder];
  const subtotal = currentOrderData ? currentOrderData.items.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0;
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const runningOrders = Object.entries(orders).filter(([id, data]) => data.status === 'Running').map(([id]) => id);

  // --- NEW FUNCTION TO FINALIZE BILL ---
  const handleFinalizeBill = () => {
    if (currentOrderData.items.length === 0) return; // Prevent finalizing empty bills
    
    toPDF(); // 1. Download PDF
    setDailyIncome(prev => prev + total); // 2. Add to total income
    
    // 3. Clear the table items and set status back to draft
    setOrders(prev => ({
      ...prev,
      [activeOrder]: { ...prev[activeOrder], items: [], status: 'Draft' }
    }));
  };

  // Helper arrays for rendering the sidebar
  const dineInTables = Object.keys(orders).filter(k => orders[k].type === 'Dine-In');
  const takeawayOrdersList = Object.keys(orders).filter(k => orders[k].type === 'Takeaway');

  return (
    <div className="app-container">
      {/* LEFT SIDEBAR */}
      <div className="left-sidebar">
        <div className="logo-area">Nashta POS</div>
        
        {/* Dynamic Dine-In Section */}
        <div className="nav-section">
          <div className="section-header">
            <h3>Dine-In</h3>
            <button className="add-btn" onClick={handleAddTable} title="Add new Table"><Plus size={16}/></button>
          </div>
          <div className="scrollable-list">
            {dineInTables.map(table => (
              <button key={table} className={`nav-btn ${activeOrder === table ? 'active' : ''}`} onClick={() => setActiveOrder(table)}>
                {table} {orders[table].status === 'Running' ? '🔥' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Takeaway Section */}
        <div className="nav-section">
          <div className="section-header">
            <h3>Takeaway</h3>
            <button className="add-btn" onClick={handleAddTakeaway} title="Add new Takeaway"><Plus size={16}/></button>
          </div>
          <div className="scrollable-list">
            {takeawayOrdersList.map(ta => (
              <button key={ta} className={`nav-btn ${activeOrder === ta ? 'active' : ''}`} onClick={() => setActiveOrder(ta)}>
                {ta} {orders[ta].status === 'Running' ? '🔥' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-nav">
          <button className="nav-btn"><Package size={18}/> Inventory</button>
          <button className="nav-btn"><FileText size={18}/> Reports</button>
        </div>
      </div>

      {/* MIDDLE SECTION */}
      <div className="middle-section">
        <div className="middle-content">
          <div className="current-order-area">
            <h2>{activeOrder} <span className="status-badge">{currentOrderData?.status}</span></h2>
            <div className="order-item-list">
              {currentOrderData?.items.length === 0 ? (
                 <p style={{color: '#888', fontStyle: 'italic', padding: '10px 0'}}>No items added yet.</p>
              ) : (
                currentOrderData?.items.map(item => (
                  <div className="order-item-row" key={item.id}>
                    <span>{item.name} x {item.qty}</span>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <strong>PKR {(item.price * item.qty).toFixed(2)}</strong>
                      <button className="cancel-btn" onClick={() => handleRemoveItem(item.id)}><X size={14}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Send to Kitchen button */}
            {currentOrderData?.items.length > 0 && currentOrderData?.status !== 'Running' && (
              <button 
                style={{ width: '100%', padding: '12px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '10px' }}
                onClick={() => setOrders(prev => ({...prev, [activeOrder]: { ...prev[activeOrder], status: 'Running' }}))}
              >
                <ChefHat size={18} /> Send to Kitchen (KOT)
              </button>
            )}
          </div>

          <div className="menu-grid">
            {menuItems.map(item => (
              <div className="menu-card" key={item.id} onClick={() => handleAddItem(item)}>
                <div style={{fontSize: '40px'}}>{item.icon}</div>
                <div>{item.name}</div>
                <div style={{color:'#ff6b6b'}}>PKR {item.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="running-orders-bar">
          <strong>Running:</strong> {runningOrders.join(', ') || 'None'}
          {/* Dynamic Income Display */}
          <div style={{marginLeft:'auto', color:'#10b981', fontWeight: 'bold', fontSize: '18px'}}>
            Today's Income: PKR {dailyIncome.toFixed(2)}
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR (The Receipt) */}
      <div className="right-sidebar">
        <h2 style={{marginBottom: '15px'}}><Receipt size={20}/> Bill View</h2>
        
        <div className="bill-receipt" ref={targetRef} style={{ background: 'white' }}>
          <div className="bill-header">
            <h2 style={{color: 'black', margin: 0}}>Nashta Restaurant</h2>
            <p style={{fontSize: '12px', color: '#666'}}>123 Food Street, City</p>
            <p style={{marginTop: '10px', fontWeight: 'bold'}}>Order: {activeOrder}</p>
          </div>
          <div className="bill-items">
            {currentOrderData?.items.map(item => (
              <div key={item.id} className="bill-row">
                <span>{item.qty}x {item.name}</span>
                <span>PKR {(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="bill-totals">
            <div className="bill-row"><span>Subtotal</span><span>PKR {subtotal.toFixed(2)}</span></div>
            <div className="bill-row" style={{color: '#888'}}><span>Tax (5%)</span><span>PKR {tax.toFixed(2)}</span></div>
            <div className="bill-row total-row"><span>Total</span><span>PKR {total.toFixed(2)}</span></div>
          </div>
        </div>

        {/* This triggers the new handleFinalizeBill function */}
        <button 
          className="print-btn" 
          onClick={handleFinalizeBill}
          style={{ opacity: currentOrderData?.items.length === 0 ? 0.5 : 1 }}
          disabled={currentOrderData?.items.length === 0}
        >
          Finalize & Print Bill (PDF)
        </button>
      </div>
    </div>
  );
}

export default App;
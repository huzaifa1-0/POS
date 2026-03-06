import React, { useState, useEffect } from 'react';
import './App.css';
import { FileText, X, ChefHat, Receipt, Package, Plus } from 'lucide-react';
import axios from 'axios';
import { usePDF } from 'react-to-pdf';

function App() {
  const [activeOrder, setActiveOrder] = useState('Table 1');
  const [menuItems, setMenuItems] = useState([]);
  const [dailyIncome, setDailyIncome] = useState(0);
  
  const { toPDF, targetRef } = usePDF({ filename: `${activeOrder}_Receipt.pdf` });

  const [orders, setOrders] = useState({
    'Table 1': { type: 'Dine-In', items: [], status: 'Draft' },
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

  // --- AGGRESSIVE CLEANUP: Tab Switching ---
  const handleTabClick = (tabName) => {
    if (tabName === activeOrder) return;
    
    setOrders(prev => {
      const newOrders = { ...prev };
      // Delete ALL empty tables from memory instantly (except the one we are moving to)
      Object.keys(newOrders).forEach(key => {
        if (newOrders[key].items.length === 0 && key !== tabName) {
          delete newOrders[key];
        }
      });
      return newOrders;
    });
    
    setActiveOrder(tabName);
  };

  // --- AGGRESSIVE CLEANUP: Add Dine-In ---
  const handleAddTable = () => {
    setOrders(prev => {
      const newOrders = { ...prev };
      
      // Destroy all hidden empty tables so they stop stealing numbers!
      Object.keys(newOrders).forEach(key => {
        if (newOrders[key].items.length === 0) {
          delete newOrders[key];
        }
      });
      
      let nextNum = 1;
      while(newOrders[`Table ${nextNum}`]) nextNum++;
      
      const newName = `Table ${nextNum}`;
      newOrders[newName] = { type: 'Dine-In', items: [], status: 'Draft' };
      setActiveOrder(newName);
      return newOrders;
    });
  };

  // --- AGGRESSIVE CLEANUP: Add Takeaway ---
  const handleAddTakeaway = () => {
    setOrders(prev => {
      const newOrders = { ...prev };
      
      // Destroy all hidden empty tables/takeaways
      Object.keys(newOrders).forEach(key => {
        if (newOrders[key].items.length === 0) {
          delete newOrders[key];
        }
      });
      
      let nextNum = 1;
      while(newOrders[`Takeaway ${nextNum}`]) nextNum++;
      
      const newName = `Takeaway ${nextNum}`;
      newOrders[newName] = { type: 'Takeaway', items: [], status: 'Draft' };
      setActiveOrder(newName);
      return newOrders;
    });
  };

  const handleAddItem = (item) => {
    setOrders(prev => {
      const currentOrder = prev[activeOrder] || { type: 'Dine-In', items: [], status: 'Draft' };
      const existingItem = currentOrder.items.find(i => i.id === item.id);
      
      let newItems = existingItem 
        ? currentOrder.items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
        : [...currentOrder.items, { ...item, qty: 1 }];

      const newStatus = newItems.length > 0 ? 'Running' : 'Draft';
      
      return { 
        ...prev, 
        [activeOrder]: { ...currentOrder, items: newItems, status: newStatus } 
      };
    });
  };

  const handleRemoveItem = (itemId) => {
    const userConfirmed = window.confirm("Are you sure you want to delete this item?");
    if (!userConfirmed) return;

    setOrders(prev => {
      const currentOrder = prev[activeOrder];
      const newItems = currentOrder.items.filter(i => i.id !== itemId);
      
      if (newItems.length === 0) {
        const remainingOrders = { ...prev };
        delete remainingOrders[activeOrder]; 
        
        const remainingKeys = Object.keys(remainingOrders);
        const nextActive = remainingKeys.length > 0 ? remainingKeys[0] : 'Table 1';
        
        if (!remainingOrders[nextActive]) {
           remainingOrders['Table 1'] = { type: 'Dine-In', items: [], status: 'Draft' };
        }
        
        setActiveOrder(nextActive);
        return remainingOrders;
      }

      const newStatus = newItems.length > 0 ? 'Running' : 'Draft';
      return { ...prev, [activeOrder]: { ...currentOrder, items: newItems, status: newStatus } };
    });
  };

  const handleFinalizeBill = () => {
    if (currentOrderData.items.length === 0) return;
    toPDF();
    setDailyIncome(prev => prev + total);
    setOrders(prev => {
        const remainingOrders = { ...prev };
        delete remainingOrders[activeOrder];
        const remainingKeys = Object.keys(remainingOrders);
        const nextActive = remainingKeys.length > 0 ? remainingKeys[0] : 'Table 1';
        if (!remainingOrders[nextActive]) remainingOrders['Table 1'] = { type: 'Dine-In', items: [], status: 'Draft' };
        setActiveOrder(nextActive);
        return remainingOrders;
    });
  };

  const currentOrderData = orders[activeOrder] || { items: [], status: 'Draft' };
  const subtotal = currentOrderData.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const visibleDineIn = Object.keys(orders).filter(k => 
    orders[k].type === 'Dine-In' && (orders[k].items.length > 0 || activeOrder === k)
  );
  
  const visibleTakeaway = Object.keys(orders).filter(k => 
    orders[k].type === 'Takeaway' && (orders[k].items.length > 0 || activeOrder === k)
  );

  return (
    <div className="app-container">
      {/* LEFT SIDEBAR */}
      <div className="left-sidebar">
        <div className="logo-area">Nashta POS</div>
        
        <div className="nav-section">
          <div className="section-header">
            <h3>Dine-In</h3>
            <button className="add-btn" onClick={handleAddTable}><Plus size={16}/></button>
          </div>
          <div className="scrollable-list">
            {visibleDineIn.map(table => (
              <button 
                key={table} 
                className={`nav-btn ${activeOrder === table ? 'active' : ''}`} 
                onClick={() => handleTabClick(table)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>{table}</span>
                  {orders[table].items.length > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 'bold', background: activeOrder === table ? 'rgba(255,255,255,0.3)' : '#ffe0e0', color: activeOrder === table ? 'white' : '#ff6b6b', padding: '3px 8px', borderRadius: '12px' }}>
                      {orders[table].status}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="nav-section">
          <div className="section-header">
            <h3>Takeaway</h3>
            <button className="add-btn" onClick={handleAddTakeaway}><Plus size={16}/></button>
          </div>
          <div className="scrollable-list">
            {visibleTakeaway.map(ta => (
              <button 
                key={ta} 
                className={`nav-btn ${activeOrder === ta ? 'active' : ''}`} 
                onClick={() => handleTabClick(ta)}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>{ta}</span>
                  {orders[ta].items.length > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 'bold', background: activeOrder === ta ? 'rgba(255,255,255,0.3)' : '#ffe0e0', color: activeOrder === ta ? 'white' : '#ff6b6b', padding: '3px 8px', borderRadius: '12px' }}>
                      {orders[ta].status}
                    </span>
                  )}
                </div>
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
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {activeOrder} - 
              <span className="status-badge" style={{ fontSize: '14px', textTransform: 'uppercase', background: currentOrderData.status === 'Running' ? '#ffe0e0' : '#e0e7ff', color: currentOrderData.status === 'Running' ? '#ff6b6b' : '#4f46e5' }}>
                {currentOrderData.status}
              </span>
            </h2>
            
            <div className="order-item-list">
              {currentOrderData.items.length === 0 ? (
                 <p style={{color: '#888', fontStyle: 'italic', padding: '10px 0'}}>Empty. Add items below.</p>
              ) : (
                currentOrderData.items.map(item => (
                  <div className="order-item-row" key={item.id}>
                    <span>{item.qty}x {item.name}</span>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <strong>PKR {(item.price * item.qty).toFixed(2)}</strong>
                      <button className="cancel-btn" onClick={() => handleRemoveItem(item.id)} title="Cancel Item">
                        <X size={14}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {currentOrderData.items.length > 0 && currentOrderData.status !== 'Sent' && (
              <button 
                style={{ width: '100%', padding: '12px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '10px' }}
                onClick={() => setOrders(prev => ({...prev, [activeOrder]: { ...prev[activeOrder], status: 'Sent' }}))}
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
            {currentOrderData.items.map(item => (
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

        <button 
          className="print-btn" 
          onClick={handleFinalizeBill}
          style={{ opacity: currentOrderData.items.length === 0 ? 0.5 : 1 }}
          disabled={currentOrderData.items.length === 0}
        >
          Finalize & Print Bill (PDF)
        </button>
      </div>
    </div>
  );
}

export default App;
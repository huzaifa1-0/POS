import React, { useState, useEffect } from 'react';
import './App.css';
import { FileText, X, ChefHat, Receipt, Package, Plus, Printer } from 'lucide-react';
import axios from 'axios';
import { usePDF } from 'react-to-pdf';

function App() {
  const [activeOrder, setActiveOrder] = useState('Table 1');
  const [menuItems, setMenuItems] = useState([]);
  const [dailyIncome, setDailyIncome] = useState(0);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [itemToDelete, setItemToDelete] = useState(null); 
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

  const handleTabClick = (tabName) => {
    if (tabName === activeOrder) return;
    setOrders(prev => {
      const newOrders = { ...prev };
      Object.keys(newOrders).forEach(key => {
        if (newOrders[key].items.length === 0 && key !== tabName) {
          delete newOrders[key];
        }
      });
      return newOrders;
    });
    setActiveOrder(tabName);
  };

  const handleAddTable = () => {
    setOrders(prev => {
      const newOrders = { ...prev };
      Object.keys(newOrders).forEach(key => {
        if (newOrders[key].items.length === 0) delete newOrders[key];
      });
      let nextNum = 1;
      while(newOrders[`Table ${nextNum}`]) nextNum++;
      const newName = `Table ${nextNum}`;
      newOrders[newName] = { type: 'Dine-In', items: [], status: 'Draft' };
      setActiveOrder(newName);
      return newOrders;
    });
  };

  const handleAddTakeaway = () => {
    setOrders(prev => {
      const newOrders = { ...prev };
      Object.keys(newOrders).forEach(key => {
        if (newOrders[key].items.length === 0) delete newOrders[key];
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

      // If status was already Sent, keep it Sent. Otherwise, Running.
      const newStatus = currentOrder.status === 'Sent' ? 'Sent' : 'Running';
      return { ...prev, [activeOrder]: { ...currentOrder, items: newItems, status: newStatus } };
    });
  };

  const handleRemoveClick = (itemId) => setItemToDelete(itemId);

  const executeRemoveItem = () => {
    if (!itemToDelete) return;
    setOrders(prev => {
      const currentOrder = prev[activeOrder];
      const newItems = currentOrder.items.filter(i => i.id !== itemToDelete);
      
      if (newItems.length === 0) {
        const remainingOrders = { ...prev };
        delete remainingOrders[activeOrder]; 
        const remainingKeys = Object.keys(remainingOrders);
        const nextActive = remainingKeys.length > 0 ? remainingKeys[0] : 'Table 1';
        if (!remainingOrders[nextActive]) remainingOrders['Table 1'] = { type: 'Dine-In', items: [], status: 'Draft' };
        setActiveOrder(nextActive);
        return remainingOrders;
      }
      const newStatus = currentOrder.status === 'Sent' ? 'Sent' : 'Running';
      return { ...prev, [activeOrder]: { ...currentOrder, items: newItems, status: newStatus } };
    });
    setItemToDelete(null); 
  };

  const handleFinalizeBill = () => {
    if (currentOrderData.items.length === 0) return;
    toPDF();
    setDailyIncome(prev => prev + total);
    setCompletedOrders(prev => [
      { id: Date.now(), name: activeOrder, type: currentOrderData.type, total: total },
      ...prev
    ]);
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

  const currentOrderData = orders[activeOrder] || { items: [], status: 'Draft', type: 'Dine-In' };
  const subtotal = currentOrderData.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const visibleDineIn = Object.keys(orders).filter(k => orders[k].type === 'Dine-In' && (orders[k].items.length > 0 || activeOrder === k));
  const visibleTakeaway = Object.keys(orders).filter(k => orders[k].type === 'Takeaway' && (orders[k].items.length > 0 || activeOrder === k));

  // --- NEW: Helper Function for Badge Colors ---
  const getBadgeStyle = (status, isActive) => {
    if (status === 'Sent') {
      return { background: isActive ? 'rgba(255,255,255,0.4)' : '#dcfce3', color: isActive ? 'white' : '#16a34a' }; // Green
    }
    return { background: isActive ? 'rgba(255,255,255,0.4)' : '#ffe0e0', color: isActive ? 'white' : '#ff6b6b' }; // Red
  };

  return (
    <div className="app-container">
      
      {itemToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Remove Item</h3>
            <p>Are you sure you want to remove this item from the order?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setItemToDelete(null)}>Cancel</button>
              <button className="btn-confirm" onClick={executeRemoveItem}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <div className="left-sidebar">
        <div className="logo-area">Nashta POS</div>
        
        {/* Dine-In Section */}
        <div className="nav-section">
          <div className="section-header">
            <h3>Dine-In</h3>
            <button className="add-btn" onClick={handleAddTable}><Plus size={16}/></button>
          </div>
          <div className="scrollable-list">
            {visibleDineIn.map(table => (
              <button key={table} className={`nav-btn ${activeOrder === table ? 'active' : ''}`} onClick={() => handleTabClick(table)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>{table}</span>
                  {orders[table].items.length > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px', ...getBadgeStyle(orders[table].status, activeOrder === table) }}>
                      {orders[table].status}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Takeaway Section */}
        <div className="nav-section">
          <div className="section-header">
            <h3>Takeaway</h3>
            <button className="add-btn" onClick={handleAddTakeaway}><Plus size={16}/></button>
          </div>
          <div className="scrollable-list">
            {visibleTakeaway.map(ta => (
              <button key={ta} className={`nav-btn ${activeOrder === ta ? 'active' : ''}`} onClick={() => handleTabClick(ta)}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span>{ta}</span>
                  {orders[ta].items.length > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px', ...getBadgeStyle(orders[ta].status, activeOrder === ta) }}>
                      {orders[ta].status}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Completed Section */}
        <div className="nav-section">
          <div className="section-header">
            <h3>Completed</h3>
            <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#e0e7ff', color: '#4f46e5', padding: '3px 8px', borderRadius: '12px' }}>
              {completedOrders.length}
            </span>
          </div>
          <div className="scrollable-list">
            {completedOrders.length === 0 ? (
              <p style={{ color: '#888', fontSize: '12px', padding: '5px 15px', fontStyle: 'italic' }}>No completed orders.</p>
            ) : (
              completedOrders.map(order => (
                <div key={order.id} style={{ padding: '10px 15px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>{order.name}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{order.type}</div>
                  </div>
                  <strong style={{ fontSize: '13px', color: '#10b981' }}>PKR {order.total.toFixed(0)}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION */}
      <div className="middle-section">
        <div className="middle-content">
          <div className="current-order-area">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {activeOrder} - 
              <span className="status-badge" style={{ 
                fontSize: '14px', textTransform: 'uppercase', 
                background: currentOrderData.status === 'Sent' ? '#dcfce3' : currentOrderData.status === 'Running' ? '#ffe0e0' : '#e0e7ff', 
                color: currentOrderData.status === 'Sent' ? '#16a34a' : currentOrderData.status === 'Running' ? '#ff6b6b' : '#4f46e5' 
              }}>
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
                      <button className="cancel-btn" onClick={() => handleRemoveClick(item.id)} title="Cancel Item"><X size={14}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Show SEND Button if NOT Sent yet */}
            {currentOrderData.items.length > 0 && currentOrderData.status !== 'Sent' && (
              <button 
                style={{ width: '100%', padding: '12px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '10px' }}
                onClick={() => setOrders(prev => ({...prev, [activeOrder]: { ...prev[activeOrder], status: 'Sent' }}))}
              >
                <ChefHat size={18} /> Send to Kitchen (KOT)
              </button>
            )}

            {/* Show COMPLETED TEXT if Sent */}
            {currentOrderData.status === 'Sent' && (
              <div style={{ width: '100%', padding: '12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce3', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px' }}>
                ✅ Sent to Kitchen (Completed)
              </div>
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
          disabled={currentOrderData.items.length === 0}
        >
          <Printer size={18} /> Finalize & Print Bill (PDF)
        </button>
      </div>
    </div>
  );
}

export default App;
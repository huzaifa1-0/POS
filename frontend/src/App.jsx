import React, { useState, useEffect } from 'react';
import './App.css';
import { FileText, X, ChefHat, Receipt, Package, DollarSign } from 'lucide-react';
import axios from 'axios';

function App() {
  // This state tracks which table is currently selected on the screen
  const [activeOrder, setActiveOrder] = useState('Table 1');
  
  // This complex state holds the individual orders and statuses for every single table
  const [orders, setOrders] = useState({
    'Table 1': { type: 'Dine-In', items: [], status: 'Draft' },
    'Table 2': { type: 'Dine-In', items: [{ id: 1, name: 'Burger', price: 8.50, qty: 1 }], status: 'Running' },
    'Table 3': { type: 'Dine-In', items: [{ id: 2, name: 'Fries', price: 3.00, qty: 2 }], status: 'Running' },
    'Table 4': { type: 'Dine-In', items: [], status: 'Draft' },
    'Takeaway 1': { type: 'Takeaway', items: [], status: 'Draft' },
    'Takeaway 2': { type: 'Takeaway', items: [], status: 'Draft' },
  });

  // Change menuItems to a state variable
  const [menuItems, setMenuItems] = useState([]);

  // Fetch the actual data from Django when the app loads
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/menu-items/')
      .then(response => {
        // Map over the Django data to format it for our React UI
        const liveItems = response.data.map(item => ({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price), // Crucial: Convert Django string to number
          icon: item.image_url || '🍽️' // Use the image_url from Django, or a default plate icon
        }));
        setMenuItems(liveItems);
      })
      .catch(error => {
        console.error("Error fetching from Django:", error);
        // Fallback mock data if backend is off
        setMenuItems([{ id: 999, name: 'Backend Offline', price: 0, icon: '⚠️' }]);
      });
  }, []);

  // Function to add a clicked item to the currently active table
  const handleAddItem = (item) => {
    setOrders(prev => {
      const currentOrder = prev[activeOrder];
      const existingItem = currentOrder.items.find(i => i.id === item.id);
      let newItems;
      
      // If the item is already in the cart, just increase the quantity
      if (existingItem) {
        newItems = currentOrder.items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      } else {
        newItems = [...currentOrder.items, { ...item, qty: 1 }];
      }
      return { ...prev, [activeOrder]: { ...currentOrder, items: newItems } };
    });
  };

  // Function for the Cancel (X) button
  const handleRemoveItem = (itemId) => {
    setOrders(prev => {
      const currentOrder = prev[activeOrder];
      const newItems = currentOrder.items.filter(i => i.id !== itemId);
      return { ...prev, [activeOrder]: { ...currentOrder, items: newItems } };
    });
  };

  // Function for Send to Kitchen button
  const handleSendToKitchen = () => {
    setOrders(prev => ({
      ...prev,
      [activeOrder]: { ...prev[activeOrder], status: 'Running' }
    }));
  };

  // Mathematical Calculations for the current table
  const currentOrderData = orders[activeOrder];
  const subtotal = currentOrderData.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;

  // Find all orders that are currently "Running" in the kitchen
  const runningOrders = Object.entries(orders).filter(([id, data]) => data.status === 'Running').map(([id]) => id);

  return (
    <div className="app-container">
      
      {/* 1. Left Sidebar - Table Management */}
      <div className="left-sidebar">
        <div style={{ padding: '20px', borderBottom: '1px solid #eee', fontWeight: 'bold', fontSize: '22px', color: '#ff6b6b' }}>
          Nashta POS
        </div>
        
        <div className="nav-section">
          <h3>Dine-In</h3>
          {['Table 1', 'Table 2', 'Table 3', 'Table 4'].map(table => (
            <button 
              key={table} 
              className={`nav-btn ${activeOrder === table ? 'active' : ''}`}
              onClick={() => setActiveOrder(table)}
            >
              {table} {orders[table].status === 'Running' ? '🔥' : ''}
            </button>
          ))}
        </div>

        <div className="nav-section">
          <h3>Takeaway</h3>
          {['Takeaway 1', 'Takeaway 2'].map(ta => (
            <button 
              key={ta} 
              className={`nav-btn ${activeOrder === ta ? 'active' : ''}`}
              onClick={() => setActiveOrder(ta)}
            >
              {ta} {orders[ta].status === 'Running' ? '🔥' : ''}
            </button>
          ))}
        </div>

        <div className="admin-nav">
          <button className="nav-btn" style={{display: 'flex', alignItems: 'center', gap: '10px'}}><Package size={18}/> Inventory</button>
          <button className="nav-btn" style={{display: 'flex', alignItems: 'center', gap: '10px'}}><DollarSign size={18}/> Expenses</button>
          <button className="nav-btn" style={{display: 'flex', alignItems: 'center', gap: '10px'}}><FileText size={18}/> Reports</button>
        </div>
      </div>

      {/* 2. Middle Section - Order Entry & Menus */}
      <div className="middle-section">
        <div className="middle-content">
          
          {/* Current Order List & Kitchen Button */}
          <div className="current-order-area">
            <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#333' }}>
              Current Order: {activeOrder}
              <span style={{ fontSize: '14px', padding: '5px 12px', background: currentOrderData.status === 'Running' ? '#ffe0e0' : '#e0e7ff', borderRadius: '20px', color: currentOrderData.status === 'Running' ? '#ff6b6b' : '#4f46e5' }}>
                Status: {currentOrderData.status}
              </span>
            </h2>

            <div className="order-item-list">
              {currentOrderData.items.length === 0 ? (
                <p style={{color: '#888', fontStyle: 'italic', padding: '10px 0'}}>No items added yet. Click menu items below.</p>
              ) : (
                currentOrderData.items.map(item => (
                  <div className="order-item-row" key={item.id}>
                    <div style={{fontSize: '16px'}}>
                      <strong style={{marginRight: '10px'}}>{item.name}</strong> 
                      <span style={{color: '#888'}}>x {item.qty}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{fontWeight: 'bold', fontSize: '16px'}}>PKR {(item.price * item.qty).toFixed(2)}</span>
                      {/* Cancel/Delete Item Button */}
                      <button className="cancel-btn" onClick={() => handleRemoveItem(item.id)} title="Cancel Item">
                        <X size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Send to Kitchen Button */}
            {currentOrderData.items.length > 0 && currentOrderData.status !== 'Running' && (
              <button 
                style={{ width: '100%', padding: '15px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                onClick={handleSendToKitchen}
              >
                <ChefHat size={20} /> Send to Kitchen (KOT)
              </button>
            )}
          </div>

          {/* Menu Grid - Clicking these adds to the list above */}
          <div className="menu-grid-area">
            <h3 style={{marginBottom: '15px', color: '#555'}}>Menu Items</h3>
            <div className="menu-grid">
              {menuItems.map(item => (
                <div className="menu-card" key={item.id} onClick={() => handleAddItem(item)}>
                  <div style={{fontSize: '45px', marginBottom: '10px'}}>{item.icon}</div>
                  <div style={{fontWeight: 'bold', color: '#333'}}>{item.name}</div>
                  <div style={{color: '#ff6b6b', fontWeight: 'bold', marginTop: '5px'}}>PKR {item.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Horizontal Running Orders Footer */}
        <div className="running-orders-bar">
          <div style={{fontWeight: 'bold', color: '#555', marginRight: '10px'}}>Running Tables:</div>
          {runningOrders.length === 0 ? <span style={{color: '#888', fontSize: '14px'}}>None</span> : null}
          
          {runningOrders.map(ro => (
            <div key={ro} className="running-badge" onClick={() => setActiveOrder(ro)}>
              {ro}
            </div>
          ))}
          
          <div style={{marginLeft: 'auto', fontWeight: 'bold', color: '#10b981', fontSize: '16px'}}>
            Today's Income: $145.50
          </div>
        </div>
      </div>

      {/* 3. Right Sidebar - Static Bill / Receipt Form */}
      <div className="right-sidebar">
        <h2 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#333'}}><Receipt size={24}/> Bill View</h2>
        
        <div className="bill-receipt">
          <div className="bill-header">
            <h2>Nashta Restaurant</h2>
            <p style={{fontSize: '12px', color: '#888'}}>123 Food Street, City</p>
            <p style={{fontSize: '14px', fontWeight: 'bold', color: '#333', marginTop: '10px'}}>Order: {activeOrder}</p>
          </div>

          <div className="bill-items">
            {currentOrderData.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '12px' }}>
                <span>{item.qty}x {item.name}</span>
                <span style={{fontWeight: '500'}}>PKR {(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="bill-totals">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
              <span>Subtotal</span>
              <span>PKR {subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: '#888' }}>
              <span>Tax (5%)</span>
              <span>PKR {tax.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #333' }}>
              <span>Total</span>
              <span>PKR {total.toFixed(2)}</span>
            </div>
          </div>
          
          <button style={{marginTop: '20px', padding: '15px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.2s'}}>
            Finalize & Print Bill
          </button>
        </div>
      </div>

    </div>
  );
}

export default App;
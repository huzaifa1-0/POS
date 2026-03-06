import React, { useState, useEffect } from 'react';
import './App.css';
import { Home, Settings, Grid, PieChart } from 'lucide-react';
import axios from 'axios';

function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);

  // Fetch from Django API
  useEffect(() => {
    // In production, use your actual Django URL (e.g., http://localhost:8000/api/menu-items/)
    // For now, this is mock data representing what Django will send
    setMenuItems([
      { id: 1, name: 'Smashed Avo', price: 15.20, image: '🥑' },
      { id: 2, name: 'Yin & Yang', price: 12.50, image: '🍲' },
      { id: 3, name: 'Pancakes', price: 10.00, image: '🥞' },
    ]);
  }, []);

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  return (
    <div className="app-container">
      
      {/* 1. Sidebar Nav */}
      <div className="sidebar-nav">
        <div className="logo">🍔</div>
        <Home size={28} color="#aaa" />
        <Grid size={28} color="#FF6B6B" /> {/* Active color from image */}
        <PieChart size={28} color="#aaa" />
        <Settings size={28} color="#aaa" />
      </div>

      {/* 2. Categories */}
      <div className="categories-column">
        <h2>Menu</h2>
        <div className="category-btn active">Breakfast</div>
        <div className="category-btn">Soups</div>
        <div className="category-btn">Pasta</div>
        <div className="category-btn">Sushi</div>
        <div className="category-btn">Main course</div>
        <div className="category-btn">Desserts</div>
        <div className="category-btn">Drinks</div>
      </div>

      {/* 3. Main Menu Area */}
      <div className="menu-area">
        <div className="search-header">
          <input type="text" placeholder="Search menu..." style={{padding: '10px', width: '300px', borderRadius: '8px', border: '1px solid #ddd'}} />
        </div>
        
        <div className="menu-grid">
          {menuItems.map(item => (
            <div className="menu-card" key={item.id} onClick={() => addToCart(item)}>
              <div style={{fontSize: '50px'}}>{item.image}</div>
              <h4 style={{marginTop: '10px'}}>{item.name}</h4>
              <p style={{color: '#FF6B6B', fontWeight: 'bold'}}>${parseFloat(item.price).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Order Cart */}
      <div className="cart-column">
        <div style={{padding: '20px', borderBottom: '1px solid #eee'}}>
          <h3>Table 4 <span style={{fontSize: '12px', color: '#888'}}>#00109</span></h3>
          <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
             <button style={{flex: 1, padding: '8px', background: '#FF6B6B', color: 'white', borderRadius: '5px', border: 'none'}}>Dine in</button>
             <button style={{flex: 1, padding: '8px', background: '#f0f0f0', borderRadius: '5px', border: 'none'}}>To go</button>
             <button style={{flex: 1, padding: '8px', background: '#f0f0f0', borderRadius: '5px', border: 'none'}}>Delivery</button>
          </div>
        </div>

        <div style={{flex: 1, padding: '20px', overflowY: 'auto'}}>
          {cart.map((item, index) => (
            <div key={index} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
              <div>
                <strong>{item.name}</strong>
                <div style={{fontSize: '12px', color: '#888'}}>x 1</div>
              </div>
              <strong>${item.price.toFixed(2)}</strong>
            </div>
          ))}
        </div>

        <div style={{padding: '20px', borderTop: '1px solid #eee'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
            <span>Subtotal</span>
            <span>${cart.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2)}</span>
          </div>
          <button style={{width: '100%', padding: '15px', background: '#FF6B6B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer'}}>
            Charge ${cart.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2)}
          </button>
        </div>
      </div>

    </div>
  );
}

export default App;
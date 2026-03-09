import React, { useState } from 'react';
import { Package, Search, Plus, X } from 'lucide-react';

const Inventory = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div style={{ flex: 1, padding: '30px', background: '#f8fafc', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <Package size={28} color="#ff6b6b" />
        <h2 style={{ margin: 0, color: '#1e293b' }}>Stock Inventory</h2>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
          <input type="text" placeholder="Search stock..." style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ background: '#ff6b6b', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
          <Plus size={18} /> Add Stock
        </button>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <p style={{ color: '#64748b' }}>Your inventory items will appear here.</p>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ display: 'flex', justifyContent: 'space-between' }}>Add New Item <X style={{cursor: 'pointer'}} onClick={() => setShowAddModal(false)}/></h3>
            <input type="text" placeholder="Item Name" style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
            <input type="number" placeholder="Quantity" style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
            <button style={{ width: '100%', padding: '10px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Save Item</button>
          </div>
        </div>
      )}
    </div>
  );
};
export default Inventory;
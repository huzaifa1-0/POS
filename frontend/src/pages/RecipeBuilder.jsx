import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Save } from 'lucide-react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const RecipeBuilder = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [selectedMenuItem, setSelectedMenuItem] = useState('');
    
    // NEW: We added inputQty and inputUnit for user-friendly typing
    const [ingredients, setIngredients] = useState([
        { ingredientId: '', inputQty: '', inputUnit: 'Base' }
    ]);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        axios.get(`${BASE_URL}/menu-items/`, config).then(res => setMenuItems(res.data));
        axios.get(`${BASE_URL}/items/`, config).then(res => setInventoryItems(res.data));
    }, []);

    const handleIngredientChange = (index, field, value) => {
        const newIngredients = [...ingredients];
        newIngredients[index][field] = value;
        
        // Auto-switch to Grams/ml if the user selects a KG/Litre item to make life easier
        if (field === 'ingredientId') {
            const item = inventoryItems.find(i => i.id === parseInt(value));
            if (item && (item.unit.toUpperCase() === 'KG' || item.unit.toUpperCase() === 'LITRE')) {
                 newIngredients[index]['inputUnit'] = 'Small'; // Default to Grams/ml
            } else {
                 newIngredients[index]['inputUnit'] = 'Base';
            }
        }
        setIngredients(newIngredients);
    };

    const addIngredientRow = () => {
        setIngredients([...ingredients, { ingredientId: '', inputQty: '', inputUnit: 'Base' }]);
    };

    const removeIngredientRow = (index) => {
        const newIngredients = [...ingredients];
        newIngredients.splice(index, 1);
        setIngredients(newIngredients);
    };

    const saveRecipe = async () => {
        if (!selectedMenuItem) return alert("Please select a Menu Item first!");
        const token = localStorage.getItem('access_token');

        try {
            for (let ing of ingredients) {
                if (!ing.ingredientId || !ing.inputQty) continue;
                
                // --- THE MAGIC MATH HAPPENS HERE ---
                let finalQuantity = parseFloat(ing.inputQty);
                if (ing.inputUnit === 'Small') {
                    finalQuantity = finalQuantity / 1000; // Convert Grams to KG, or ml to Litre
                }
                
                await axios.post(`${BASE_URL}/recipes/`, {
                    menu_item: selectedMenuItem,
                    ingredient: ing.ingredientId,
                    quantity_required: finalQuantity.toFixed(4) // Save precise 0.0500 in DB
                }, { headers: { Authorization: `Bearer ${token}` } });
            }
            alert("✅ Recipe saved successfully!");
            setIngredients([{ ingredientId: '', inputQty: '', inputUnit: 'Base' }]); 
            setSelectedMenuItem('');
        } catch (error) {
            console.error("Error saving recipe:", error);
            alert("Failed to save recipe. Please check your connection.");
        }
    };

    const getUnitLabels = (id) => {
        const item = inventoryItems.find(i => i.id === parseInt(id));
        if (!item) return { base: 'Unit', small: 'Small Unit' };
        
        const u = item.unit.toUpperCase();
        if (u === 'KG') return { base: 'KG', small: 'Grams (g)' };
        if (u === 'LITRE' || u === 'LITER') return { base: 'Litre (L)', small: 'Milliliter (ml)' };
        return { base: item.unit, small: null }; // Pieces/Packets don't have small units
    };

    return (
        <div className="recipe-builder-container" style={{ padding: '30px' }}>
            <h1 className="recipe-title"><BookOpen size={32} color="#3b82f6" /> Recipe Builder</h1>
            
            <div className="recipe-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>1. Select Menu Item</label>
                <select value={selectedMenuItem} onChange={(e) => setSelectedMenuItem(e.target.value)} style={{ width: '100%', padding: '10px' }}>
                    <option value="">-- Choose an item to build --</option>
                    {menuItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
            </div>

            <div className="recipe-card" style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>2. Add Ingredients per Plate/Serving</h2>
                
                {ingredients.map((ing, index) => {
                    const labels = getUnitLabels(ing.ingredientId);
                    return (
                        <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
                            <select value={ing.ingredientId} onChange={(e) => handleIngredientChange(index, 'ingredientId', e.target.value)} style={{ flex: 2, padding: '10px' }}>
                                <option value="">-- Select Raw Ingredient --</option>
                                {inventoryItems.map(item => <option key={item.id} value={item.id}>{item.name} (Stock: {item.quantity_on_hand} {item.unit})</option>)}
                            </select>
                            
                            <input 
                                type="number" 
                                placeholder="Qty" 
                                value={ing.inputQty}
                                onChange={(e) => handleIngredientChange(index, 'inputQty', e.target.value)}
                                style={{ flex: 1, padding: '10px' }}
                            />
                            
                            <select value={ing.inputUnit} onChange={(e) => handleIngredientChange(index, 'inputUnit', e.target.value)} style={{ flex: 1, padding: '10px', background: '#f1f5f9' }}>
                                <option value="Base">{labels.base}</option>
                                {labels.small && <option value="Small">{labels.small}</option>}
                            </select>
                            
                            <button onClick={() => removeIngredientRow(index)} style={{ padding: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={20} /></button>
                        </div>
                    )
                })}

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                    <button onClick={addIngredientRow} style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '5px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        <Plus size={20} /> Add Ingredient
                    </button>
                    <button onClick={saveRecipe} style={{ padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '5px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        <Save size={20} /> Save Recipe
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipeBuilder;
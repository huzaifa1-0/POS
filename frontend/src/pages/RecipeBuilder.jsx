import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Save, Edit, Utensils } from 'lucide-react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const RecipeBuilder = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [recipes, setRecipes] = useState([]); 
    
    const [selectedMenuItem, setSelectedMenuItem] = useState('');
    const [editingRecipeId, setEditingRecipeId] = useState(null); 
    
    const [ingredients, setIngredients] = useState([
        { ingredientId: '', inputQty: '', inputUnit: 'Base' }
    ]);

    // Load Data
    const fetchData = async () => {
        const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        try {
            const [menuRes, invRes, recipeRes] = await Promise.all([
                axios.get(`${BASE_URL}/menu-items/`, config),
                axios.get(`${BASE_URL}/items/`, config),
                axios.get(`${BASE_URL}/recipes/`, config)
            ]);
            setMenuItems(menuRes.data);
            setInventoryItems(invRes.data);
            setRecipes(recipeRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleIngredientChange = (index, field, value) => {
        const newIngredients = [...ingredients];
        newIngredients[index][field] = value;
        
        if (field === 'ingredientId') {
            const item = inventoryItems.find(i => i.id === parseInt(value));
            if (item && (item.unit.toUpperCase() === 'KG' || item.unit.toUpperCase() === 'LITRE')) {
                 newIngredients[index]['inputUnit'] = 'Small'; 
            } else {
                 newIngredients[index]['inputUnit'] = 'Base';
            }
        }
        setIngredients(newIngredients);
    };

    const addIngredientRow = () => {
        if (editingRecipeId) return; 
        setIngredients([...ingredients, { ingredientId: '', inputQty: '', inputUnit: 'Base' }]);
    };

    const removeIngredientRow = (index) => {
        const newIngredients = [...ingredients];
        newIngredients.splice(index, 1);
        setIngredients(newIngredients);
    };

    // --- SAVE OR UPDATE RECIPE ---
    const saveRecipe = async () => {
        if (!selectedMenuItem) return alert("Please select a Menu Item first!");
        const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');

        try {
            for (let ing of ingredients) {
                if (!ing.ingredientId || !ing.inputQty) continue;
                
                let finalQuantity = parseFloat(ing.inputQty);
                if (ing.inputUnit === 'Small') {
                    finalQuantity = finalQuantity / 1000; 
                }
                
                const payload = {
                    menu_item: selectedMenuItem,
                    ingredient: ing.ingredientId,
                    quantity_required: finalQuantity.toFixed(4)
                };

                if (editingRecipeId) {
                    await axios.put(`${BASE_URL}/recipes/${editingRecipeId}/`, payload, { headers: { Authorization: `Bearer ${token}` } });
                } else {
                    await axios.post(`${BASE_URL}/recipes/`, payload, { headers: { Authorization: `Bearer ${token}` } });
                }
            }
            alert(editingRecipeId ? "✅ Recipe updated successfully!" : "✅ Recipe saved successfully!");
            
            // Reset Form and Refresh Data
            setIngredients([{ ingredientId: '', inputQty: '', inputUnit: 'Base' }]); 
            setSelectedMenuItem('');
            setEditingRecipeId(null);
            fetchData(); 

        } catch (error) {
            console.error("Error saving recipe:", error);
            alert("Failed to save recipe. Please check your connection.");
        }
    };

    const handleEditClick = (recipe) => {
        setSelectedMenuItem(recipe.menu_item);
        setEditingRecipeId(recipe.id);
        
        setIngredients([{
            ingredientId: recipe.ingredient,
            inputQty: parseFloat(recipe.quantity_required).toString(),
            inputUnit: 'Base' 
        }]);

        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };

    const handleDeleteClick = async (recipeId) => {
        if (!window.confirm("Are you sure you want to delete this ingredient from the recipe?")) return;
        
        const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
        try {
            await axios.delete(`${BASE_URL}/recipes/${recipeId}/`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData(); 
        } catch (error) {
            console.error("Error deleting recipe:", error);
            alert("Failed to delete.");
        }
    };

    const getUnitLabels = (id) => {
        const item = inventoryItems.find(i => i.id === parseInt(id));
        if (!item) return { base: 'Unit', small: 'Small Unit' };
        
        const u = item.unit.toUpperCase();
        if (u === 'KG') return { base: 'KG', small: 'Grams (g)' };
        if (u === 'LITRE' || u === 'LITER') return { base: 'Litre (L)', small: 'Milliliter (ml)' };
        return { base: item.unit, small: null }; 
    };

    const getMenuName = (id) => menuItems.find(m => m.id === id)?.name || 'Unknown Item';
    const getInventoryItem = (id) => inventoryItems.find(i => i.id === id) || { name: 'Unknown', unit: '' };

    return (
        <div className="recipe-builder-container" style={{ padding: '30px', maxWidth: '100%', margin: '0', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
            <h1 className="recipe-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <BookOpen size={32} color="#3b82f6" /> Recipe Builder
            </h1>
            
            {/* --- BUILDER FORM (COMBINED INTO ONE CARD) --- */}
            <div className="recipe-card" style={{ background: 'white', padding: '25px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                
                {/* Step 1: Menu Item */}
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px dashed #cbd5e1' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#334155' }}>
                        1. Select Menu Item {editingRecipeId && <span style={{ color: '#ef4444' }}>(Editing Mode)</span>}
                    </label>
                    <select className="recipe-input" value={selectedMenuItem} onChange={(e) => setSelectedMenuItem(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                        <option value="">-- Choose an item to build --</option>
                        {menuItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                </div>

                {/* Step 2: Ingredients */}
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#334155' }}>
                        2. {editingRecipeId ? 'Update Ingredient' : 'Add Ingredients per Plate/Serving'}
                    </h2>
                    
                    {ingredients.map((ing, index) => {
                        const labels = getUnitLabels(ing.ingredientId);
                        return (
                            <div className="ingredient-row-wrapper" key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
                                
                                {/* 1. Full-width Dropdown on top */}
                                <select className="recipe-input" value={ing.ingredientId} onChange={(e) => handleIngredientChange(index, 'ingredientId', e.target.value)} style={{ flex: '1 1 100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                    <option value="">-- Select Raw Ingredient --</option>
                                    {inventoryItems.map(item => <option key={item.id} value={item.id}>{item.name} (Stock: {parseFloat(item.quantity_on_hand).toFixed(2)} {item.unit})</option>)}
                                </select>
                                
                                {/* 2. Qty, Unit, and Delete Button in ONE horizontal row below */}
                                <div className="recipe-qty-row" style={{ display: 'flex', flex: '1 1 100%', gap: '10px', alignItems: 'center' }}>
                                    <input 
                                        className="recipe-input"
                                        type="number" 
                                        placeholder="Qty" 
                                        value={ing.inputQty}
                                        onChange={(e) => handleIngredientChange(index, 'inputQty', e.target.value)}
                                        style={{ flex: '1', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                    
                                    <select className="recipe-input" value={ing.inputUnit} onChange={(e) => handleIngredientChange(index, 'inputUnit', e.target.value)} style={{ flex: '1.5', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                        <option value="Base">{labels.base}</option>
                                        {labels.small && <option value="Small">{labels.small}</option>}
                                    </select>
                                    
                                    {!editingRecipeId && (
                                        <button className="recipe-btn-icon" onClick={() => removeIngredientRow(index)} style={{ width: '45px', flexShrink: 0, padding: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>

                            </div>
                        )
                    })}

                    {/* Action Buttons */}
                    <div className="recipe-action-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '20px' }}>
                        {!editingRecipeId && (
                            <button className="recipe-btn" onClick={addIngredientRow} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                <Plus size={20} /> Add Another Row
                            </button>
                        )}
                        
                        <button className="recipe-btn" onClick={saveRecipe} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: editingRecipeId ? '#f59e0b' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                            <Save size={20} /> {editingRecipeId ? 'Update Recipe' : 'Save Recipe'}
                        </button>

                        {editingRecipeId && (
                             <button className="recipe-btn" onClick={() => { setEditingRecipeId(null); setIngredients([{ ingredientId: '', inputQty: '', inputUnit: 'Base' }]); setSelectedMenuItem(''); }} style={{ padding: '12px 20px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Cancel Edit
                             </button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- EXISTING RECIPES TABLE --- */}
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '15px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Utensils size={24} color="#f97316"/> Current Recipes Database
            </h2>
            
            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ width: '100%', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '15px', color: '#475569' }}>Menu Item</th>
                                <th style={{ padding: '15px', color: '#475569' }}>Raw Ingredient</th>
                                <th style={{ padding: '15px', color: '#475569' }}>Required Quantity</th>
                                <th style={{ padding: '15px', color: '#475569', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recipes.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No recipes created yet.</td>
                                </tr>
                            ) : (
                                recipes.map(recipe => {
                                    const invItem = getInventoryItem(recipe.ingredient);
                                    return (
                                        <tr key={recipe.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '15px', fontWeight: 'bold', color: '#334155' }}>
                                                {getMenuName(recipe.menu_item)}
                                            </td>
                                            <td style={{ padding: '15px', color: '#64748b' }}>
                                                {invItem.name}
                                            </td>
                                            <td style={{ padding: '15px', color: '#10b981', fontWeight: 'bold' }}>
                                                {parseFloat(recipe.quantity_required)} {invItem.unit}
                                            </td>
                                            <td style={{ padding: '15px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => handleEditClick(recipe)} style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }} title="Edit">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(recipe.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }} title="Delete">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RecipeBuilder;
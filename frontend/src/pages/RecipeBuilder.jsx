import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Save } from 'lucide-react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const RecipeBuilder = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [selectedMenuItem, setSelectedMenuItem] = useState('');
    
    // This state holds the dynamic list of ingredients for the current recipe
    const [ingredients, setIngredients] = useState([
        { ingredientId: '', quantity_required: '' }
    ]);

    useEffect(() => {
        // Fetch all menu items and raw inventory items when page loads
        axios.get(`${BASE_URL}/menu-items/`).then(res => setMenuItems(res.data));
        axios.get(`${BASE_URL}/items/`).then(res => setInventoryItems(res.data));
    }, []);

    const handleIngredientChange = (index, field, value) => {
        const newIngredients = [...ingredients];
        newIngredients[index][field] = value;
        setIngredients(newIngredients);
    };

    const addIngredientRow = () => {
        setIngredients([...ingredients, { ingredientId: '', quantity_required: '' }]);
    };

    const removeIngredientRow = (index) => {
        const newIngredients = [...ingredients];
        newIngredients.splice(index, 1);
        setIngredients(newIngredients);
    };

    const saveRecipe = async () => {
        if (!selectedMenuItem) return alert("Please select a Menu Item first!");

        try {
            // Loop through and save each ingredient requirement to the DB
            for (let ing of ingredients) {
                if (!ing.ingredientId || !ing.quantity_required) continue;
                
                await axios.post(`${BASE_URL}/recipes/`, {
                    menu_item: selectedMenuItem,
                    ingredient: ing.ingredientId,
                    quantity_required: ing.quantity_required
                });
            }
            alert("✅ Recipe saved successfully!");
            setIngredients([{ ingredientId: '', quantity_required: '' }]); // Reset form
            setSelectedMenuItem('');
        } catch (error) {
            console.error("Error saving recipe:", error);
            alert("Failed to save recipe. Please check your connection.");
        }
    };

    // Helper to get the unit (e.g., 'KG' or 'Litre') for the placeholder text
    const getUnitForIngredient = (id) => {
        if (!id) return 'Amount';
        const item = inventoryItems.find(i => i.id === parseInt(id));
        return item ? `Qty (${item.unit})` : 'Amount';
    };

    return (
        <div className="recipe-builder-container">
            <h1 className="recipe-title">
                <BookOpen size={32} color="#3b82f6" /> 
                Recipe Builder
            </h1>
            
            <div className="recipe-card">
                <label style={{ display: 'block', fontWeight: 'bold', color: '#475569', marginBottom: '10px' }}>
                    1. Select Menu Item
                </label>
                <select 
                    className="recipe-select"
                    value={selectedMenuItem} 
                    onChange={(e) => setSelectedMenuItem(e.target.value)}
                >
                    <option value="">-- Choose an item to build --</option>
                    {menuItems.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>
            </div>

            <div className="recipe-card">
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#334155', marginBottom: '20px' }}>
                    2. Add Ingredients (BOM)
                </h2>
                
                {ingredients.map((ing, index) => (
                    <div key={index} className="ingredient-row">
                        <select 
                            className="ingredient-select"
                            value={ing.ingredientId} 
                            onChange={(e) => handleIngredientChange(index, 'ingredientId', e.target.value)}
                        >
                            <option value="">-- Select Raw Ingredient --</option>
                            {inventoryItems.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name} (Unit: {item.unit})
                                </option>
                            ))}
                        </select>
                        
                        <input 
                            type="number" 
                            step="0.001"
                            placeholder={getUnitForIngredient(ing.ingredientId)} 
                            className="ingredient-qty"
                            value={ing.quantity_required}
                            onChange={(e) => handleIngredientChange(index, 'quantity_required', e.target.value)}
                        />
                        
                        <button 
                            onClick={() => removeIngredientRow(index)}
                            className="btn-remove"
                            title="Remove Row"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}

                <div className="recipe-actions">
                    <button onClick={addIngredientRow} className="btn-add-ingredient">
                        <Plus size={20} />
                        Add Another Ingredient
                    </button>

                    <button onClick={saveRecipe} className="btn-save-recipe">
                        <Save size={20} />
                        Save Recipe
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipeBuilder;
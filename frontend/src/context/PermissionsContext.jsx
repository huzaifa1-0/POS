import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

    useEffect(() => {
        const token = sessionStorage.getItem('access_token');
        
        if (!token) {
            setLoading(false);
            return; 
        }

        axios.get(`${API_BASE_URL}/auth/permissions/`, {
            headers: { Authorization: `Bearer ${token}` } 
        })
        .then(res => {
            setPermissions(res.data.permissions);
            setLoading(false);
        })
        .catch(err => {
            console.error("Failed to load permissions", err);
            setLoading(false);
        });
    }, []);

    // Helper function to check if user has a permission
    const hasPermission = (requiredPermission) => {
        if (permissions.includes("*")) return true; // Admin override
        return permissions.includes(requiredPermission);
    };

    return (
        <PermissionsContext.Provider value={{ permissions, hasPermission, loading }}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => useContext(PermissionsContext);
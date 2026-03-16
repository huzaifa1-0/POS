import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch permissions from the endpoint we created in Step 3
        // Note: Assuming you are passing the JWT token in headers
        axios.get('http://localhost:8000/api/auth/permissions/', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
import React from 'react';
import { usePermissions } from '../context/PermissionsContext';

// Use this to wrap Buttons, Links, or sections of a page
const Can = ({ permission, children }) => {
    const { hasPermission, loading } = usePermissions();

    if (loading) return null; // Or a small spinner

    return hasPermission(permission) ? children : null;
};

export default Can;
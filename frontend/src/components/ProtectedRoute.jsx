import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../context/PermissionsContext';

// Use this to wrap entire Pages in your router
const ProtectedRoute = ({ permission, children }) => {
    const { hasPermission, loading } = usePermissions();

    if (loading) return <div>Loading...</div>;

    if (!hasPermission(permission)) {
        // Redirect them to a "403 Not Authorized" page or dashboard
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;
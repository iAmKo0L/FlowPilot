import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');

  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userString);
  const userRoles: string[] = user.roles || [];

  if (allowedRoles && !allowedRoles.some((role) => userRoles.includes(role))) {
    if (userRoles.includes('ADMIN')) return <Navigate to="/admin/workflows" replace />;
    if (userRoles.includes('REQUESTER')) return <Navigate to="/requests" replace />;
    if (userRoles.includes('APPROVER')) return <Navigate to="/tasks" replace />;
    if (userRoles.includes('MONITOR')) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

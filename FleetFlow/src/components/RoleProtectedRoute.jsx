import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F4F7FE]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  if (!currentUser) {
    // User is not logged in, redirect to login page
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // User is logged in but does not have the required role
    console.warn(`Access denied for role: ${role}. Required: ${allowedRoles.join(", ")}`);
    return <Navigate to="/dashboard" replace />;
  }

  // User is logged in and has the required role, render the component
  return children;
};

export default RoleProtectedRoute;

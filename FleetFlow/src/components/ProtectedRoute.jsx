import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // User is not logged in, redirect to login page
    return <Navigate to="/" replace />;
  }

  // User is logged in, render the protected component
  return children;
};

export default ProtectedRoute;

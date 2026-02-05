import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = () => {
  const location = useLocation();
  
  // Check for token in localStorage
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  // Check for token in URL parameters (for OAuth/External login redirection)
  // This ensures we don't block the initial login redirect that contains the token
  const searchParams = new URLSearchParams(location.search);
  const urlToken = searchParams.get('token');

  // If we have a token (either in storage or URL), render the child routes
  // We also check for user object in storage to be safe, but URL token takes precedence for login flow
  if ((token && user) || urlToken) {
    return <Outlet />;
  }

  // If not authenticated, redirect to login page
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;

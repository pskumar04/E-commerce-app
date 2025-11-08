import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: '0.5rem 1rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
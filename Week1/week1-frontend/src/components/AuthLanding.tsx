import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthLanding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    console.log('[AuthLanding] isLoading:', isLoading, '| isAuthenticated:', isAuthenticated);
    
    // Wait for AuthContext to finish loading
    if (!isLoading && !hasChecked) {
      setHasChecked(true);
      
      if (isAuthenticated) {
        console.log('[AuthLanding] Auth successful, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('[AuthLanding] Auth failed, redirecting to login');
        // Clear any partial auth state
        localStorage.removeItem('auth_token');
        navigate('/login', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, navigate, hasChecked]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      gap: '20px'
    }}>
      <div className="loading-spinner"></div>
      <div>Processing authentication...</div>
    </div>
  );
};

export default AuthLanding;

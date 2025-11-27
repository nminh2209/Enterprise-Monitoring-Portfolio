import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthLanding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for AuthContext to process the token, then redirect to dashboard
    // (AuthContext will extract and save the token from the URL)
    // Give a short delay to ensure token is processed
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [navigate, location]);

  return <div>Processing authentication...</div>;
};

export default AuthLanding;

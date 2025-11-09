import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add the updateUser function
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Add this to your AuthContext.js, inside the AuthProvider component
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Cleanup
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
          // Simple verification - just use the saved user data
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // ✅ FRONTEND Register function - KEEP THIS
  const register = async (userData) => {
    try {
      console.log('🔍 [DEBUG] Registration attempt:', { ...userData, password: '***' });
      
      const response = await axios.post(`${config.apiUrl}/api/auth/register`, userData);
      
      // ✅ CHECK IF REGISTRATION WAS SUCCESSFUL
      if (response.data.success) {
        const { token, user } = response.data;
        
        if (!token) {
          throw new Error('No token received from server');
        }

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        
        console.log('✅ [DEBUG] Registration successful');
        return { success: true };
      } else {
        // ✅ HANDLE BACKEND ERRORS (like duplicate email)
        console.log('❌ [DEBUG] Backend registration failed:', response.data.message);
        return { 
          success: false, 
          message: response.data.message || 'Registration failed' 
        };
      }
      
    } catch (error) {
      console.error('❌ [DEBUG] Registration error:', error);
      
      // ✅ IMPROVED ERROR HANDLING
      if (error.response?.data?.success === false) {
        // Backend returned an error with success: false (like duplicate email)
        console.log('❌ [DEBUG] Backend error response:', error.response.data);
        return { 
          success: false, 
          message: error.response.data.message 
        };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    }
  };

  // ✅ FRONTEND Login function - KEEP THIS
// In your AuthContext.js, update the login function:
// In your src/context/AuthContext.js, update the login function:

const login = async (email, password) => {
  try {
    console.log('Attempting login with:', { email });
    
    const response = await axios.post(`${config.apiUrl}/api/auth/login`, {
      email,
      password
    });

    console.log('Login response:', response.data);

    // Check if login was successful
    if (response.data.token && response.data.user) {
      const userData = response.data.user;
      const token = response.data.token;

      // Validate user data
      if (!userData._id || !userData.email) {
        throw new Error('Invalid user data received from server');
      }

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // ✅ IMPORTANT: Update user state immediately
      setUser(userData);
      
      // ✅ Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('✅ Login successful, user stored:', userData.email);
      
      return { success: true, user: userData };
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  } catch (error) {
    console.error('❌ Login error details:', error);
    
    let errorMessage = 'Login failed';
    
    if (error.response) {
      // Server responded with error status
      errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'No response from server. Check if backend is running.';
    } else {
      // Something else happened
      errorMessage = error.message;
    }
    
    // Clear any invalid tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    
    return { 
      success: false, 
      message: errorMessage 
    };
  }
};

  // ❌ DELETE THIS ENTIRE BACKEND ROUTE SECTION
  /*
  router.post('/register', async (req, res) => {
    // ... all the backend code
  });
  */

  // ✅ FRONTEND Logout function - KEEP THIS
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };
  const hasRole = (requiredRole) => {
    return user && user.role === requiredRole;
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
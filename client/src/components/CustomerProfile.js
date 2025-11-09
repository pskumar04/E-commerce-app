import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import config from '../config';
import { toast } from 'react-toastify';

const CustomerProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    mobile: '',
    alternateMobile: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    dateOfBirth: '',
    gender: ''
  });

  // Use refs to track if we've already loaded the profile
  const hasLoadedProfile = useRef(false);
  const toastShown = useRef(false);

  // Get auth token with better error handling
  const getAuthToken = () => {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  useEffect(() => {
    // Only fetch profile if we have a user and haven't loaded it yet
    if (user && !hasLoadedProfile.current) {
      fetchUserProfile();
    } else if (!user) {
      setProfileLoading(false);
    }
  }, [user]); // Only depend on user

  const fetchUserProfile = async () => {
    // Prevent multiple simultaneous calls
    if (hasLoadedProfile.current) {
      return;
    }

    try {
      setProfileLoading(true);
      hasLoadedProfile.current = true;
      
      const token = getAuthToken();
      
      if (!token) {
        console.log('No token found, using context user data');
        // Use data from AuthContext if available
        if (user) {
          setProfile({
            name: user.name || '',
            email: user.email || '',
            mobile: user.mobile || '',
            alternateMobile: user.alternateMobile || '',
            address: user.address || {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: 'India'
            },
            dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
            gender: user.gender || ''
          });
        }
        setProfileLoading(false);
        return;
      }

      console.log('Fetching profile from API...');
      const response = await axios.get(`${config.apiUrl}/api/auth/profile`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Profile API response:', response.data);
      
      if (response.data) {
        const userData = response.data;
        
        setProfile({
          name: userData.name || user.name || '',
          email: userData.email || user.email || '',
          mobile: userData.mobile || user.mobile || '',
          alternateMobile: userData.alternateMobile || user.alternateMobile || '',
          address: userData.address || user.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India'
          },
          dateOfBirth: userData.dateOfBirth 
            ? new Date(userData.dateOfBirth).toISOString().split('T')[0] 
            : (user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''),
          gender: userData.gender || user.gender || ''
        });

        // Update AuthContext with fresh data
        updateUser({ ...user, ...userData });
        
        // Only show toast once and only if we successfully loaded from API
        if (!toastShown.current) {
          toast.success('Profile loaded successfully');
          toastShown.current = true;
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // Reset the flag so we can retry if needed
      hasLoadedProfile.current = false;
      
      // Use AuthContext data as fallback
      if (user) {
        console.log('Using AuthContext data as fallback');
        setProfile({
          name: user.name || '',
          email: user.email || '',
          mobile: user.mobile || '',
          alternateMobile: user.alternateMobile || '',
          address: user.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India'
          },
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
          gender: user.gender || ''
        });
        
        if (error.response?.status === 401) {
          if (!toastShown.current) {
            toast.error('Session expired. Please login again.');
            toastShown.current = true;
          }
        } else if (error.response?.status === 404) {
          if (!toastShown.current) {
            toast.info('Using cached profile data');
            toastShown.current = true;
          }
        } else {
          if (!toastShown.current) {
            toast.info('Using cached profile data. Some features may be limited.');
            toastShown.current = true;
          }
        }
      } else {
        if (error.response?.status === 401) {
          toast.error('Please login to view your profile');
        } else if (error.response?.status === 404) {
          toast.error('Profile not found. Please contact support.');
        } else if (error.code === 'ECONNABORTED') {
          toast.error('Request timeout. Please check your connection.');
        } else if (error.message === 'Network Error') {
          toast.error('Network error. Please check your internet connection.');
        } else {
          toast.error('Failed to load profile. Using cached data.');
        }
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setProfile(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!profile.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!profile.email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);

    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error('Please login to update your profile');
        setLoading(false);
        return;
      }

      console.log('Updating profile with data:', profile);
      
      const response = await axios.put(
        `${config.apiUrl}/api/auth/profile`, 
        profile,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('Profile update response:', response.data);
      
      // Update user context with new data
      if (response.data.user) {
        updateUser({ ...user, ...response.data.user });
      } else {
        updateUser({ ...user, name: profile.name });
      }
      
      toast.success('Profile updated successfully!');
      
      // Reset flags to allow reloading
      hasLoadedProfile.current = false;
      toastShown.current = false;
      
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please try again.');
      } else if (error.message === 'Network Error') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const currentPassword = prompt('Enter current password:');
    if (!currentPassword) {
      toast.error('Current password is required');
      return;
    }

    const newPassword = prompt('Enter new password:');
    if (!newPassword) {
      toast.error('New password is required');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    const confirmPassword = prompt('Confirm new password:');
    if (!confirmPassword) {
      toast.error('Please confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error('Please login to change password');
        return;
      }

      await axios.put(`${config.apiUrl}/api/auth/change-password`, {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  // Show loading state
  if (profileLoading) {
    return (
      <div style={{ 
        padding: '2rem', 
        maxWidth: '800px', 
        margin: '0 auto',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Loading your profile...</div>
          <div>Please wait while we load your information</div>
        </div>
      </div>
    );
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div style={{ 
        padding: '2rem', 
        maxWidth: '800px', 
        margin: '0 auto',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Please Login</h2>
          <p>You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto',
      minHeight: '80vh'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '15px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>My Profile</h1>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
            Manage your personal information and preferences
          </p>
        </div>

        {/* Profile Form - REST OF YOUR JSX REMAINS EXACTLY THE SAME */}
        {/* ... (keep all your existing JSX code exactly as it was) ... */}
        <div style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {/* Personal Information */}
              <div>
                <h3 style={{ 
                  color: '#333', 
                  marginBottom: '1rem',
                  borderBottom: '2px solid #667eea',
                  paddingBottom: '0.5rem'
                }}>
                  Personal Information
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600',
                    color: '#555'
                  }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e8ed',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e1e8ed'}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600',
                    color: '#555'
                  }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    required
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e8ed',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: '#f8f9fa',
                      color: '#666'
                    }}
                  />
                  <small style={{ color: '#999', fontSize: '0.8rem' }}>
                    Email cannot be changed
                  </small>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600',
                    color: '#555'
                  }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={profile.dateOfBirth}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e8ed',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600',
                    color: '#555'
                  }}>
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={profile.gender}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e8ed',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'white'
                    }}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 style={{ 
                  color: '#333', 
                  marginBottom: '1rem',
                  borderBottom: '2px solid #667eea',
                  paddingBottom: '0.5rem'
                }}>
                  Contact Information
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600',
                    color: '#555'
                  }}>
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={profile.mobile}
                    onChange={handleInputChange}
                    required
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e8ed',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: '#f8f9fa',
                      color: '#666'
                    }}
                  />
                  <small style={{ color: '#999', fontSize: '0.8rem' }}>
                    Primary mobile number cannot be changed
                  </small>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600',
                    color: '#555'
                  }}>
                    Alternate Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="alternateMobile"
                    value={profile.alternateMobile}
                    onChange={handleInputChange}
                    placeholder="Optional alternate number"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e8ed',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                {/* Address Fields */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600',
                    color: '#555'
                  }}>
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address.street"
                    value={profile.address.street}
                    onChange={handleInputChange}
                    placeholder="House no., Street, Area"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e1e8ed',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: '600',
                      color: '#555',
                      fontSize: '0.9rem'
                    }}>
                      City
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={profile.address.city}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e1e8ed',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: '600',
                      color: '#555',
                      fontSize: '0.9rem'
                    }}>
                      State
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={profile.address.state}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e1e8ed',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: '600',
                      color: '#555',
                      fontSize: '0.9rem'
                    }}>
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={profile.address.zipCode}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e1e8ed',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: '600',
                      color: '#555',
                      fontSize: '0.9rem'
                    }}>
                      Country
                    </label>
                    <input
                      type="text"
                      name="address.country"
                      value={profile.address.country}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e1e8ed',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center',
              borderTop: '1px solid #e1e8ed',
              paddingTop: '2rem',
              flexWrap: 'wrap'
            }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '1rem 2rem',
                  background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  minWidth: '150px',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>

              <button
                type="button"
                onClick={handleChangePassword}
                style={{
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  minWidth: '150px'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import config from '../config';
import { toast } from 'react-toastify';

const CustomerProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to view profile');
        return;
      }

      const response = await axios.get(`${config.apiUrl}/api/auth/profile`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      const userData = response.data;
      
      setProfile({
        name: userData.name || '',
        email: userData.email || '',
        mobile: userData.mobile || '',
        alternateMobile: userData.alternateMobile || '',
        address: userData.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India'
        },
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
        gender: userData.gender || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      if (error.response?.status === 401) {
        toast.error('Please login again');
      } else if (error.response?.status === 404) {
        toast.error('User profile not found');
      } else {
        toast.error('Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
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
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${config.apiUrl}/api/auth/profile`, 
        profile,
        {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      // Update user context with new name
      updateUser({ ...user, name: profile.name });
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.response?.status === 401) {
        toast.error('Please login again');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Rest of your component remains the same...
  // [Keep all the JSX and other functions as they were]

  const handleChangePassword = async () => {
    const currentPassword = prompt('Enter current password:');
    const newPassword = prompt('Enter new password:');
    const confirmPassword = prompt('Confirm new password:');

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      await axios.put(`${config.apiUrl}/api/auth/change-password`, {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

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

        {/* Profile Form */}
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
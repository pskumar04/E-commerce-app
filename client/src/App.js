import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from './config';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/health`);
      setBackendStatus('✅ Connected');
      console.log('Backend response:', response.data);
    } catch (error) {
      setBackendStatus('❌ Failed to connect');
      console.error('Backend connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="App">
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <h1>Loading HappyCart...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>🎉 HappyCart E-Commerce 🎉</h1>
        <p>Frontend: <strong>✅ Deployed on Vercel</strong></p>
        <p>Backend: <strong>{backendStatus}</strong></p>
        <p>Backend URL: {config.apiUrl}</p>
        
        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={checkBackendConnection}
            style={{ padding: '10px 20px', margin: '5px' }}
          >
            Test Backend Connection
          </button>
          <button 
            onClick={() => window.open(config.apiUrl, '_blank')}
            style={{ padding: '10px 20px', margin: '5px' }}
          >
            Open Backend API
          </button>
        </div>

        <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
          <h3>Next Steps:</h3>
          <p>1. If backend shows ✅ Connected, your API is working!</p>
          <p>2. Now you can add your actual components</p>
          <p>3. Update all API calls to use: `{`${config.apiUrl}/api/endpoint`}`</p>
        </div>
      </div>
    </div>
  );
}

export default App;
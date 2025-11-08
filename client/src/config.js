const config = {
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://ecommerce-backend-9aps.onrender.com'  // Your Render backend URL
    : 'http://localhost:5000'
};
// console.log('API URL:', config.apiUrl);
export default config;
const debugRequest = (req, res, next) => {
  console.log('=== REQUEST DEBUG INFO ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Raw Body:', req.body);
  console.log('Body Keys:', Object.keys(req.body || {}));
  console.log('Phone field exists:', 'phone' in (req.body || {}));
  console.log('Phone value:', req.body?.phone);
  console.log('=== END DEBUG INFO ===');
  next();
};

module.exports = debugRequest;
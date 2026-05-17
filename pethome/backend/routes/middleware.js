const jwt = require('jsonwebtoken');
const JWT_SECRET = 'pethome_secret_2025';

// التحقق من الـ token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ error: 'Access denied. Please login.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// التحقق إن الـ user shelter أو rescuer
function isShelter(req, res, next) {
  if (req.user.role !== 'shelter' && req.user.role !== 'rescuer' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only shelters/rescuers can perform this action' });
  }
  next();
}

// التحقق إن الـ user adopter
function isAdopter(req, res, next) {
  if (req.user.role !== 'adopter' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only adopters can perform this action' });
  }
  next();
}

module.exports = { verifyToken, isShelter, isAdopter };
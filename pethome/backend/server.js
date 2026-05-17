const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize database (Singleton)
require('./database');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/requests', require('./routes/requests'));

// Notifications route
app.get('/api/notifications', require('./routes/middleware').verifyToken, async (req, res) => {
  const { notificationService } = require('./NotificationObserver');
  try {
    const notifications = await notificationService.getForUser(req.user.id);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notifications/:id/read', require('./routes/middleware').verifyToken, async (req, res) => {
  const { notificationService } = require('./NotificationObserver');
  try {
    await notificationService.markAsRead(req.params.id, req.user.id);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback - serve index.html
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 PetHome server running on http://localhost:${PORT}`);
  console.log(`📁 Frontend served from /frontend`);
  console.log(`🔗 API available at http://localhost:${PORT}/api`);
});
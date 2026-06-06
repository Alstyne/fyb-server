const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/db');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🎓 FYB API is running' });
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/invites', require('./routes/invites'));
app.use('/users', require('./routes/users'));
app.use('/memories', require('./routes/memories'));
app.use('/comments', require('./routes/comments'));
app.use('/likes', require('./routes/likes'));
app.use('/upload', require('./routes/upload'));
app.use('/carousel', require('./routes/carousel'));
app.use('/admin', require('./routes/admin'));
app.use('/feed',  require('./routes/feed'));
app.use('/wall',  require('./routes/wall'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
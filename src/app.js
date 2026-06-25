const express = require('express');
const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/event.routes');
const errorHandler = require('./middleware/errorHandler');
const { sendSuccess } = require('./utils/response');
const {
  helmetMiddleware,
  corsMiddleware,
  globalRateLimiter,
} = require('./middleware/security');

const app = express();

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(globalRateLimiter);
app.use(express.json({ limit: '10kb' }));

app.get('/health', (req, res) => {
  sendSuccess(res, {
    message: 'Virtual Event Management API is running.',
  });
});

app.use(authRoutes);
app.use('/events', eventRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
  });
});

app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({
      success: false,
      message: 'Origin not allowed by CORS policy.',
    });
  }

  next(err);
});

app.use(errorHandler);

module.exports = app;

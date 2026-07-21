exports.corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.ADMIN_PANEL_URL,
      process.env.ADMIN_URL,
    ].filter(Boolean);

    const isLocalhost = origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    if (!origin || allowedOrigins.includes(origin) || isLocalhost) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

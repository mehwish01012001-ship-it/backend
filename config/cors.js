exports.corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.ADMIN_PANEL_URL,
      process.env.ADMIN_URL,
    ]
      .filter(Boolean)
      .map((value) => String(value).trim());

    const normalizedOrigin = origin ? String(origin).trim() : undefined;
    const isLocalhost = normalizedOrigin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin);
    const isAllowedOrigin =
      !normalizedOrigin ||
      isLocalhost ||
      allowedOrigins.includes(normalizedOrigin) ||
      allowedOrigins.length === 0;

    if (isAllowedOrigin) {
      callback(null, true);
    } else {
      console.warn(`CORS origin rejected: ${normalizedOrigin}. Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

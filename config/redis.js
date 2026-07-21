const redis = require('redis');

let client;

exports.connectRedis = async () => {
  if (client) return client;

  client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  });

  client.on('error', (err) => console.error('Redis client error', err));
  await client.connect();
  return client;
};

exports.getRedisClient = () => client;

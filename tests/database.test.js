const test = require('node:test');
const assert = require('node:assert/strict');

const databaseModulePath = require.resolve('../config/database');

test('connectDB should not exit the process when MongoDB is unavailable', async () => {
  const originalUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;
  delete require.cache[databaseModulePath];

  const connectDB = require('../config/database');
  const originalExit = process.exit;
  let exitCalled = false;

  process.exit = (code) => {
    exitCalled = true;
    throw new Error(`process.exit:${code}`);
  };

  try {
    const result = await connectDB();
    assert.equal(result, false);
    assert.equal(exitCalled, false);
  } finally {
    process.exit = originalExit;
    if (originalUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalUri;
    }
    delete require.cache[databaseModulePath];
  }
});

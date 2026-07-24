const test = require('node:test');
const assert = require('node:assert/strict');

const User = require('../models/User');
const customerController = require('../controllers/users/customerController');

test('deleteCustomer removes the customer and returns success', async () => {
  const originalFindByIdAndDelete = User.findByIdAndDelete;
  let deletedId = null;

  User.findByIdAndDelete = async (id) => {
    deletedId = id;
    return { _id: id, email: 'deleted@example.com' };
  };

  try {
    const req = { params: { id: 'customer-123' } };
    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
      },
    };

    await customerController.deleteCustomer(req, res);

    assert.equal(deletedId, 'customer-123');
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'Customer deleted successfully');
  } finally {
    User.findByIdAndDelete = originalFindByIdAndDelete;
  }
});

const express = require('express');
const userController = require('./user.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { registerSchema } = require('../auth/auth.validation');

const router = express.Router();

router.post('/', authenticate, authorize('admin'), validateRequest(registerSchema), userController.register);
router.get('/me', authenticate, userController.getProfile);

module.exports = router;

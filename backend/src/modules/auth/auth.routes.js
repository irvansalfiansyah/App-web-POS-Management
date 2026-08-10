const express = require('express');
const authController = require('./auth.controller');
const validateRequest = require('../../middlewares/validateRequest');
const { loginSchema } = require('./auth.validation');

const router = express.Router();

router.post('/login', validateRequest(loginSchema), authController.login);

module.exports = router;

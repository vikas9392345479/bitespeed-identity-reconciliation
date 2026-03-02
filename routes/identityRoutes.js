const express = require('express');
const router = express.Router();
const identityController = require('../controllers/identityController');

// This defines the POST endpoint required by the task
router.post('/identify', identityController.identify);

module.exports = router;
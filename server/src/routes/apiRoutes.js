const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController.js');

// API Endpoints
router.post('/api/links', linkController.createLink);
router.get('/api/links', linkController.getAllLinks);
router.get('/api/links/:code', linkController.getLinkStats);
router.delete('/api/links/:code', linkController.deleteLink);

// Redirect Endpoint (Root level /:code)
router.get('/:code', linkController.redirectLink);

// Health Check
router.get('/healthz', (req, res) => {
  res.status(200).json({ ok: true, version: "1.0" });
});

module.exports = router;
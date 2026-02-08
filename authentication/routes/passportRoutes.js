const express = require('express');

const router = express.Router();

const disabled = (req, res) => {
  return res.status(501).json({
    message: 'OAuth login is not enabled for this environment.'
  });
};

router.get('/google', disabled);
router.get('/google/redirect', disabled);
router.get('/facebook', disabled);
router.get('/facebook/redirect', disabled);
router.get('/twitter', disabled);
router.get('/twitter/redirect', disabled);
router.get('/discord', disabled);
router.get('/discord/redirect', disabled);
router.post('/complete-registration', disabled);

module.exports = router;

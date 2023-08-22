const express = require('express');

const router = new express.Router();

// Basic route to wake up heroku backend before real calls are made
router.get('/wakeup', function (req, res, next) {
    try {
        return res.json({status: 'awakened'});
    } catch(err) {
        return next(err);
    };
});

module.exports = router;
var express = require('express');
var router = express.Router();


router.post('/', function(req, res, next) {
    let query = req.query;
    res.json({status: 'success'});

    console.log(query)

});

module.exports = router;
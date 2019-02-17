const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
    let isDBAccess = require('../model').DB_ACCESS();
    if (isDBAccess){
        res.status(200).send();
    }
    else{
        res.status(500).send("THE DATABASE IS NOT AVALIABLE")
    }
});

module.exports = router;

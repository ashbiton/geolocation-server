const express = require('express');
const router = express.Router();
const debug = require('debug')('geolocation-server:server');
const Distance = require('../model').MODEL("Distance");

router.get('/', async function(req, res, next) {
    let isDBAccess = require('../model').DB_ACCESS();
    if (isDBAccess){
        try
        {
            let doc = await Distance.MAX_HITS();
            debug(doc);
            res.status(200).send({source: doc[0].place1 , destination: doc[0].place2 , hits: doc[0].hits});

        }catch(err){
            res.status(500).send("THE APPLICATION HAS ENCOUNTERED A PROBLEM")
        }
    }
    else{
        res.status(500).send("THE DATABASE IS NOT AVALIABLE")
    }
});

module.exports = router;

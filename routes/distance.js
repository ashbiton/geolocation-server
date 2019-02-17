var express = require('express');
var debug = require('debug')('geolocation-server:server');
var router = express.Router();
const axios = require('axios');
const API_KEY = "YOUR_API_KEY";


// this function returns the distance in KMs between a single source and single destination
// using Google Matrix API to calculate the distance
router.get('/', async function (req, res, next) {
    let query = req.query;
    if (!query || !query.destination || !query.source) {
        res.status(400).send("GET REQUEST MUST INCLUDE SOURCE AND DESTINATION");
    }
    else {
        try {
            let fullRes = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${query.source}&destinations=${query.destination}&key=${API_KEY}`)
            let status = fullRes.data.status;
            if (status !== "OK") {
                res.status(500).send(`GEOLOCATION API UNABLE TO PROVIDE DATA. STATUS: ${status}`);
            }
            let result = fullRes.data.rows[0].elements[0];
            if (result.status !== "OK") {
                res.status(500).send(result.status);
            }
            else {
                debug(result);
                let distanceInMeters = result.distance.value;
                let distance = Math.fround(distanceInMeters % 1000);
                res.status(200).send({ distance: distance });
            }
        }
        catch (error) {
            debug(error)
            res.status(500).send(`GEOLOCATION API UNAVALIABLE`);
        }
    }



});

module.exports = router;

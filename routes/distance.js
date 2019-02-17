const express = require('express');
const debug = require('debug')('geolocation-server:server');
const router = express.Router();
const axios = require('axios');
const API_KEY = "YOUR_API_KEY";
let Distance = require('../model').MODEL("Distance")

// since the distance stays the same no matter which one is the source and which one is the destination
// we set it so the source is always the place which comes first in alphabetical order
objectPlacesOrdered=(source , destination)=>{
    let compare = destination.localeCompare(source);
    return {place1: compare > 0 ? source : destination,
        place2: compare > 0 ? destination : source};
}

// this function returns the distance in KMs between a single source and single destination
// using Google Matrix API to calculate the distance
router.get('/', async function (req, res, next) {
    let query = req.query;
    if (!query || !query.destination || !query.source) {
        res.status(400).send("GET REQUEST MUST INCLUDE SOURCE AND DESTINATION");
    }
    else {
        const destination = query.destination;
        const source = query.source;
        let isDBAccess = require('../model').DB_ACCESS();
        debug("isDBAccess: "+isDBAccess);
        let isDocExists = false;
        if (isDBAccess){
            try{
                let document = await Distance.REQUEST(objectPlacesOrdered(source,destination));
                if (document){
                    isDocExists = true;
                    let distance = document.distance;
                    Distance.findOneAndUpdate({_id: document._id},{hits : document.hits + 1},(err,doc,res)=>{
                        if (err){
                            debug("failed to update the hits field in the doc");
                        }else {
                            debug("successfully updated the number of hits");
                        }
                    });
                    res.status(200).send({distance: (distance / 1000).toFixed(2)})
                }
            }
            catch(error){
                isDBAccess = false;
            }
        }
       
        if (!isDBAccess || !isDocExists){  
            try {
                let fullRes = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${source}&destinations=${destination}&key=${API_KEY}`)
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
                    if (isDBAccess) // if there is access to the db , it means there was no document for this pair of places
                    {
                        let distanceObj = objectPlacesOrdered(source,destination);
                        distanceObj.distance = distanceInMeters;
                        try {
                            await Distance.CREATE(distanceObj);
                            debug("success in creating a new distance document");
                        }
                        catch(error){
                            debug("error creating a new doc: "+error)
                        }

                    }
                    res.status(200).send({ distance: (distanceInMeters / 1000).toFixed(2) });
                }
            }
            catch (error) {
                debug(error)
                res.status(500).send(`GEOLOCATION API UNAVALIABLE`);
            }
        }
    }



});

module.exports = router;

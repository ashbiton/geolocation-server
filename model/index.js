const debug = require("debug")("mongo:model");
const mongo = require("mongoose");
let db = mongo.createConnection();
(async () => {
    try {
        await db.openUri('mongodb://localhost/geoserverdb');
    } catch (err) {
        debug("Error connecting to DB: " + err);
    }
})();
debug('Pending DB connection');
require("./distance")(db);
module.exports.DB_ACCESS = () => db.readyState == 1;
module.exports.MODEL = model => db.model(model);	

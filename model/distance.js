const debug = require("debug")("mongo:model-distance");
const mongo = require("mongoose");

module.exports = db => {
    let schema = new mongo.Schema({
        place1: { type: String, required: true },
        place2: { type: String, required: true },
        distance: {type : Number , required: true},
        hits: {type: Number , default: 1}
    });

    schema.statics.CREATE = function (distance) {
        return this.create(distance);
    }
    
    schema.statics.REQUEST = async function () {
        // no arguments - bring all at once
        const args = Array.from(arguments); // [...arguments]
        if (args.length === 0) {
            debug("request: no arguments - bring all at once");
            return this.find({}).exec();
        }

        // perhaps last argument is a callback for every single document
        let callback = arguments[arguments.length - 1];
        if (callback instanceof Function) {
            let asynch = callback.constructor.name === 'AsyncFunction';
            debug(`request: with ${asynch?'async':'sync'} callback`);
            args.pop();
            let cursor, distance;
            try {
                cursor = await this.find(...args).cursor();
            } catch (err) { throw err; }
            try {
                while (null !== (distance = await cursor.next())) {
                    if (asynch) {
                        try {
                            await callback(distance);
                        } catch (err) { throw err; }
                    }
                    else {
                        callback(distance);
                    }
                }
            } catch (err) { throw err; }
            return;
        }

        // request by id as a hexadecimal string
        if (args.length === 1 && typeof args[0] === "string") {
            debug("request: by ID");
            return this.findById(args[0]).exec();
        }

        // There is no callback - bring requested at once
        debug(`request: without callback: ${JSON.stringify(args)}`);
        return this.findOne(...args).exec();
    };

    schema.statics.MAX_HITS = async function () {
        return this.find().sort({hits:-1}).limit(1).exec();
    }

    db.model('Distance', schema, 'Distances'); 
}
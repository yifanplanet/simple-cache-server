const router = require("express").Router();
const { Cache } = require("../utils/Cache");

const EVICTION_POLICY = Object.freeze({
	OLDEST_FIRST: 1,
	NEWEST_FIRST: 2,
	REJECT: 3
})

//Set cache memory default duration and size
//Cache(duration, size) 
const memory = new Cache(3600, 10000, EVICTION_POLICY.REJECT);
console.info("Cache Size: " + memory.getSize());

router.get("/:key", function (req, res, next) {
    try {
        const result = memory.getObject(req.params.key);
        if (result) {
            res.status(200).json(result);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        next(error);
    }
});

router.post("/:key", setKey);
router.put("/:key", setKey);

function setKey(req, res, next) {
    try {
        if (!req.params.key) {
            res.status(404).json("Key is required");
        }
        if (!req.body.object) {
            res.status(404).json("Body with object is required");
        }
        const item = {
            key: req.params.key,
            value: req.body.object,
            ttl: req.query.ttl
        }
        if (memory.setObject(item)) {
            res.status(200).json(`Set object at [${req.params.key}]`);
        } else {
            res.status(507).json(`Server has no storage`);
        }
    } catch (error) {
        next(error);
    }
}

router.delete("/:key", function (req, res, next) {
    try {
        const result = memory.deleteObject(req.params.key);
        if (result) {
            res.status(200).json(`Object at key [${req.params.key}] has been deleted`);
        } else {
            res.status(404).json(`Object at key [${req.params.key}] not found or expired`);
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
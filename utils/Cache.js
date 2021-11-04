
// 
//  @param duration TTL // default 3600
//  @param size Maximum number of objects to be stored simultaneously in the server’s memory // default 10000
//  
module.exports.Cache = function (duration = 3600, size = 10000, policy = 3) {
    if (!duration) {
        throw Error("Duration cannot be empty");
    }
    if (isNaN(duration)) {
        throw Error("Duration is not a number");
    }
    if (duration < 0) {
        throw Error("Duration must be positive");
    }
    if (!size) {
        throw Error("Size cannot be empty");
    }
    if (isNaN(size)) {
        throw Error("Size is not a number");
    }
    if (size < 0) {
        throw Error("Size must be positive");
    }
    if (!duration || isNaN(policy) || policy < 1 || policy > 3) {
        throw Error("Policy is invalid");
    }

    this.duration = duration * 1000;
    this.size = size;
    this.policy = policy;
    this.lastCleanUp = Date.now();

    this.objectMap = new Map();

    this.setObject = function ({ key, value, ttl }) {
        console.info(`[SET] Setting cache for the key: ${key}`);
        if (!key) {
            throw Error("Key is required");
        }
        if (!value) {
            throw Error("Body object is required");
        }
        if (ttl) {
            if (isNaN(ttl)) {
                throw Error("ttl is not a number");
            }
            if (Number(ttl) < 0) {
                throw Error("ttl must be positive");
            }
        }

        if (!this.objectMap.has(key) && !this.cleanUp()) {
            return false;
        }

        const expiredAt = Date.now() + (ttl ? ttl * 1000 : this.duration);
        const cacheItem = { value: value, addedAt: Date.now(), expiredAt: expiredAt };
        this.objectMap.set(key, cacheItem);

        return true;
    };

    this.getObject = function (key) {
        if (this.objectMap.has(key)) {
            console.info(`[GET] Returning cache for the key: ${key}`);
            if (this.isObjectExpired(key)) {
                this.objectMap.delete(key);
                return null;
            }
            return this.objectMap.get(key).value;
        }
        return null;
    };

    this.isObjectExpired = function (key) {
        const object = this.objectMap.get(key);
        return Date.now() > object?.expiredAt;
    };

    this.getSize = function () {
        return this.objectMap.size;
    };

    this.cleanUp = function () {
        //Do clean up if storage is full or has expired items
        if (this.objectMap.size >= this.size || Date.now() - this.lastCleanUp > this.duration) {

            let evictTime = this.objectMap.values().next().value.addedAt;
            let evictKey = null;

            //Remove the expired objects
            for (let [key, value] of this.objectMap) {
                if (this.isObjectExpired(key)) {
                    this.objectMap.delete(key);
                    console.info(`[CLEAN] removed expired object [${key}] from cache`);
                } else if (this.policy === 1 && value.addedAt <= evictTime) {
                    evictTime = value.addedAt;
                    evictKey = key;
                } else if (this.policy === 2 && value.addedAt >= evictTime) {
                    evictTime = value.addedAt;
                    evictKey = key;
                }
            }

            //Cache is still full we remove the oldest/newest depending on policy
            if (this.policy !== 3 && this.objectMap.size >= this.size && evictKey !== null) {
                this.objectMap.delete(evictKey);
                console.info(`[CLEAN] removed object [${evictKey}] from cache`);
            }

            this.lastCleanUp = Date.now();
            console.info("[CLEAN] cache clean up finished");

            //Return false if still full after cleanup 
            if (this.objectMap.size >= this.size) {
                return false;
            }
            return true;
        }
        return true;
    };

    this.deleteObject = function (key) {
        if (!this.objectMap.has(key)) {
            return false;
        }

        if (this.isObjectExpired(key)) {
            this.objectMap.delete(key);
            return false;
        }

        return this.objectMap.delete(key);
    };
};
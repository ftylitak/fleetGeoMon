const _=require('lodash');

class DroneLocationStorage{
    constructor() {
        this.locationDataPerID = new Map();
        this.dataFormatRegex = new RegExp('^{\\s*"?long"?:"?\\d+\\.\\d+"?,\\s*"?lat"?:"?\\d+\\.\\d+"?}$');
    }

    _insertObjectIfDiffrent(id, messageObj)
    {
        if(messageObj === undefined ||
            !_.has(messageObj, 'long') || !_.has(messageObj, 'lat'))
        {
            console.log('No valid object, ignoring: ' + JSON.stringify(messageObj));
            return undefined;
        }

        let currentRecord = this.locationDataPerID.get(id);
        if( currentRecord !== undefined &&
            currentRecord.long ===  messageObj.long &&
            currentRecord.lat === messageObj.lat )
        {
            console.log(`No movement, ignoring update of id: ${id}`);
            return currentRecord;
        }

        messageObj.timestamp = Date.now();
        messageObj.id = id;
        this.locationDataPerID.set(id, messageObj);
        return messageObj;
    }

    insert(id, message) {
        let messageObj = undefined;

        if(typeof message === 'string')
        {
            if(message.match(this.dataFormatRegex)) {
                try {
                    messageObj = JSON.parse(message);
                } catch(e) {
                    //ignoring message
                    console.log('Error parsing: ' + message + ', exception: ' + e);
                }
            }
            else
                console.log(`rejecting message due to wrong format: ${id} -> ${message}`);
        }
        else
            messageObj = message;

        if(messageObj !== undefined)
            return this._insertObjectIfDiffrent(id, messageObj);

        return undefined;
    }

    getRecordsOlderThan(mSeconds) {
        let now = Date.now();
        let result = [];

        this.locationDataPerID.forEach((record) => {
            if((now - record.timestamp) > mSeconds)
                result.push(record.id);
        });
        return result;

        //to be investigated why it does not work
        //return _.find(this.locationDataPerID.values(), function(record) {
        //    return ((now - record.timestamp) > mSeconds);
        //});
    }

    clear() {
        this.locationDataPerID = new Map();
    }

    clearRecordsOlderThan(mSeconds) {
        let idsToBeDeleted = this.getRecordsOlderThan(mSeconds);
        for(let record of  idsToBeDeleted)
            this.locationDataPerID.delete(record);
    }
}

module.exports.locationStorage = new DroneLocationStorage();

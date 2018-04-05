var _=require('lodash');

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
            console.log('No valid object, ignoring');
            return undefined;
        }

        var currentRecord = this.locationDataPerID.get(id);
        if( currentRecord !== undefined &&
            currentRecord.long ===  messageObj.long &&
            currentRecord.lat === messageObj.lat )
        {
            console.log(`No movement, ignoring update of id: ${id}`);
            return undefined;
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
                console.log(`rejecting message due to wrong format: ${id}`);
        }
        else
            messageObj = message;

        if(messageObj !== undefined)
            return this._insertObjectIfDiffrent(id, messageObj);

        return undefined;
    }

    getRecordsOlderThan(seconds) {
        // lodash.find(users, function(user) {
        //     return user.age < 18;
        // })
    }

    clear() {
        this.locationDataPerID = new Map();
    }

    clearRecordsOlderThan(seconds) {

    }
}

// var locationStorage;
// if(locationStorage === undefined) {
//     locationStorage = new DroneLocationStorage();
//     console.log('create storage ' + JSON.stringify(locationStorage));
// }

module.exports.locationStorage = new DroneLocationStorage();

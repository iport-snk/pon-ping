const loki = require('lokijs');
const wss = require('./app-socket');
const rp = require('request-promise');

let _clients = [];
let _cdr;
let _template = {
    $ver: null,
    contract: null,
    handled: null,
    category: null,
    client: null,
    jira: null,
    receivedTheCall: null,
    answeredTheCall: null,
    hangupTheCall: null
};

let _listeners = {
    update: function(record) {
        let data = Object.assign({}, record);

        delete data.$loki;
        delete data.meta;

        wss.broadcast(JSON.stringify({event: 'update', data: data}));
    },
    insert:  function(record) {
        let data = Object.assign({}, record);

        delete data.$loki;
        delete data.meta;

        wss.broadcast(JSON.stringify({event: 'insert', data: data}));
    }
};


module.exports = {
    get cdr() {
        return _cdr;
    },
    init: function(){
        _cdr = new loki('db/cdr.json', {
            autosave: true,
            autoload: true,
            autosaveInterval: 4000,
            autoloadCallback : () => {
                let calls = _cdr.getCollection("calls");
                if (calls === null) {
                    calls = _cdr.addCollection("calls", {
                        unique: ['generalCallID'],
                        disableChangesApi: false,
                        asyncListeners: true
                    });
                    //calls.insert(_items);

                }
                calls.on('update', _listeners.update);
                calls.on('insert', _listeners.insert);
            },
        });
    },
    resolveContract: function (phone) {
        return new Promise ( (resolve, reject) => {
            rp({
                uri: `http://iport.net.ua/api/bino.php?requestType=getContractByPhone&srcNumber=${phone}`,
                json: true
            }).then(
                client => resolve(client.contract)
            ).catch(
                err => resolve(null)
            );
        })
    },
    saveRecord: async function(message) {
        let calls = _cdr.getCollection('calls'),
            method = {},
            operation = "update",
            $ver = 0;

        let record = calls.by('generalCallID', message.generalCallID);
        if (!record) {
            operation = "insert";
            record = Object.assign(message, _template);
            record.contract = await this.resolveContract(message.externalNumber);
        } else {
            $ver = record.$ver + 1;
        }

        method[message.method] = (new Date()).getTime();

        delete message.requestType;
        delete message.method;
        Object.assign(record,
            method,
            { $ver: $ver },
            message
        );

        calls[operation](record);
    }

};

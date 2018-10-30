const loki = require('lokijs');
const wss = require('./app-socket');

let _clients = [];
let _cdr;
let _items = [
    { $ver: 0, callId: '829711662', contract: null,       srcNumber: '0660479529',    extNumber: '901',   receivedTheCall: 1540213524307, handled: null, category: 'quest.fin',     client: null,   jira: null },
    { $ver: 0, callId: '829718323',  contract: '111.111',  srcNumber: '0633145133',    extNumber: '905',  receivedTheCall: 1540213525307, handled: null, category: 'quest.tech',    client: null,   jira: 'CRM-1',    description: 'blah' },
    { $ver: 0, callId: '829658986',  contract: null,       srcNumber: '0939503452',    extNumber: '905',  receivedTheCall: 1540213554307, handled: null, category: 'order.inst',    client: null,   jira: null},
    { $ver: 0, callId: '829654515',  contract: null,       srcNumber: '0934213435',    extNumber: '905',  receivedTheCall: 1540213564307, handled: null, category: '',              client: null,   jira: null  }
];

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
                        unique: ['callId'],
                        disableChangesApi: false,
                        asyncListeners: true
                    });
                    calls.insert(_items);

                }
                calls.on('update', _listeners.update);
                calls.on('insert', _listeners.insert);
            },
        });
    },
    saveRecord: function(message) {
        let calls = _cdr.getCollection('calls'),
            now = (new Date()).getTime();

        if (message.method === 'receivedTheCall') {
            let record = {
                $ver: 0,
                callId: message.generalCallID,
                srcNumber: message.externalNumber,
                status: null,
                jira: null,
                client: null,
                category: null,
                contract: null,
                answeredTheCall: null,
                hangupTheCall: null,
                receivedTheCall: now
            };
            calls.insert(record);
        } else if (message.method === 'answeredTheCall') {
            // IMPORTANT : saw in the log an answeredCall without receivedTheCall event.
            // If it really happens need to insert record on answeredTheCall like on receivedTheCall
            let record = calls.by('callId', data.callId);
            if (record) {
                Object.assign( record , {
                    $ver: record.$ver + 1,
                    answeredTheCall: now,
                    extNumber: message.extNumber,
                });
            }

            calls.update(record);
        } else if (message.method === 'hangupTheCall') {
            let record = calls.by('callId', data.callId);
            if (record) {
                Object.assign( record , {
                    $ver: record.$ver + 1,
                    hangupTheCall: now,
                    billsec: message.billsec,
                    disposition: message.disposition
                });
                calls.update(record);
            }

        }
    }

};

const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const bill = require('mysql-promise')('bill');
const {billDb} = require('../env');
const rp = require('request-promise');
const db = require('../cdr');

let clients = [];

bill.configure(billDb);

router.get('/', (req, res, next) => res.json({status: 'success'}) );

router.post('/', function(req, res, next) {
    res.json({status: 'success'});
    let message = req.body;

    db.saveRecord(message);

});

router.post('/jira', (req, res) => {
    let data = req.body;

    rp({
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + data.auth
        },
        uri: 'http://jira.iport.net.ua:8080/rest/api/2/issue/',
        body: {
            "fields": {
                "project": { "key": data.project },
                "summary": data.summary,
                "description": data.description,
                "issuetype": { "name": "Task" }
            }
        },
        json: true
    }).then(_ => res.send(_)).catch( err => console.log(err));
});

router.get('/getUserByContract/:contract', async (req, res, next) => {
    bill.query(
        "select id, contract, fio from users where contract = ?",
        [req.params.contract]
    ).then( user => {
        res.json(user);
        conn.end();
    });

} );

router.get('/cdr', (req, res, next) => {
    res.json(db.cdr.getCollection('calls').chain().find().simplesort('time', {desc: true}).data({removeMeta: true}));

});

router.put('/cdr', (req, res, next) => {
    let data = req.body,
        calls = db.cdr.getCollection('calls'),
        record = calls.by('callId', data.callId);

    if (record.$ver >= data.$ver) {
        res.status(500).json({error: 'stale record'});
    } else {
        Object.assign( record , data);
        calls.update(record);
        res.json({result: 'success'})
    }
});


module.exports = router;
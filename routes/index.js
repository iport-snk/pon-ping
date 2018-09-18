var express = require('express');
var router = express.Router();
const ipPool = require("../ip-pool");
const Telnet = require('../libs/telnet');
const telnet = new Telnet();
const { exec , spawn } = require('child_process');
const {telnetConn} = require('../env');

let telnetSetIp = async function (ip) {
    let conn = Object.assign({ host: ip.olt }, telnetConn);

    await telnet.connect(conn);
    await telnet.exec(`config`);
    await telnet.exec(`Int ep 0/${ip.intf}`);
    await telnet.exec(`Epon onu ctc ip address static ${ip.ip} ${ip.mask} gateway ${ip.gate} cvlan ${ip.vlan} svlan 0 priority 5`);

    let confirmation = await telnet.exec(`show running-config interface epON 0/${ip.intf}`);

    await telnet.end();

    if (confirmation.indexOf(ip.ip) === -1) throw( new Error('Can not assign ip. CONTACT ADMINISTRATOR!!!'));
};

let telnetReleaseIp = async function (olt, intf, ip) {
    let conn = Object.assign({ host: olt }, telnetConn);
    
    await telnet.connect(conn);
    await telnet.exec(`config`);
    await telnet.exec(`Int ep 0/${intf}`);
    await telnet.exec(`no epon onu ctc ip address`);

    let confirmation = await telnet.exec(`show running-config interface epON 0/${intf}`);

    await telnet.end();

    if (confirmation.indexOf(ip) > -1) throw new Error('Can not release ip. CONTACT ADMINISTRATOR!!!');
};

router.get('/assign/:mac/:olt/:intf', async function(req, res, next) {
    let message;
    try {
        message = await ipPool.assignIp(req.params.mac, req.params.olt, req.params.intf);
        await telnetSetIp(message);

        res.json(message)
    } catch (e) {
        if (message) await ipPool.releaseIp(message.ip);
        res.json({error: e.toString()});
    }
});

router.get('/check/:mac', async function(req, res, next) {
    ipPool.check(req.params.mac).then( ip => res.json(ip) );
});

router.get('/release/:olt/:intf/:ip', async function(req, res, next) {
    try {
        await telnetReleaseIp(req.params.olt, req.params.intf, req.params.ip);
        await ipPool.releaseIp( req.params.ip );

        res.json({success: true})
    } catch (e) {
        res.json({error: e.toString()});
    }
});

module.exports = router;

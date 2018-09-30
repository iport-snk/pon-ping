const ipRangeCheck = require("ip-range-check");
const db = require('mysql-promise')();
const {nets, ponDbConf} = require('./env');


db.configure(ponDbConf);

class IpPool {

    static check(mac) {
        return Promise.all([
            db.query( "SELECT * from ip_assigned where mac = ?", [mac] ).then( _ => _[0]),
            db.query(
                "SELECT INET_NTOA(olt) olt, olt ntoa, interface, SUBSTRING(name, locate('/', name) + 1) intf FROM onus where lower(REPLACE(mac, ':', '')) = ?",
                [mac]
            ).then( _ => _[0])
        ]).then( data => ({
            assigned: data[0],
            olt: data[1]
        }));
    }

    static async releaseIp(ip) {
        return db.query( "DELETE from ip_assigned where ip = ?", [ip] );
    }

    static async assignIp(mac, olt, intf) {

        let settings = { mac: mac };
        let net = nets.find( _ => ipRangeCheck(olt, _.net));

        Object.assign(settings, {
            olt: olt,
            intf: intf,
            vlan: net.vlan,
            mask: net.mask ,
            gate: net.gate,
            net: net.net,
            range: net.range
        });

        return db.query('select * from ip_assigned where vlan = ?', [net.vlan]).then( ds => {
            let assigned = ds[0],
                net = settings.net.split('.'),
                preIp = `${net[0]}.${net[1]}.${net[2]}.`;

            if (assigned.length === 0) {
                settings.ip = preIp + settings.range[0];
            } else {
                let noIp = false;

                for (let i = settings.range[0]; i <= settings.range[1]; i++) {
                    noIp = assigned.some( _ => _.ip === preIp + i);
                    if (!noIp) {
                        settings.ip = preIp + i;
                        break;
                    }
                }
            }

            if (!settings.ip) throw( new Error(`There is no IP available in vlan ${settings.vlan}. \n !!! CONTACT ADMINISTRATOR !!!`) );
        }).then( _ => db.query(
            'insert into ip_assigned (vlan, ip, olt, intf, mac) values (?, ?, ?, ?, ?)',
            [settings.vlan, settings.ip, settings.olt, settings.intf, mac]
        )).then( _ => settings);

    }


}

module.exports = IpPool;
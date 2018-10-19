module.exports = {
    telnetConn: {
        port: 23,
        shellPrompt: /#$/,
        pageSeparator: '--More--',
        username: '111',
        password: '111',
        timeout: 5000
    },
    ponDbConf: {
        host     : '111',
        database : '111',
        user     : '111',
        password : '111'
    },
    nets: [{
        vlan: 100,
        net: '192.168.100.0/24',
        gate: '192.168.100.1',
        range: [170, 200],
        mask: '255.255.255.0'
    }, {
        vlan: 176,
        net: '192.168.176.0/24',
        gate: '192.168.176.1',
        range: [170, 200],
        mask: '255.255.255.0'
    }, {
        vlan: 174,
        net: '192.168.174.0/24',
        gate: '192.168.174.1',
        range: [170, 200],
        mask: '255.255.255.0'
    }]
};
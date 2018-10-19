module.exports = {
    telnetConn: {
        port: 23,
        shellPrompt: /#$/,
        pageSeparator: '--More--',
        username: 'admin',
        password: '1p0rtnet',
        timeout: 5000
    },
    ponDbConf: {
        host     : 'df.fun.co.ua',
        database : 'poncontrol',
        user     : 'fin',
        password : 'mutabor'
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
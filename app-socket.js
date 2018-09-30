const WS = require('ws');
const {spawn} = require('child_process');
class AppSocket {
    static init(server) {
        let ws = new WS.Server({server});
        let pings = {};

        ws.on('connection', function (socket) {
            socket.on('message', async  function (data) {
                let message = JSON.parse(data);

                switch (message.cmd) {
                    case 'ping':
                        //let argv = [ '-t', '-l', message.size, message.ip],
                        let ping = pings[message.ip] = spawn('ping', [ message.ip, '-s', message.size ]);

                        setTimeout( _ => {
                            if (pings[message.ip]) pings[message.ip].kill('SIGINT');
                            try {
                                socket.send(JSON.stringify({ event: 'onTimeOut' }));
                            } catch (e) {
                                //
                            }
                        }, 20000);

                        ping.stdout.on('data', (data) => {
                            // when client connection is closed - user has reloaded the page or smth like that
                            // ws.send is throwing an exception that breaks an app
                            try {
                                socket.send(JSON.stringify({
                                    event: 'onPing',
                                    arg: data.toString()
                                }));
                            } catch (e) {
                                if (pings[message.ip]) pings[message.ip].kill('SIGINT');
                            }
                        });
                        break;
                    case 'stop':
                        if (pings[message.ip]) pings[message.ip].kill('SIGINT');
                        break;
                }
            });
        });
    }
}


module.exports = AppSocket;
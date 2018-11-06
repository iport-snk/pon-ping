import cdr from '/javascripts/tests/log.js';

window.JSON.post = function (data){
    return new Promise( (resolve, reject) => {
        fetch('/bino', {
            method: 'POST',
            body: JSON.stringify(data),
            headers:{ 'Content-Type': 'application/json' }
        }).then(res => {
            res.json().then( data => {
                if (res.status === 200) {
                    resolve(data)
                } else {
                    reject(data)
                }
            });
        })
    })
};

window.cdr = cdr;

window.hangup = function (callId) {
    //067 935 4047
    window.JSON.post({
        generalCallID: callId,
        billsec: '468',
        disposition: 'ANSWER',
        requestType: 'hangupTheCall',
        method: 'hangupTheCall'
    })
}

window.simCalls = async function () {
    let p = function () {
        return new Promise( (resolve , reject )=> {
            setTimeout( _ => {
                resolve()
            }, 10 )
        });
    };

    for (var i = 0; i < cdr.length; i ++) {
        await p();
        await window.JSON.post( cdr[i]);
    }

};
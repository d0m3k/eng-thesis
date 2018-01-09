const dhttp = require('./node-setup')
const http = require('http')
const request = require('request')

const d = dhttpClient

function handleApiCall(url, res) {
    switch(url) {
        case 'api/stats':
            var stats = d.stats
            stats.id = d.node.peerInfo.id.toB58String()
            stats.nodes = Object.keys(d.cluster.nodes)
            stats.swarm = Object.keys(d.swarm.nodes)
            stats.status = 'Connection OK!'
            res.write(JSON.stringify(stats))
            res.end()
            break;
    }
    
}

http.createServer((req, res) => {
    var reqURL = req.url.slice(1)
    
    if(reqURL.startsWith('api')) {
        // send information about node
        handleApiCall(reqURL, res)
    } else {
        // become a relay! 
        d.download(reqURL, res, () => {
            try {
                console.log('Falling back to direct download for '+reqURL)
                req.pipe(request(reqURL)).pipe(res)
            } catch (err) {
                console.log('This failed, you know.' + err)
            }
        })
    }

}).listen(34887)
console.log('Listening at http://127.0.0.1:34887/')
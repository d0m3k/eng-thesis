const http = require('http')
const request = require('request')
const Throttle = require('throttle')
const fs = require('fs');

const args = process.argv

var throttling = false

if (args.length>2 && args[2].startsWith('--throttle=')) {
    throttling = true
    var concurrentCalls = args[2].split('=')[1]

    function getThrottle() {
       return new Throttle(1024*128 / concurrentCalls)
    }
}

http.createServer((req, res) => {
    var reqURL = req.url.slice(1)
    console.log('Responding to '+reqURL)
    fs.access('hosted/' + reqURL, (err) => {
        if(err) {
            console.log('ERR!')
            res.write('This file is not available.')
            res.end()
        } else {
            console.log(`Steaming ${reqURL}.` + ((throttling===true)?` Has ${concurrentCalls} concurrent calls.`:''))
            var fileStream = fs.createReadStream('hosted/' + reqURL);
            if(throttling) 
                fileStream.pipe(getThrottle()).pipe(res).on('finish', ()=> res.end())
            else
                fileStream.pipe(res).on('finish', ()=> res.end())

        }
    })
}).listen(8080)
console.log('Serving at 8080!')
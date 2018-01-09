'use strict'

const domReady = require('detect-dom-ready')
const createNode = require('./create-node')
const pull = require('pull-stream')
const Record = require('libp2p-record').Record

console.log(Record)


domReady(() => {
  const myPeerDiv = document.getElementById('my-peer')
  const swarmDiv = document.getElementById('swarm')
  const nodes = []

  createNode((err, node) => {
    if (err) {
      return console.log('Could not create the Node, check if your browser has WebRTC Support', err)
    }

    function propagateMessage(msg) {
        for (var i = 0; i<nodes.length; i++ ) {
          var peerInfo = nodes[i]
          node.dial(peerInfo, '/dhhtp/0.1/meta', (err, conn) => {
            if (err) { throw err }
  
            console.log('node '+ myPeerDiv.innerText + ' sends on protocol: /dhhtp/0.1/meta')
            console.log(conn)

            pull(
              pull.values([msg]),
              conn
            )
          })
        }
    }

    document.getElementById('sendMessage').addEventListener(
      'click', () => {
        propagateMessage(document.getElementById('message').value)
      }
    )

    document.getElementById('clear').addEventListener(
      'click', () => {
        received.innerHTML = ''
      }
    )



    node.on('peer:discovery', (peerInfo) => {
      console.log('Discovered a peer')
      const idStr = peerInfo.id.toB58String()
      console.log('Discovered: ' + idStr)

      node.dial(peerInfo, (err, conn) => {
        if (err) { return console.log('Failed to dial:', idStr) }
      })
    })

    var kek = 1;

    node.on('peer:connect', (peerInfo) => {
      const idStr = peerInfo.id.toB58String()
      console.log('Got connection to: ' + idStr)
      const connDiv = document.createElement('div')
      connDiv.innerHTML = 'Connected to: ' + idStr
      connDiv.id = idStr
      swarmDiv.append(connDiv)
      nodes.push(peerInfo)

      if(kek === 2) {
        node.dht.get(Buffer.from('testKey'), (err, buf) => {
          if(err) {
            console.log("nie pykło :c")
            console.log(err)
            return
          }

          console.log('Yaay! Got it!')
          console.log(buf.toString())
        })
      }

      if(kek === 1) {
        console.log(Buffer.from('pyk'))
        var record = new Record(Buffer.from('testKey'), Buffer.from('pyk'), node.peerInfo.id, new Date())
        console.log(record)
        node.dht.put(Buffer.from('testKey'), Buffer.from(record.serialize()), (err) => {
          if(err) {
            console.log("nie pykło :c")
            console.log(err)
            return
          }
          console.log('Succeeded sending testKey')
        })
       kek = kek+1;
      }
    })

    node.on('peer:disconnect', (peerInfo) => {
      const idStr = peerInfo.id.toB58String()
      console.log('Lost connection to: ' + idStr)
      document.getElementById(idStr).remove()
      nodes.splice( nodes.indexOf(peerInfo), 1 )
    })

    node.handle('/dhhtp/0.1/meta', (protocol, conn) => {
      console.log("Handling " + protocol)
      console.log(conn)
      var received = document.getElementById('received')
      pull(
        conn,
        pull.map((v) => {
          console.log('Mapping this elementeł')
          console.log(v)
          var newDiv = document.createElement('DIV')
          newDiv.innerText = "Received value: " + v
          received.appendChild(newDiv)
          return v.toString()
        }),
        pull.log()
      )
    })

    node.start((err) => {
      if (err) {
        return console.log('WebRTC not supported')
      }

      const idStr = node.peerInfo.id.toB58String()

      const idDiv = document
        .createTextNode('Node is ready. ID: ' + idStr)

      myPeerDiv.append(idDiv)

      console.log('Node is listening o/')

      // NOTE: to stop the node
      // node.stop((err) => {})
    })
  })
})

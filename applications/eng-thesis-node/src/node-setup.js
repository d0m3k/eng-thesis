'use strict'

const domReady = require('detect-dom-ready')
const createNode = require('./create-node')
const pull = require('pull-stream')
const Record = require('libp2p-record').Record
const pullToStream = require('pull-stream-to-stream')
const fs = require('fs');

require('./dhttp')

const nodes = []

createNode((err, node) => {
  if (err) {
    return console.log('Could not create the Node, check if your browser has WebRTC Support', err)
  }

  function propagateMetaMessage(msg) {
      dhttp.propagate(msg)
  }

  node.handle('/dhttp/meta/0.1', (protocol, conn) => {
    console.log("Handling " + protocol)
    // There are several things to handle in meta protocol:
    // first, questions. About network state, about peers (which should be mostly done by discovery mechanisms though), about files, about priorities
    // updates to DHT.
    const connStream = pullToStream(conn)
    connStream.on('data', (v) => {
      var data = JSON.parse(v)
      switch(data.type) {
        case 'introduction':
          dhttpClient.acceptIntroduction(data)
          break;
        case 'removeFile':
          dhttpClient.removeFile(data.file)
          break;
        case 'addFile':
          dhttpClient.addFile(data.file)
          dhttpClient.propagate(dhttpClient.introductoryData())
          break;
        case 'hasFile':
          var res = dhttpClient.hasFile(data.file)
          var hasLocally = dhttpClient.filesAvailable().includes(data.file)
          
          res.peerId = data.peerId
          res.hasFile = hasLocally
          if(!hasLocally && dhttpClient.filesInNetwork[data.file]) {
            var nodesWithFile = Array.from(dhttpClient.filesInNetwork[data.file].nodes)
            if (nodesWithFile.length>0) {
              res.peerWithFile = nodesWithFile[Math.floor(Math.random() * nodesWithFile.length)]
            }
          }
          connStream.write(res).end()
          break;
        case 'echo':
          connStream.write(data).end()
          break;
      }
    })
  })

  node.handle('/dhttp/data/0.1', (protocol, conn) => {
    console.log('Called for file!')
    // in this case, what to handle is fairly simple: we send the file we have.
    const connStream = pullToStream(conn)
    connStream.on('data', (v) => {
      console.log('Asked for: '+v.toString())
      dhttpClient.storage.fetchFile(v.toString(), connStream)
    })
  })

  node.on('peer:discovery', (peerInfo) => {
    const idStr = peerInfo.id.toB58String()

    node.dial(peerInfo, (err, conn) => {
      if (err) { return console.log('Failed to dial:', idStr) }
    })
  })

  node.on('peer:connect', (peerInfo) => {
    const idStr = peerInfo.id.toB58String()
    console.log('Got connection to: ' + idStr)
    dhttpClient.attachNode(peerInfo)
  })

  node.on('peer:disconnect', (peerInfo) => {
    const idStr = peerInfo.id.toB58String()
    console.log('Lost connection to: ' + idStr)
    dhttpClient.detachNode(peerInfo)
  })

  node.start((err) => {
    if (err) {
      return console.log('WebRTC not supported')
    }

    console.log(`Node is listening as ${node.peerInfo.id.toB58String()} o/`)

  })

  dhttpClient.node = node
})

const domReady = require('detect-dom-ready')
const createNode = require('./create-node')
const pull = require('pull-stream')
const pullToStream = require('pull-stream-to-stream')
const PeerId = require('peer-id')
const request = require('request')
const fs = require('fs');
const blobStream = require('blob-stream')
const Throttle = require('throttle');


// Created by Dominik Adamiak, 2017.
console.log('You are in dHTTP node index.')
dhttpClient = {
    // information about nodes that we know own some file. May change; update when needed
    filesInNetwork: {
        "http://example.com/nodeHas.jpg": {
            nodes: new Set()
        }
    },
    // interface allowing seamless, DIRECT connection with the rest of swarm; swarm is "local cluster" -- list of nodes directly connected to this one.
    swarm: {
        nodes: {}
    },
    // interface providing data on all nodes available in network
    cluster: {
        nodes: {}
    },
    // those three fields represent statistics of network usage by specific node
    stats: {
        downloaded: {bytes: 0, files: 0},
        fetched: {bytes: 0, files: 0},
        uploaded: {bytes: 0, files: 0},
    },
    // object corresponding to peerInfo of yourself.
    node: {},

    // the difference is that fetch is used internally, just for node modes that help network
    filesAvailable: function() {
        var filesAvailable = dhttpClient.storage.availableDriveFiles()
        return filesAvailable
    },

    // call node with metadata
    dialNode: function(peerInfo, data, cb) {
        dhttpClient.node.dial(peerInfo, '/dhttp/meta/0.1', (err, conn) => {
            if (err) { 
                console.log(err)
                throw err
             }
            console.log('... Dialing meta with '+ data)
            
            const connStream = pullToStream(conn)
            connStream.write(JSON.stringify(data))
            connStream.on('data', (data) => {
                if(cb && typeof cb === "function") cb(JSON.parse(data))
            })
        })
    },

// METADATA INTERFACES
    // propagate data to all available nodes
    propagate: function(data, cb) {
        Object.values(dhttpClient.swarm.nodes).forEach((peerInfo) => {
            dhttpClient.dialNode(peerInfo, data, cb)
        })
    },
// asking swarm is not a simple task: chances are, we'd need to wait for answer. But it's bidirectional, so eventually we'll get response.
// keep in mind that callback will be called for each node separately. Signature:
// cb(data)
    askSwarm: function(question, cb) {
        propagate(question, cb)
    },

    introductoryData: function () {
        return {
            type: "introduction",
            peerId: dhttpClient.node.peerInfo.id.toB58String(),
            files: dhttpClient.filesAvailable()
        }
    },

    // EVENT propagate information about the node in the network
    introduceSelf: function(peerInfo) {
        dhttpClient.dialNode(peerInfo, dhttpClient.introductoryData())
    },


    // EVENT handler
    acceptIntroduction: function(v) {    
          dhttpClient.cluster.nodes[v.peerId] = {
            id: v.peerId,
            files: v.files
          }

          console.log('File names:')
          console.log(v.files)

          v.files.forEach((fileName) => {
            var file = dhttpClient.filesInNetwork[fileName] || {nodes: new Set()}
            file.nodes.add(v.peerId)
            dhttpClient.filesInNetwork[fileName] = file
          })
          

          console.log(`Accepted introduction from ${v.peerId}, introducing ${v.files.length} files.`)
    },

    // if we found ourselves creators of file in the cluster, call this to inform DHT.
    addFile: function(fileUrl) {
        dhttpClient.storage.storeFile(fileUrl)
    },

    // if we no longer want to host a file, inform cluster. And, of course,
    removeFile: function(fileUrl) {
        dhttpClient.storage.removeFile(fileUrl)
    },

    // update batch info about all the available nodes in cluster; actually triggering introduceSelf for all elements in network
    fetchClusterInfo: function() {

    },

// MIDDLE INTERFACES
    // if found useful, we may add a node from cluster to swarm, creating easier connection behaviour
    attachNode: function (peerInfo) {
        dhttpClient.swarm.nodes[peerInfo.id.toB58String()] = peerInfo
        // maybe we don't have enough information... but this is just self introduction, so.
        dhttpClient.introduceSelf(peerInfo)
    },
    // or remove, in case of quotas achieved or data fetch problems
    detachNode: function (peerInfo) {
        delete dhttpClient.swarm.nodes[peerInfo.id.toB58String()]
        Object.values(dhttpClient.filesInNetwork).forEach((v) => {
            v.nodes.delete(peerInfo.id.toB58String())
        })
        console.log('Detached node: ' + peerInfo.id.toB58String())
    },


// DATA INTERFACES
    // fetch that gets data from specific node
    fetchFromNode: function(url, req, peerInfo) {
        console.log(`Downloading file for ${url} from ${peerInfo.id.toB58String()}.`)
        dhttpClient.node.dial(peerInfo, '/dhttp/data/0.1', (err, conn) => {
            if (err) { throw err }

            const connStream = pullToStream(conn)
            connStream.write(url)
            connStream.on('data', (data) => {
                req.write(data)
            })
            connStream.on('end', () => {
                req.end()
            });
        })
        // to make network more helpful -- we may want store the file as well, but keep in mind this will eventually propagate all the data to client nodes, and that's not very effective
        // dhttpClient.storage.storeFile(url)
    },
    // call allowing fetching of data; used client-side, for sake of no-callback way request is intercepted
    // this implementation is there to pipe streams -- it actually downloads data and relays it realtime, using node streams.
    download: function(url, req, fallback, lastModified, ETag) {
        const fileInNetwork = dhttpClient.filesInNetwork[url]
        // if has it locally, send directly to user.
        if(dhttpClient.filesAvailable().includes(url)) {
            console.log(`Sending ${url} directly from this node.`)
            dhttpClient.storage.fetchFile(url, req)
        } else if(fileInNetwork && fileInNetwork.nodes.size>0) {
            console.log(`Sending ${url} from network.`)
            // fetch it directly from any node having it.
            var nodesWithFile = Array.from(fileInNetwork.nodes)
            var nodeToFetch = nodesWithFile[Math.floor(Math.random() * nodesWithFile.length)]
            dhttpClient.fetchFromNode(url, req, dhttpClient.swarm.nodes[nodeToFetch])
            dhttpClient.stats.downloaded.files++
        } else {
            // if no one has it, download it -- we'll be a better node.
            dhttpClient.storage.storeFile(url)

             // no one has it? Bummer. Network will adapt, but for now, fall back to reverse proxy.
            fallback()
        }
       
    },

// STORAGE. Current implementation provides no quotas, and hold all files on drive for better control and memory usage.
    storage: {
        driveFiles: {
            files: {

            }
        },

        // call when application is initialized or on drive state change 
        initDrive: function() {
            fs.readdirSync('files').forEach((file) => {
                console.log(`Initializing drive with file: ${file}`)
                dhttpClient.storage.driveFiles.files[file.replace(/\+/g, "/")] = { //change pluses from filesystem to slashes in paths
                    path: 'files/' + file
                }
            })
        },

        // list all files provided by drive memory
        availableDriveFiles: function () {
            if(Object.keys(dhttpClient.storage.driveFiles.files).length === 0)
                dhttpClient.storage.initDrive()
            return Object.keys(dhttpClient.storage.driveFiles.files)
        },

        // fetches file OR nulls if absent. Fallback to network if so.
        fetchFile: function(url, writableStream) {
            if(dhttpClient.storage.driveFiles.files[url]) {
                // do hard drive necessary stuff
                var fileStream = fs.createReadStream(dhttpClient.storage.driveFiles.files[url].path);
                fileStream.pipe(writableStream).on('finish', ()=> writableStream.end())
            }
            dhttpClient.stats.uploaded.files++
        },
        // add file to local storage, and inform network
        storeFile: function(url) {
            dhttpClient.storage.storeDriveFile(url)
            console.log('Storing file! '+url)
            dhttpClient.propagate(dhttpClient.introductoryData())
        },
        // add file to the drive, specifically
        storeDriveFile: function (url) {
            var path = 'files/' + url.replace(/\//g, "+") //to avoid problems with slashes on filesystems, replace with plus
            var fileStream = fs.createWriteStream(path);
            request(url).pipe(fileStream)
            dhttpClient.storage.initDrive()
            dhttpClient.storage.driveFiles[url] = {
                path: path
            }
        },
        // deletes file from  memory.
        deleteFile: function(url) {
            if(dhttpClient.storage.driveFiles[url]) {
                fs.unlink('files/' + url)
                delete dhttpClient.storage.driveFiles[url]
            }
            dhttpClient.propagate(dhttpClient.introductoryData())
        }
    }
}

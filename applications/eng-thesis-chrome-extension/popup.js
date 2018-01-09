const background = chrome.extension.getBackgroundPage();

var updateStats = () => {
    // init stats & config according to background state
    var timeCount = background.timeCount
    $("#timeCount")      .text(timeCount)
    $('#nodeID')         .text(background.stats.id)
    $("#downloadedFiles").text(background.stats.downloaded.files)
    $("#uploadedFiles")  .text(background.stats.uploaded.files)
    $("#peers")          .text(background.stats.nodes.length)
    $("#connected")      .text(background.stats.swarm.length)
}

var getConfig = () => {
    $("#nodeAddress").val(background.config.dHTTPNodeHost)
    $("#filterString").val(background.config.filterString)
    console.log("Getting configuration")
}

updateStats()
getConfig()

setInterval(() => updateStats(), 1000)

$("#change").click(() => {
    background.setdHTTPNodeHost($("#nodeAddress").val())
    background.setFilter($("#filterString").val())
    background.timeCount = 0
    updateStats()
})

console.log('Got background task up and running.')


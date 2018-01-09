var timeCount = 0;

var stats = {
    id: 'connecting...',
    downloaded: {
        files: 0
    },
    uploaded: {
        files: 0
    },
    nodes: [],
    swarm: [],
    status: 'No connection.'
}

var config = {
    filter: {},
    filterString: "http://*/*.jpg*,http://*/*.jpeg*,http://*/*.png*,http://*/*.gif*",
    dHTTPNodeHost: "http://localhost:34887/"
}

setInterval((x) => {
    timeCount++
    $.ajax(fetchFromDHTTP("api/stats"))
        .done((data) => {
            stats = JSON.parse(data)
        })
}, 1000)


var fetchFromDHTTP = (url) => {
    return config.dHTTPNodeHost + url
}

function webRequestInterceptor(details) {
    // for security reasons (and the fact that it's uncommon to download complex, stateful resources using other methods), we're incercepting just GET requests. 
    // Also, in we already download from our host, it's unnecessary to repeat ourselves.
    if(details.method !== 'GET' || details.url.startsWith(config.dHTTPNodeHost)) return; 
    return {redirectUrl: fetchFromDHTTP(details.url) };
}

function setdHTTPNodeHost(url) {
    dHTTPNodeHost = url
}

function setFilter(filterString) {
    config.filterString = filterString
    config.filter = { urls: filterString.split(',') }

    chrome.webRequest.onBeforeRequest.removeListener(webRequestInterceptor)
    chrome.webRequest.onBeforeRequest.addListener(
        webRequestInterceptor,
        config.filter,
        ["requestBody", "blocking"]);
}

setdHTTPNodeHost(config.dHTTPNodeHost)
setFilter(config.filterString)
console.log('Background task for dHTTP initialized.')
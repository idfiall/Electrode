/* eslint-disable */

var IS_DEV = Boolean(window.location.host.match('dev'));
var USED_REV;
// (DEV || PROD ) Localhost Build: @param {REV} String||Integer is defined in webui_version.txt
if (window.isLocalhost) {
    USED_REV = window.REV
} else {
    // Remote builds should not use versioned bench pings
    // (DEV | PROD) Remote Build: @param {REV} String||Integer is defined below
    USED_REV = 'REMOTE' + IS_DEV ? '-DEV' : '';
}

Date.now = Date.now || function() {
    return +new Date();
};
window.bench = {
    metrics: {},
    _clickedLink: {}
};
// Webpack templates work for javascript files that are copied directly to another directory
// as opposed to javascript files that are bundled
var eventName = window.IS_UTWEB ? 'utweb' : 'btweb';
var iVal = window.IS_UTWEB ? '4101' : '4102';

window.bench.pingUrl = 'http://i-' + iVal + '.b-' + USED_REV + '.' +  eventName + '.bench.utorrent.com/e?i=' + iVal;

var libtorrentWebuiUrl = 'http://127.0.0.1' + (window.IS_UTWEB ? ':19575' : ':38565');
var forwardingProxyUrl = libtorrentWebuiUrl + '/http_proxy/';
var isRemote = !!(window.location.origin.match('utweb') || window.location.origin.match('btweb'));

window.bench.createPing = function(action, other_data) {
    // Start the data.
    var data = {
        eventName: eventName,
        action: action,
        unique_id: window.bench.uniqueid,
        BUILD_NUMBER: String(USED_REV)
    };

    other_data = other_data || {};

    for (var key in other_data) {
        if (other_data.hasOwnProperty(key)) {
            data[key] = other_data[key];
        }
    }
    return window.bench.pingUrl + '&e=' + Base64.encode(JSON.stringify(data));
};

window.bench.sendPing = function(action, other_data, callback) {
    //Make and return the ping url.
    var ping = window.bench.createPing(action, other_data);
    var xhr;

    if (isRemote) {
        var newPing = ping.replace(/(^\w+:|^)\/\//, ''); //Remove http://
        xhr = axios.post(forwardingProxyUrl + newPing, null, {
                withCredentials: true,
                crossDomain: true,            
            });
    } else {
        xhr = axios.get(ping + '&callback=?');
    }

    if (typeof callback === 'function') {
        xhr.then(callback);
    }
};

window.bench.getCookie = function(key) {
    if (!window.bench._cookieDict) {
        //check if user already has a uniqueid
        var cookie_string = document.cookie,
            cookie_dict = {};
        var cookie_arr = cookie_string.split(';');
        for (var i = 0, len = cookie_arr.length; i < len; i++) {
            var cookie_pair_string = cookie_arr[i];
            if (cookie_pair_string.indexOf('=') !== -1) {
                var cookie_pair = cookie_pair_string.split('=');
                if (cookie_pair.length === 2) {
                    cookie_dict[cookie_pair[0]] = cookie_pair[1];
                }
            }
        }
        window.bench._cookieDict = cookie_dict;
    }
    return window.bench._cookieDict[key];
};

window.bench.setCookie = function(key, val) {
    document.cookie = key + '=' + val;
    window.bench._cookieDict[key] = val;
};

window.bench.init = function() {
    window.bench.uniqueid = window.bench.getCookie('uniqueid');
    if (!window.bench.uniqueid) {
        window.bench.uniqueid = window.bench.guid();
        window.bench.setCookie('uniqueid', window.bench.uniqueid);
    }
    window.bench.metrics.timeLoaded = Date.now();
};

window.bench.guid = (function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };
}());

window.bench.init();

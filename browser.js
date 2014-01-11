// shim for using process in browser
var hrtime = require('./hrtime.js');

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

// polyfil for window.performance.now
var performance = window.performance || {};
var performanceNow =
  performance.now.bind(performance)       ||
  performance.now.bind(performance)       ||
  performance.mozNow.bind(performance)    ||
  performance.msNow.bind(performance)     ||
  performance.oNow.bind(performance)      ||
  performance.webkitNow.bind(performance) ||
  function() { return new Date().getTime() };

process.hrtime = function hrtime(previousTimestamp){
  var clocktime = performanceNow()/10e3;
  var seconds = Math.floor(clocktime);
  var nanoseconds = (clocktime%1)*10e9;
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0];
    nanoseconds = nanoseconds - previousTimestamp[1];
    if (nanoseconds<0) {
      seconds--;
      nanoseconds += 10e9;
    }
  }
  return [seconds,nanoseconds];
};

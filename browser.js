// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function() {
    var queue = [];
    var draining = false;
    var scheduleDraining = (function() {
        if(('undefined' !== typeof Promise) && ('function' === typeof Promise.resolve)) {
            var resolvedPromise = Promise.resolve();

            return function() {
                resolvedPromise.then(drainQueue);
            };
        } else if('function' === typeof Object.observe) {
            var obj = { prop: 1 };

            Object.observe(obj, drainQueue);

            return function() {
                obj.prop = -obj.prop;
            };
        } else {
            return function() {
                setTimeout(drainQueue, 0);
            };
        }
    })();

    function drainQueue() {
        if (draining) {
            return;
        }
        draining = true;
        var currentQueue;
        var len = queue.length;
        while(len) {
            currentQueue = queue;
            queue = [];
            var i = -1;
            while (++i < len) {
                currentQueue[i]();
            }
            len = queue.length;
        }
        draining = false;
    }


    return function nextTick(fun) {
        queue.push(fun);
        if (!draining) {
            scheduleDraining();
        }
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

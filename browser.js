// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var setImmediate = global.setImmediate || global.msSetImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener;

    // use native setImmediate if available
    if (setImmediate) {
        return function nextTick(f) {
            return setImmediate(f)
        };
    }

    var queue = [];
    function runQueue() {
        if (!queue.length) return;
        var queueList = queue.slice();
        queue.length = 0;
        queueList.forEach(function(fn) {
            fn();
        });
    }    
    
    // mutation observers are the fastest method on the main thread
    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(runQueue);
        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }
    
    // fastest available method in Workers in Chrome
    if (typeof Object.observe === 'function') {
        var obj = { key: 0 };
        Object.observe(obj, runQueue);
        
        return function nextTick(fn) {
            if (!queue.length) {
                obj.key++;
            }
            queue.push(fn);
        };
    }
    
    // next fastest method for workers: native promises. 
    // supported by Firefox, and Safari 8+
    if (typeof Promise !== 'undefined') {
        return function(fn) {
            if (!queue.length) {
                Promise.resolve().then(runQueue);
            }
            queue.push(fn);
        }
    }
    
    // final method for workers: message channel
    // supported by older Chrome and Safari
    if (typeof MessageChannel !== 'undefined') {
        var channel = new MessageChannel();
        channel.port1.onmessage = runQueue;

        return function nextTick(fn) {
            if (!queue.length) {
                channel.port2.postMessage('tick');
            }
            queue.push(fn);
        };
    }
    
    // On the main thread, postMessage is fast if mutation observers aren't available
    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                runQueue();
            }
        }, true);

        return function nextTick(fn) {
            if (!queue.length) {
                window.postMessage('process-tick', '*');
            }
            queue.push(fn);
        };
    }

    // Otherwise, fall back to setTimeout
    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

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

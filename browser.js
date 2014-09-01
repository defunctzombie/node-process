// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined' && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined' && typeof document !== 'undefined' && window.MutationObserver;
    var canPost = typeof window !== 'undefined' && window.postMessage && window.addEventListener;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canMutationObserver) {
        return (function () {
            var hiddenDiv = document.createElement("div");
            var fns = [];
            var observer = new MutationObserver(function () {
                var fnList = fns.slice();
                fns.length = 0;
                fnList.forEach(function (fn) {
                    fn();
                });
            });

            observer.observe(hiddenDiv, { attributes: true });

            return function nextTick(fn) {
                if (!fns.length) {
                    hiddenDiv.setAttribute('yes', 'no');
                }
                fns.push(fn);
            };
      })()
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

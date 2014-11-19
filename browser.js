// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
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
process.umask = function() { return 0; };

/**
 * Return a buffered 'write' function.
 * @param  {Function} printProxy Writes new lines to some output display.
 * @return {Function}
 */
function newStreamWriteShim(printProxy){
    var buffer = [],
        npos = 0; // next position

    /**
     * Use 'printProxy' to print 'str'.
     * Use 'printProxy' when a new line is detected. Until then, store strings
     * in 'buffer'.
     * @param  {String} str The string to print
     * @param  {Sting} enc **ignored**
     * @param  {Function} cb Called asyncly
     * @return {Boolean} Always returns 'true'
     */
    function _writeShim(str, enc, cb){
        cb = cb || enc || noop;
        if ('function' !== typeof cb) cb = noop;

        var c, i = 0;
        while ( (c = str[i++]) ){
            if ('\n' === c){
                printProxy(buffer.join(''));
                buffer.length = npos = 0;
            } else if ('\b' === c){
                npos--;
            } else if ('\r' === c){
                npos = 0;
            } else {
                buffer[npos++] = c;
            }
        }

        process.nextTick(cb);

        return true;
    }

    return _writeShim;
}

process.stdout = { write: newStreamWriteShim(console.log.bind(console)) };
process.stderr = { write: newStreamWriteShim(console.error.bind(console)) };

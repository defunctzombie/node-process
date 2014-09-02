// shim for using process in browser

function noop() {}

module.exports = {
    nextTick : (function () {
        var win = typeof window !== 'undefined' && window,
            doc = win && win.document,

            setImmediate = win && win.setImmediate,
            MutationObserver = doc && win.MutationObserver,
            postMessage = win.addEventListener && win.postMessage,

            queue = [];

        if (setImmediate) {
            return function (fn) {
                return setImmediate(fn);
            };
        }

        if (MutationObserver) {
            var hiddenDiv = doc.createElement("div");
            var observer = new MutationObserver(function () {
                var fnList = queue.slice();
                queue.length = 0;
                fnList.forEach(function (fn) {
                    fn();
                });
            });

            observer.observe(hiddenDiv, { attributes: true });

            return function (fn) {
                if (!queue.length) {
                    hiddenDiv.setAttribute('yes', 'no');
                }
                queue.push(fn);
            };
        }

        if (postMessage) {
            var msgData = 'process-tick';
            win.addEventListener('message', function (ev) {
                var source = ev.source;
                if ((source === win || source === null) && ev.data === msgData) {
                    ev.stopPropagation();
                    if (queue.length > 0) {
                        queue.shift()();
                    }
                }
            }, true);

            return function (fn) {
                queue.push(fn);
                postMessage(msgData, '*');
            };
        }

        return function (fn) {
            setTimeout(fn, 0);
        };
    })(),

    title: 'browser',
    browser: true,
    env: {},
    argv: [],

    on: noop,
    addListener: noop,
    once: noop,
    off: noop,
    removeListener: noop,
    removeAllListeners: noop,
    emit: noop,

    binding: function (name) {
        throw new Error('process.binding is not supported');
    },

    // TODO(shtylman)
    cwd: function () { return '/' },
    chdir: function (dir) {
        throw new Error('process.chdir is not supported');
    }
};

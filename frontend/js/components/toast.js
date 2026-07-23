/**
 * Toast notification system.
 */
var Toast = (function() {
    var container = null;

    function getContainer() {
        if (!container) {
            container = document.getElementById('toast-container');
        }
        return container;
    }

    /**
     * Show a toast message.
     * @param {string} message
     * @param {string} type - 'success', 'error', 'warning', 'info'
     * @param {number} duration - ms, default 3000
     */
    function show(message, type, duration) {
        type = type || 'info';
        duration = duration || 3000;

        var c = getContainer();
        if (!c) return;

        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.textContent = message;

        c.appendChild(toast);

        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    function success(msg, dur) { show(msg, 'success', dur); }
    function error(msg, dur)   { show(msg, 'error', dur); }
    function warning(msg, dur) { show(msg, 'warning', dur); }
    function info(msg, dur)    { show(msg, 'info', dur); }

    return {
        show: show,
        success: success,
        error: error,
        warning: warning,
        info: info,
    };
})();

/**
 * Modal dialog component.
 */
var Modal = (function() {
    var currentOverlay = null;

    /**
     * Show a modal.
     * @param {Object} opts - { title, body, confirmText, cancelText, onConfirm, onCancel, danger }
     * @returns {HTMLElement} The overlay element
     */
    function show(opts) {
        opts = opts || {};
        var title = opts.title || '';
        var body = opts.body || '';
        var confirmText = opts.confirmText || '确定';
        var cancelText = opts.cancelText || '取消';
        var onConfirm = opts.onConfirm || null;
        var onCancel = opts.onCancel || null;
        var danger = opts.danger || false;

        // Remove existing
        close();

        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        overlay.innerHTML =
            '<div class="modal-dialog">' +
                '<div class="modal-header">' +
                    '<h2 class="modal-title">' + Utils.escapeHtml(title) + '</h2>' +
                    '<button class="btn-icon modal-close-btn" aria-label="Close">' +
                        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
                    '</button>' +
                '</div>' +
                '<div class="modal-body">' + (typeof body === 'string' ? body : '') + '</div>' +
                '<div class="modal-footer">' +
                    '<button class="btn btn-outline modal-cancel-btn">' + Utils.escapeHtml(cancelText) + '</button>' +
                    '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + ' modal-confirm-btn">' + Utils.escapeHtml(confirmText) + '</button>' +
                '</div>' +
            '</div>';

        // If body is a DOM element, append it
        if (typeof body !== 'string' && body instanceof HTMLElement) {
            overlay.querySelector('.modal-body').appendChild(body);
        }

        document.body.appendChild(overlay);
        currentOverlay = overlay;

        // Event listeners
        var closeModal = function() {
            close();
            if (onCancel) onCancel();
        };

        overlay.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        overlay.querySelector('.modal-cancel-btn').addEventListener('click', closeModal);
        overlay.querySelector('.modal-confirm-btn').addEventListener('click', function() {
            if (onConfirm) {
                var result = onConfirm();
                if (result === false) return;  // Validation failed, keep modal open
            }
            close();
        });

        // Close on backdrop click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal();
        });

        return overlay;
    }

    /**
     * Show a confirm dialog. Returns a Promise.
     * @param {string} title
     * @param {string} message
     * @param {Object} opts - { confirmText, cancelText, danger }
     * @returns {Promise<boolean>}
     */
    function confirm(title, message, opts) {
        opts = opts || {};
        return new Promise(function(resolve) {
            show({
                title: title,
                body: '<p>' + Utils.escapeHtml(message) + '</p>',
                confirmText: opts.confirmText || '确定',
                cancelText: opts.cancelText || '取消',
                danger: opts.danger || false,
                onConfirm: function() { resolve(true); },
                onCancel: function() { resolve(false); },
            });
        });
    }

    function close() {
        if (currentOverlay) {
            if (currentOverlay.parentNode) {
                currentOverlay.parentNode.removeChild(currentOverlay);
            }
            currentOverlay = null;
        }
    }

    return {
        show: show,
        confirm: confirm,
        close: close,
    };
})();

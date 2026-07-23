/**
 * Utility functions for the FX Assistant app.
 */
const Utils = {
    /**
     * Format a number as currency (CNY).
     * @param {number} value
     * @param {number} decimals
     * @returns {string}
     */
    formatCurrency(value, decimals) {
        decimals = (decimals !== undefined) ? decimals : 2;
        if (value === null || value === undefined || isNaN(value)) return '--';
        return Number(value).toLocaleString('zh-CN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    },

    /**
     * Format a number as a foreign currency amount.
     * @param {number} value
     * @param {string} code - Currency code (e.g., 'USD', 'JPY')
     * @returns {string}
     */
    formatForeign(value, code) {
        if (value === null || value === undefined || isNaN(value)) return '--';
        var decimals = (code === 'JPY' || code === 'KRW') ? 0 : 2;
        var symbol = this.getCurrencySymbol(code);
        return symbol + ' ' + Number(value).toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    },

    /**
     * Get currency symbol by code.
     * @param {string} code
     * @returns {string}
     */
    getCurrencySymbol(code) {
        var symbols = {
            'USD': '$', 'EUR': '€', 'JPY': '¥', 'GBP': '£',
            'AUD': 'A$', 'HKD': 'HK$', 'CAD': 'C$', 'CHF': 'Fr',
            'SGD': 'S$', 'KRW': '₩', 'CNY': '¥'
        };
        return symbols[code] || code;
    },

    /**
     * Format a percentage value.
     * @param {number} value - e.g., 0.0523 for 5.23%
     * @param {number} decimals
     * @returns {string}
     */
    formatPercent(value, decimals) {
        decimals = (decimals !== undefined) ? decimals : 2;
        if (value === null || value === undefined || isNaN(value)) return '--';
        return Number(value).toFixed(decimals) + '%';
    },

    /**
     * Format a date string.
     * @param {string|Date} date
     * @param {string} format - 'short', 'full', 'iso'
     * @returns {string}
     */
    formatDate(date, format) {
        format = format || 'short';
        if (!date) return '--';
        var d = (typeof date === 'string') ? new Date(date) : date;
        if (isNaN(d.getTime())) return '--';

        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');

        if (format === 'iso') return y + '-' + m + '-' + day;
        if (format === 'full') return y + '年' + m + '月' + day + '日';
        return m + '-' + day; // short
    },

    /**
     * Format relative time (e.g., "3小时前").
     * @param {string|Date} date
     * @returns {string}
     */
    formatRelativeTime(date) {
        if (!date) return '';
        var d = (typeof date === 'string') ? new Date(date) : date;
        var now = new Date();
        var diff = now - d;
        var seconds = Math.floor(diff / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        var days = Math.floor(hours / 24);

        if (seconds < 60) return '刚刚';
        if (minutes < 60) return minutes + '分钟前';
        if (hours < 24) return hours + '小时前';
        if (days < 7) return days + '天前';
        return this.formatDate(date, 'short');
    },

    /**
     * Debounce a function.
     * @param {Function} fn
     * @param {number} delay - ms
     * @returns {Function}
     */
    debounce: function(fn, delay) {
        var timer = null;
        return function() {
            var ctx = this;
            var args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
        };
    },

    /**
     * Escape HTML entities.
     * @param {string} str
     * @returns {string}
     */
    escapeHtml: function(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    },

    /**
     * Generate a simple unique ID.
     * @returns {string}
     */
    uid: function() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Parse query parameters from a hash fragment.
     * @param {string} hash - e.g., '#/records?currency=USD&year=2024'
     * @returns {{path: string, params: Object}}
     */
    parseHash: function(hash) {
        var raw = hash || window.location.hash || '#/';
        var path = raw.replace(/^#/, '');
        var params = {};
        var qIndex = path.indexOf('?');
        if (qIndex !== -1) {
            var query = path.substring(qIndex + 1);
            path = path.substring(0, qIndex);
            query.split('&').forEach(function(pair) {
                var parts = pair.split('=');
                if (parts[0]) {
                    params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
                }
            });
        }
        return { path: path, params: params };
    },

    /**
     * Build a hash URL with query params.
     * @param {string} path
     * @param {Object} params
     * @returns {string}
     */
    buildHash: function(path, params) {
        var qs = [];
        for (var k in params) {
            if (params.hasOwnProperty(k) && params[k] !== null && params[k] !== undefined && params[k] !== '') {
                qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
            }
        }
        return '#/' + path.replace(/^\//, '') + (qs.length ? '?' + qs.join('&') : '');
    },

    /**
     * PnL helper: determine CSS class and sign.
     * @param {number} pnl
     * @returns {{cls: string, sign: string}}
     */
    pnlClass: function(pnl) {
        if (pnl > 0) return { cls: 'positive', sign: '+' };
        if (pnl < 0) return { cls: 'negative', sign: '−' };
        return { cls: '', sign: '' };
    },
};

// Also expose on window for inline usage
window.Utils = Utils;

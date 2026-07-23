/**
 * Simple pub/sub state store with localStorage persistence.
 */
var Store = (function() {
    function Store(initial) {
        this._data = {};
        this._subs = {};
        this._persistKeys = ['token', 'user', 'settings', 'currencies'];

        // Load persisted keys from localStorage
        var self = this;
        this._persistKeys.forEach(function(key) {
            try {
                var stored = localStorage.getItem('fx_' + key);
                if (stored) {
                    self._data[key] = JSON.parse(stored);
                }
            } catch (e) {
                // ignore parse errors
            }
        });

        // Merge initial values
        if (initial) {
            for (var k in initial) {
                if (initial.hasOwnProperty(k) && !(k in this._data)) {
                    this._data[k] = initial[k];
                }
            }
        }
    }

    Store.prototype.get = function(key) {
        return this._data[key];
    };

    Store.prototype.set = function(key, value) {
        this._data[key] = value;

        // Persist if needed
        if (this._persistKeys.indexOf(key) !== -1) {
            try {
                localStorage.setItem('fx_' + key, JSON.stringify(value));
            } catch (e) {
                // localStorage full or unavailable
            }
        }

        // Notify subscribers
        var subs = this._subs[key] || [];
        for (var i = 0; i < subs.length; i++) {
            try { subs[i](value); } catch (e) {}
        }
    };

    Store.prototype.on = function(key, fn) {
        if (!this._subs[key]) this._subs[key] = [];
        this._subs[key].push(fn);
    };

    Store.prototype.off = function(key, fn) {
        if (!this._subs[key]) return;
        this._subs[key] = this._subs[key].filter(function(f) { return f !== fn; });
    };

    Store.prototype.clear = function() {
        var self = this;
        this._persistKeys.forEach(function(key) {
            localStorage.removeItem('fx_' + key);
            self._data[key] = null;
        });
    };

    Store.prototype.isAuthenticated = function() {
        return !!(this._data.token && this._data.user);
    };

    return Store;
})();

/**
 * API client for communicating with the Flask backend.
 */
var ApiClient = (function() {
    function ApiClient(base) {
        this.base = base || '/api';
        this.token = null;
    }

    ApiClient.prototype.setToken = function(token) {
        this.token = token;
    };

    ApiClient.prototype.clearToken = function() {
        this.token = null;
    };

    ApiClient.prototype._fetch = function(method, path, body) {
        var headers = { 'Content-Type': 'application/json' };
        if (this.token) {
            headers['Authorization'] = 'Bearer ' + this.token;
        }

        var opts = { method: method, headers: headers };
        if (body !== undefined && body !== null) {
            opts.body = JSON.stringify(body);
        }

        var self = this;
        return fetch(this.base + path, opts).then(function(res) {
            return res.json().then(function(data) {
                if (!res.ok) {
                    var err = new Error((data && data.error && data.error.message) || 'Request failed');
                    err.status = res.status;
                    err.data = data;
                    throw err;
                }
                return data;
            }).catch(function(e) {
                // If JSON parse failed but response was ok, return raw
                if (e instanceof SyntaxError && res.ok) {
                    return null;
                }
                throw e;
            });
        });
    };

    ApiClient.prototype.get = function(path)    { return this._fetch('GET', path); };
    ApiClient.prototype.post = function(path, d) { return this._fetch('POST', path, d); };
    ApiClient.prototype.put = function(path, d)  { return this._fetch('PUT', path, d); };
    ApiClient.prototype.delete = function(path)  { return this._fetch('DELETE', path); };

    return ApiClient;
})();

/**
 * Hash-based SPA router.
 */
var Router = (function() {
    function Router(routes, ctx) {
        this.routes = routes || [];
        this.ctx = ctx || {};
        this.currentRoute = null;
        this.currentPage = null;
        this._onChange = this._onChange.bind(this);
    }

    Router.prototype.start = function() {
        window.addEventListener('hashchange', this._onChange);
        // Initial load
        if (!window.location.hash) {
            window.location.hash = '#/';
        } else {
            this._onChange();
        }
    };

    Router.prototype.stop = function() {
        window.removeEventListener('hashchange', this._onChange);
    };

    Router.prototype.navigate = function(path) {
        window.location.hash = '#/' + path.replace(/^#?\//, '').replace(/^\//, '');
    };

    Router.prototype._onChange = function() {
        var parsed = Utils.parseHash(window.location.hash);
        var route = this._matchRoute(parsed.path);

        // Cleanup previous page
        if (this.currentPage && this.currentPage.destroy) {
            this.currentPage.destroy();
        }

        var container = document.getElementById('app-content');
        if (!container) return;

        if (!route) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">页面未找到</div></div>';
            return;
        }

        // Update nav active states
        this._updateNav(parsed.path);

        // Update page title
        document.getElementById('page-title').textContent = route.title || '';

        // Clear content
        container.innerHTML = '';

        // Instantiate and render page
        var PageClass = route.page;
        if (typeof PageClass === 'function') {
            this.currentPage = new PageClass(this.ctx);
            this.currentPage.queryParams = parsed.params;
            this.currentPage.render();
        } else {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🚧</div><div class="empty-state-title">页面开发中</div></div>';
        }

        this.currentRoute = route;
    };

    Router.prototype._matchRoute = function(path) {
        // Normalize path
        path = '/' + path.replace(/^\/+/, '').replace(/\/+$/, '');
        for (var i = 0; i < this.routes.length; i++) {
            var r = this.routes[i];
            var routePath = '/' + r.path.replace(/^\/+/, '').replace(/\/+$/, '');
            if (path === routePath || (path === '/' && routePath === '/')) {
                return r;
            }
            // Simple param matching: /records/:id
            var routeParts = routePath.split('/');
            var pathParts = path.split('/');
            if (routeParts.length === pathParts.length) {
                var match = true;
                var params = {};
                for (var j = 0; j < routeParts.length; j++) {
                    if (routeParts[j].startsWith(':')) {
                        params[routeParts[j].substring(1)] = pathParts[j];
                    } else if (routeParts[j] !== pathParts[j]) {
                        match = false;
                        break;
                    }
                }
                if (match) return r;
            }
        }
        return null;
    };

    Router.prototype._updateNav = function(path) {
        // Update sidebar nav
        var sidebarLinks = document.querySelectorAll('.sidebar-menu .nav-link');
        for (var i = 0; i < sidebarLinks.length; i++) {
            var link = sidebarLinks[i];
            var route = link.getAttribute('data-route');
            if (path === route || (path === '/' && route === '/')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        }

        // Update bottom nav
        var bottomItems = document.querySelectorAll('.bottom-nav-item');
        for (var j = 0; j < bottomItems.length; j++) {
            var item = bottomItems[j];
            var itemRoute = item.getAttribute('data-route');
            if (path === itemRoute || (path === '/' && itemRoute === '/')) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    };

    return Router;
})();

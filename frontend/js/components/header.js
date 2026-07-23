/**
 * Header component with sidebar toggle and user menu.
 */
var Header = (function() {
    function init(ctx) {
        var toggle = document.getElementById('menu-toggle');
        var sidebar = document.getElementById('sidebar-nav');
        var backdrop = document.querySelector('.sidebar-backdrop');

        if (toggle && sidebar) {
            toggle.addEventListener('click', function() {
                var isOpen = sidebar.classList.contains('open');

                if (isOpen) {
                    sidebar.classList.remove('open');
                    if (backdrop) backdrop.classList.remove('visible');
                } else {
                    // Create backdrop for mobile
                    if (!backdrop) {
                        backdrop = document.createElement('div');
                        backdrop.className = 'sidebar-backdrop';
                        document.body.appendChild(backdrop);
                        backdrop.addEventListener('click', function() {
                            sidebar.classList.remove('open');
                            backdrop.classList.remove('visible');
                        });
                    }
                    sidebar.classList.add('open');
                    backdrop.classList.add('visible');
                }
            });
        }

        // User menu button
        var userBtn = document.getElementById('header-user-btn');
        if (userBtn && ctx && ctx.state) {
            userBtn.addEventListener('click', function() {
                if (ctx.state.isAuthenticated()) {
                    ctx.router.navigate('/settings');
                } else {
                    showAuthOverlay();
                }
            });
        }
    }

    function updateTitle(title) {
        var el = document.getElementById('page-title');
        if (el) el.textContent = title;
    }

    function showAuthOverlay() {
        var overlay = document.getElementById('auth-overlay');
        if (overlay) overlay.style.display = 'flex';
    }

    return {
        init: init,
        updateTitle: updateTitle,
    };
})();

/**
 * Navigation component - handles sidebar and bottom nav interactions.
 */
var Nav = (function() {
    function init() {
        // Sidebar nav links already handled by router._updateNav()
        // Bottom nav items handled by router

        // Close sidebar when a link is clicked on mobile
        var sidebarLinks = document.querySelectorAll('.sidebar-menu .nav-link');
        for (var i = 0; i < sidebarLinks.length; i++) {
            sidebarLinks[i].addEventListener('click', function() {
                var sidebar = document.getElementById('sidebar-nav');
                var backdrop = document.querySelector('.sidebar-backdrop');
                if (window.innerWidth < 768) {
                    if (sidebar) sidebar.classList.remove('open');
                    if (backdrop) backdrop.classList.remove('visible');
                }
            });
        }
    }

    return {
        init: init,
    };
})();

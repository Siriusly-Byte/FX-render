/**
 * App bootstrap - Initializes store, API, router, and starts the app.
 */
(function() {
    // Initialize state
    var state = new Store();

    // Initialize API client
    var api = new ApiClient('/api');
    if (state.get('token')) {
        api.setToken(state.get('token'));
    }

    // Listen for token changes
    state.on('token', function(token) {
        if (token) {
            api.setToken(token);
        } else {
            api.clearToken();
        }
    });

    // Context passed to all pages
    var ctx = {
        state: state,
        api: api,
    };

    // Initialize header and navigation
    Header.init(ctx);
    Nav.init();

    // Define routes
    var router = new Router([
        { path: '/',            page: DashboardPage,  title: '仪表盘' },
        { path: '/records',     page: RecordsPage,    title: '交易记录' },
        { path: '/calculator',  page: CalculatorPage, title: '理财计算器' },
        { path: '/reminders',   page: RemindersPage,  title: '提醒中心' },
        { path: '/settings',    page: SettingsPage,   title: '设置' },
    ], ctx);

    // Make router available on context
    ctx.router = router;

    // Start the router
    router.start();

    // Check authentication state
    if (!state.isAuthenticated()) {
        // Show auth overlay (can be toggled)
        document.getElementById('auth-overlay').style.display = 'flex';
        // Load auth forms
        renderAuthForms();
    } else {
        document.getElementById('auth-overlay').style.display = 'none';
    }

    /**
     * Render login/register forms in the auth overlay.
     */
    function renderAuthForms() {
        var container = document.getElementById('auth-forms');
        if (!container) return;

        container.innerHTML =
            '<div class="card" style="width:100%;max-width:400px;">' +
                '<h2 class="text-center mb-xl" style="font-size:var(--text-2xl);">💱 外汇理财助手</h2>' +

                '<div id="auth-tabs" class="tabs mb-lg">' +
                    '<button class="tab-item active" data-auth-tab="login">登录</button>' +
                    '<button class="tab-item" data-auth-tab="register">注册</button>' +
                '</div>' +

                '<div id="auth-form-login">' +
                    '<div class="form-group">' +
                        '<label class="form-label">用户名</label>' +
                        '<input type="text" class="form-input" id="login-username" placeholder="请输入用户名">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label class="form-label">密码</label>' +
                        '<input type="password" class="form-input" id="login-password" placeholder="请输入密码">' +
                    '</div>' +
                    '<div id="login-error" class="form-error" style="display:none;"></div>' +
                    '<button id="login-submit" class="btn btn-primary btn-block btn-lg mt-md">登录</button>' +
                '</div>' +

                '<div id="auth-form-register" style="display:none;">' +
                    '<div class="form-group">' +
                        '<label class="form-label">用户名</label>' +
                        '<input type="text" class="form-input" id="reg-username" placeholder="请输入用户名">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label class="form-label">邮箱</label>' +
                        '<input type="email" class="form-input" id="reg-email" placeholder="请输入邮箱">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label class="form-label">密码</label>' +
                        '<input type="password" class="form-input" id="reg-password" placeholder="至少6位密码">' +
                    '</div>' +
                    '<div id="reg-error" class="form-error" style="display:none;"></div>' +
                    '<button id="register-submit" class="btn btn-primary btn-block btn-lg mt-md">注册</button>' +
                '</div>' +

                '<p class="text-center text-xs text-muted mt-lg">' +
                    '首次使用？请先注册账号。外汇数据仅供参考。' +
                '</p>' +
            '</div>';

        // Tab switching
        container.querySelectorAll('[data-auth-tab]').forEach(function(tab) {
            tab.addEventListener('click', function() {
                var target = this.getAttribute('data-auth-tab');
                container.querySelectorAll('[data-auth-tab]').forEach(function(t) { t.classList.remove('active'); });
                this.classList.add('active');
                document.getElementById('auth-form-login').style.display = target === 'login' ? 'block' : 'none';
                document.getElementById('auth-form-register').style.display = target === 'register' ? 'block' : 'none';
            });
        });

        // Login handler
        document.getElementById('login-submit').addEventListener('click', function() {
            var username = document.getElementById('login-username').value.trim();
            var password = document.getElementById('login-password').value;
            var errEl = document.getElementById('login-error');

            if (!username || !password) {
                errEl.textContent = '请填写用户名和密码';
                errEl.style.display = 'block';
                return;
            }

            api.post('/auth/login', { username: username, password: password }).then(function(res) {
                if (res && res.success && res.data) {
                    state.set('token', res.data.token);
                    state.set('user', res.data.user);
                    document.getElementById('auth-overlay').style.display = 'none';
                    Toast.success('登录成功');
                }
            }).catch(function(err) {
                errEl.textContent = (err.data && err.data.error && err.data.error.message) || '登录失败';
                errEl.style.display = 'block';
            });
        });

        // Register handler
        document.getElementById('register-submit').addEventListener('click', function() {
            var username = document.getElementById('reg-username').value.trim();
            var email = document.getElementById('reg-email').value.trim();
            var password = document.getElementById('reg-password').value;
            var errEl = document.getElementById('reg-error');

            if (!username || !email || !password) {
                errEl.textContent = '请填写所有字段';
                errEl.style.display = 'block';
                return;
            }

            api.post('/auth/register', { username: username, email: email, password: password }).then(function(res) {
                if (res && res.success && res.data) {
                    state.set('token', res.data.token);
                    state.set('user', res.data.user);
                    document.getElementById('auth-overlay').style.display = 'none';
                    Toast.success('注册成功，欢迎使用！');
                }
            }).catch(function(err) {
                errEl.textContent = (err.data && err.data.error && err.data.error.message) || '注册失败';
                errEl.style.display = 'block';
            });
        });

        // Enter key to submit
        container.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                var loginForm = document.getElementById('auth-form-login');
                if (loginForm && loginForm.style.display !== 'none') {
                    document.getElementById('login-submit').click();
                } else {
                    document.getElementById('register-submit').click();
                }
            }
        });
    }
})();

/**
 * Dashboard page - Fund overview + Rate board + Chart + Latest reminders
 */
var DashboardPage = (function() {
    function DashboardPage(ctx) {
        this.ctx = ctx;
        this.queryParams = {};
        this.chartPeriod = 30;
        this.selectedCurrency = 'USD';
    }

    DashboardPage.prototype.render = function() {
        var container = document.getElementById('app-content');
        if (!container) return;

        container.innerHTML =
            '<div class="page-section">' +
                '<h2 class="page-section-title">资金概览</h2>' +
                '<div id="fund-cards-container" class="dashboard-fund-cards">' +
                    '<div class="skeleton skeleton-card"></div>' +
                    '<div class="skeleton skeleton-card"></div>' +
                '</div>' +
            '</div>' +

            '<div class="page-section">' +
                '<div id="rate-board-container"></div>' +
            '</div>' +

            '<div class="page-section">' +
                '<div class="chart-container">' +
                    '<div class="chart-header">' +
                        '<span class="chart-title">汇率走势</span>' +
                        '<div class="chart-controls">' +
                            '<select id="chart-currency-select" class="form-select" style="width:auto;min-width:80px;"></select>' +
                            '<button class="chart-period-btn" data-days="7">7天</button>' +
                            '<button class="chart-period-btn active" data-days="30">30天</button>' +
                            '<button class="chart-period-btn" data-days="90">90天</button>' +
                            '<button class="chart-period-btn" data-days="365">1年</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="chart-canvas-wrapper">' +
                        '<canvas id="rate-chart-canvas"></canvas>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<div class="page-section">' +
                '<div class="dashboard-reminders">' +
                    '<div class="card-header">' +
                        '<span class="card-title">最新提醒</span>' +
                        '<a href="#/reminders" class="text-sm" style="color:var(--color-primary)">查看全部</a>' +
                    '</div>' +
                    '<div id="dashboard-reminders-list">' +
                        '<div class="empty-state-text text-center">暂无提醒</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        this._loadData();
        this._bindEvents();
    };

    DashboardPage.prototype.destroy = function() {
        RateChart.destroy();
        RateBoard.stopAutoRefresh();
    };

    DashboardPage.prototype._loadData = function() {
        var self = this;
        var api = this.ctx.api;

        // Load portfolio summary
        if (this.ctx.state.isAuthenticated()) {
            api.get('/portfolio/summary').then(function(res) {
                if (res && res.success && res.data) {
                    FundCard.renderList(
                        document.getElementById('fund-cards-container'),
                        res.data.holdings || []
                    );
                }
            }).catch(function() {
                // Show empty state
                var c = document.getElementById('fund-cards-container');
                if (c) {
                    c.innerHTML = '<div class="empty-state">' +
                        '<div class="empty-state-icon">📊</div>' +
                        '<div class="empty-state-title">暂无持仓数据</div>' +
                    '</div>';
                }
            });
        } else {
            var c = document.getElementById('fund-cards-container');
            if (c) {
                c.innerHTML = '<div class="empty-state">' +
                    '<div class="empty-state-icon">👋</div>' +
                    '<div class="empty-state-title">欢迎使用外汇理财助手</div>' +
                    '<div class="empty-state-text">请先登录以查看您的持仓数据</div>' +
                '</div>';
            }
        }

        // Load current rates + bank comparison
        self._refreshRateBoard();

        // Start auto-refresh bank rates every 30s
        RateBoard.startAutoRefresh(
            document.getElementById('rate-board-container'),
            api,
            30000
        );

        // Load latest reminders
        if (this.ctx.state.isAuthenticated()) {
            api.get('/reminders?per_page=3').then(function(res) {
                if (res && res.success && res.data) {
                    var list = document.getElementById('dashboard-reminders-list');
                    var items = Array.isArray(res.data) ? res.data : (res.data.items || []);
                    if (list) {
                        if (items.length === 0) {
                            list.innerHTML = '<div class="empty-state-text text-center">暂无提醒 🎉</div>';
                        } else {
                            list.innerHTML = items.map(function(r) {
                                var typeLabel = ReminderCard.TYPE_LABELS[r.reminder_type] || r.reminder_type;
                                var dotClass = r.reminder_type.replace('_', '-');
                                return '<div class="reminder-mini">' +
                                    '<span class="reminder-mini-dot ' + dotClass + '"></span>' +
                                    '<div class="flex-1">' +
                                        '<div class="text-sm fw-600">' + Utils.escapeHtml(r.title) + '</div>' +
                                        '<div class="text-xs text-muted">' + Utils.escapeHtml(r.message).substring(0, 60) + '</div>' +
                                    '</div>' +
                                    '<span class="text-xs text-muted">' + Utils.formatRelativeTime(r.created_at) + '</span>' +
                                '</div>';
                            }).join('');
                        }
                    }
                }
            }).catch(function() {});
        }
    };

    DashboardPage.prototype._refreshRateBoard = function() {
        var self = this;
        var api = this.ctx.api;
        var container = document.getElementById('rate-board-container');

        var lastUpdate = localStorage.getItem('fx_last_rate_update') || '';

        api.get('/rates/current').then(function(res) {
            if (res && res.success && res.data) {
                RateBoard.render(container, res.data, null, lastUpdate);

                var sel = document.getElementById('chart-currency-select');
                if (sel && res.data.length > 0) {
                    sel.innerHTML = res.data.map(function(r) {
                        return '<option value="' + r.code + '">' + r.code + '/CNY</option>';
                    }).join('');
                    self.selectedCurrency = res.data[0].code;
                    self._loadChart();
                }

                api.get('/rates/banks').then(function(bankRes) {
                    if (bankRes && bankRes.success && bankRes.data) {
                        RateBoard.render(container, res.data, bankRes.data, lastUpdate);
                    }
                }).catch(function() {});
            }
        }).catch(function() {});
    };

    DashboardPage.prototype._loadChart = function() {
        var self = this;
        var api = this.ctx.api;
        var endDate = new Date().toISOString().split('T')[0];
        var startDate = new Date(Date.now() - this.chartPeriod * 86400000).toISOString().split('T')[0];

        api.get('/rates/history?currency=' + this.selectedCurrency + '&start=' + startDate + '&end=' + endDate)
            .then(function(res) {
                if (res && res.success && res.data) {
                    RateChart.render('rate-chart-canvas', res.data, self.selectedCurrency);
                }
            }).catch(function() {});
    };

    DashboardPage.prototype._bindEvents = function() {
        var self = this;

        // Rate refresh button (delegated)
        var content = document.getElementById('app-content');
        if (content) {
            content.addEventListener('click', function(e) {
                if (e.target && e.target.id === 'rate-refresh-btn') {
                    e.target.textContent = '⏳ 抓取中...';
                    e.target.disabled = true;
                    self.ctx.api.post('/rates/fetch', {}).then(function(res) {
                        if (res && res.success) {
                            var now = new Date();
                            var ts = now.getFullYear() + '-' +
                                (now.getMonth()+1).toString().padStart(2,'0') + '-' +
                                now.getDate().toString().padStart(2,'0') + ' ' +
                                now.getHours().toString().padStart(2,'0') + ':' +
                                now.getMinutes().toString().padStart(2,'0') + ':' +
                                now.getSeconds().toString().padStart(2,'0');
                            localStorage.setItem('fx_last_rate_update', ts);
                            Toast.success('已更新至外管局 ' + res.data.date + ' 数据');
                            self._refreshRateBoard();
                        }
                    }).catch(function() {
                        Toast.error('抓取失败，请检查网络');
                    }).finally(function() {
                        var btn = document.getElementById('rate-refresh-btn');
                        if (btn) { btn.textContent = '🔄 刷新'; btn.disabled = false; }
                    });
                }
            });
        }

        // Chart period buttons
        var periodBtns = document.querySelectorAll('.chart-period-btn');
        for (var i = 0; i < periodBtns.length; i++) {
            periodBtns[i].addEventListener('click', function() {
                periodBtns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                self.chartPeriod = parseInt(this.getAttribute('data-days'), 10);
                self._loadChart();
            });
        }

        // Chart currency selector
        var sel = document.getElementById('chart-currency-select');
        if (sel) {
            sel.addEventListener('change', function() {
                self.selectedCurrency = this.value;
                self._loadChart();
            });
        }
    };

    return DashboardPage;
})();

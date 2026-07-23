/**
 * Settings page - All user-configurable parameters.
 */
var SettingsPage = (function() {
    function SettingsPage(ctx) {
        this.ctx = ctx;
        this.queryParams = {};
        this.settings = {};
        this.originalSettings = {};
    }

    SettingsPage.prototype.render = function() {
        var container = document.getElementById('app-content');
        if (!container) return;

        container.innerHTML =
            '<div id="settings-container">' +
                '<div class="skeleton skeleton-card" style="height:200px;"></div>' +
            '</div>';

        this._loadData();
    };

    SettingsPage.prototype.destroy = function() {};

    SettingsPage.prototype._loadData = function() {
        var self = this;
        var api = this.ctx.api;

        if (!this.ctx.state.isAuthenticated()) {
            document.getElementById('settings-container').innerHTML =
                '<div class="empty-state"><div class="empty-state-icon">🔒</div><div class="empty-state-title">请先登录</div></div>';
            return;
        }

        api.get('/settings').then(function(res) {
            if (res && res.success && res.data) {
                self.settings = {};
                (res.data || []).forEach(function(s) {
                    self.settings[s.key] = s.value;
                });
                self.originalSettings = Object.assign({}, self.settings);
                self._render();
            }
        }).catch(function() {
            Toast.error('加载设置失败');
        });

        // Also load user info
        api.get('/auth/profile').then(function(res) {
            if (res && res.success && res.data) {
                self.userInfo = res.data;
                self._renderUserSection();
            }
        }).catch(function() {});
    };

    SettingsPage.prototype._render = function() {
        var container = document.getElementById('settings-container');
        if (!container) return;

        var s = this.settings;

        container.innerHTML =
            // Short-term Strategy
            '<div class="settings-group">' +
                '<h2 class="settings-group-title">短期套利策略</h2>' +
                '<div class="text-xs text-muted mb-md">适用于短期波动交易，阈值小、反应快</div>' +
                this._row('短期资金比例 (%)', '总资金中用于短期套利的比例', 'short_term_ratio', 'number', s.short_term_ratio) +
                this._row('买入阈值 (%)', '牌价低于成本此百分比触发买入', 'short_buy_threshold', 'number', s.short_buy_threshold) +
                this._row('卖出阈值 (%)', '牌价高于成本此百分比触发卖出', 'short_sell_threshold', 'number', s.short_sell_threshold) +
                this._row('趋势天数', '连续涨跌多少天触发趋势提醒', 'short_trend_days', 'number', s.short_trend_days) +
            '</div>' +

            // Long-term Strategy
            '<div class="settings-group">' +
                '<h2 class="settings-group-title">长期配置策略</h2>' +
                '<div class="text-xs text-muted mb-md">适用于长期价值投资，阈值大、耐波动</div>' +
                this._row('长期资金比例 (%)', '自动 = 100% - 短期比例', 'long_ratio_display', 'info', 100 - (parseInt(s.short_term_ratio) || 30)) +
                this._row('买入阈值 (%)', '牌价低于成本此百分比触发买入', 'long_buy_threshold', 'number', s.long_buy_threshold) +
                this._row('卖出阈值 (%)', '牌价高于成本此百分比触发卖出', 'long_sell_threshold', 'number', s.long_sell_threshold) +
                this._row('趋势天数', '连续涨跌多少天触发趋势提醒', 'long_trend_days', 'number', s.long_trend_days) +
            '</div>' +

            // Investment Parameters
            '<div class="settings-group">' +
                '<h2 class="settings-group-title">投资参数</h2>' +
                this._row('总预算 (USD)', '年度购汇总预算，上限$50,000', 'total_budget_usd', 'number', s.total_budget_usd) +
                this._row('建议操作比例 (%)', '每次提醒建议操作的金额占剩余资金比例', 'suggested_operation_pct', 'number', s.suggested_operation_pct) +
                this._row('年度额度预警 (%)', '额度使用到此百分比时预警', 'quota_alert_pct', 'number', s.quota_alert_pct) +
            '</div>' +

            // Display
            '<div class="settings-group">' +
                '<h2 class="settings-group-title">显示设置</h2>' +
                this._row('默认币种', '', 'default_currency', 'select', s.default_currency,
                    [{v:'USD',l:'USD - 美元'},{v:'EUR',l:'EUR - 欧元'},{v:'JPY',l:'JPY - 日元'},{v:'GBP',l:'GBP - 英镑'}]) +
                this._row('图表默认天数', '走势图默认显示多少天', 'chart_period_days', 'number', s.chart_period_days) +
            '</div>' +

            // Account & Notifications
            '<div class="settings-group" id="user-info-section">' +
                '<h2 class="settings-group-title">账户信息</h2>' +
                '<div id="user-info-content" class="py-md"></div>' +
            '</div>' +

            '<div class="settings-group">' +
                '<h2 class="settings-group-title">通知设置</h2>' +
                this._row('邮件通知', '', 'email_notifications', 'boolean', s.email_notifications) +
                this._row('邮件地址', '接收月度报告和提醒', 'email', 'string', s.email) +
                this._row('月度报告', '每月自动生成复盘报告', 'report_enabled', 'boolean', s.report_enabled) +
            '</div>' +

            '<button id="settings-save" class="btn btn-primary btn-block btn-lg mt-xl">保存设置</button>' +

            // Data management
            '<div class="settings-group settings-danger mt-xl">' +
                '<h2 class="settings-group-title">数据管理</h2>' +
                '<div class="export-option">' +
                    '<div class="export-info">' +
                        '<div class="export-name">导出交易记录 (Excel)</div>' +
                        '<div class="export-desc">下载所有购汇和赎回记录</div>' +
                    '</div>' +
                    '<button id="export-excel" class="btn btn-sm btn-outline">导出</button>' +
                '</div>' +
                '<div class="export-option">' +
                    '<div class="export-info">' +
                        '<div class="export-name">生成月度报告</div>' +
                        '<div class="export-desc">生成并发送月度复盘报告到您的邮箱</div>' +
                    '</div>' +
                    '<button id="send-monthly-report" class="btn btn-sm btn-outline">生成</button>' +
                '</div>' +
            '</div>';

        this._bindEvents();
    };

    SettingsPage.prototype._row = function(label, desc, key, type, value, options) {
        var controlHtml = '';
        if (type === 'boolean') {
            controlHtml = '<label class="toggle">' +
                '<input type="checkbox" id="set-' + key + '" data-key="' + key + '" data-type="' + type + '" ' + (value ? 'checked' : '') + '>' +
                '<span class="toggle-track"></span>' +
            '</label>';
        } else if (type === 'select' && options) {
            controlHtml = '<select class="form-select" id="set-' + key + '" data-key="' + key + '" data-type="' + type + '">' +
                options.map(function(o) {
                    return '<option value="' + o.v + '"' + (value == o.v ? ' selected' : '') + '>' + Utils.escapeHtml(o.l) + '</option>';
                }).join('') +
            '</select>';
        } else if (type === 'info') {
            controlHtml = '<span class="fw-600">' + value + '%</span>';
            return '<div class="settings-row">' +
                '<div class="flex-1">' +
                    '<div class="settings-label">' + Utils.escapeHtml(label) + '</div>' +
                    (desc ? '<div class="settings-description">' + Utils.escapeHtml(desc) + '</div>' : '') +
                '</div>' +
                '<div class="settings-control">' + controlHtml + '</div>' +
            '</div>';
        } else {
            controlHtml = '<input type="' + (type === 'number' ? 'number' : 'text') + '" ' +
                'class="form-input" id="set-' + key + '" data-key="' + key + '" data-type="' + type + '" ' +
                'value="' + (value || '') + '"' + (type === 'number' ? ' step="any"' : '') + '>';
        }

        return '<div class="settings-row">' +
            '<div class="flex-1">' +
                '<div class="settings-label">' + Utils.escapeHtml(label) + '</div>' +
                (desc ? '<div class="settings-description">' + Utils.escapeHtml(desc) + '</div>' : '') +
            '</div>' +
            '<div class="settings-control">' + controlHtml + '</div>' +
        '</div>';
    };

    SettingsPage.prototype._renderUserSection = function() {
        var el = document.getElementById('user-info-content');
        if (!el || !this.userInfo) return;
        el.innerHTML = '<div class="settings-row">' +
            '<span class="settings-label">用户名</span><span class="fw-600">' + Utils.escapeHtml(this.userInfo.username) + '</span>' +
        '</div>' +
        '<div class="settings-row">' +
            '<span class="settings-label">邮箱</span><span class="fw-600">' + Utils.escapeHtml(this.userInfo.email || '未设置') + '</span>' +
        '</div>';
    };

    SettingsPage.prototype._collectSettings = function() {
        var inputs = document.querySelectorAll('[data-key]');
        var settings = [];
        for (var i = 0; i < inputs.length; i++) {
            var el = inputs[i];
            var key = el.getAttribute('data-key');
            var type = el.getAttribute('data-type');
            var value;
            if (type === 'boolean') {
                value = el.checked;
            } else {
                value = el.value;
            }
            settings.push({ key: key, value: String(value) });
        }
        return settings;
    };

    SettingsPage.prototype._bindEvents = function() {
        var self = this;

        var saveBtn = document.getElementById('settings-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                var settings = self._collectSettings();
                self.ctx.api.put('/settings', { settings: settings }).then(function(res) {
                    if (res && res.success) {
                        Toast.success('设置已保存');
                        // Update cached settings
                        self.ctx.state.set('settings', settings.reduce(function(acc, s) {
                            acc[s.key] = s.value;
                            return acc;
                        }, {}));
                    }
                }).catch(function(err) {
                    Toast.error((err.data && err.data.error && err.data.error.message) || '保存失败');
                });
            });
        }

        // Export
        var exportBtn = document.getElementById('export-excel');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                self.ctx.api.post('/export', { export_type: 'transaction_history' }).then(function(res) {
                    if (res && res.success) {
                        Toast.success('导出任务已创建，请稍候下载');
                    }
                }).catch(function() {
                    Toast.error('导出失败');
                });
            });
        }

        // Monthly report
        var reportBtn = document.getElementById('send-monthly-report');
        if (reportBtn) {
            reportBtn.addEventListener('click', function() {
                self.ctx.api.get('/reports/monthly').then(function(res) {
                    if (res && res.success) {
                        Toast.success('月度报告已生成并发送到您的邮箱');
                    }
                }).catch(function() {
                    Toast.error('生成失败');
                });
            });
        }
    };

    return SettingsPage;
})();

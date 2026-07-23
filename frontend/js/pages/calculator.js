/**
 * Calculator page - Two versions: conservative 10-bank + custom 宁波银行.
 */
var CalculatorPage = (function() {
    function CalculatorPage(ctx) {
        this.ctx = ctx;
        this.usdRate = 3.44;
        this.rmbRate = 1.4;
        this.customRate = '';
    }

    CalculatorPage.prototype.render = function() {
        var c = document.getElementById('app-content');
        if (!c) return;
        c.innerHTML = '<div id="calc-container"><div class="text-center py-xl text-muted">加载中...</div></div>';
        this._loadData();
    };

    CalculatorPage.prototype.destroy = function() {};

    CalculatorPage.prototype._loadData = function() {
        var self = this;
        if (!this.ctx.state.isAuthenticated()) {
            document.getElementById('calc-container').innerHTML =
                '<div class="empty-state"><div class="empty-state-icon">🔒</div><div class="empty-state-title">请先登录</div></div>';
            return;
        }
        var url = '/calculator/auto?rmb_rate=' + this.rmbRate + '&usd_rate=' + this.usdRate;
        if (this.customRate) url += '&custom_jiehui=' + this.customRate;

        this.ctx.api.get(url).then(function(res) {
            if (res && res.success && res.data) self._render(res.data);
        }).catch(function() {
            document.getElementById('calc-container').innerHTML =
                '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">加载失败</div></div>';
        });
    };

    CalculatorPage.prototype._refresh = function() {
        var self = this;
        var url = '/calculator/auto?rmb_rate=' + this.rmbRate + '&usd_rate=' + this.usdRate;
        if (this.customRate) url += '&custom_jiehui=' + this.customRate;
        this.ctx.api.get(url).then(function(res) {
            if (res && res.success && res.data) self._render(res.data);
        });
    };

    CalculatorPage.prototype._render = function(data) {
        var c = document.getElementById('calc-container');
        if (!c) return;
        if (!data.has_data) {
            c.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-title">暂无购汇记录</div><a href="#/records" class="btn btn-primary mt-md">前往添加记录</a></div>';
            return;
        }

        var html = '';

        // Parameters
        html += '<div class="calc-section">' +
            '<h2 class="page-section-title">📊 对比参数</h2>' +
            '<div class="flex items-center gap-lg flex-wrap">' +
                '<div class="form-group" style="margin-bottom:0"><label class="form-label">美元理财年化 (%)</label><input type="number" step="0.01" class="form-input" id="calc-usd-rate" value="' + data.usd_rate_pct + '" style="width:100px"></div>' +
                '<div class="form-group" style="margin-bottom:0"><label class="form-label">人民币理财年化 (%)</label><input type="number" step="0.01" class="form-input" id="calc-rmb-rate" value="' + data.rmb_rate_pct + '" style="width:100px"></div>' +
            '</div>' +
            // Custom 结汇价
            '<div class="flex items-center gap-lg flex-wrap mt-md" style="align-items:flex-end">' +
                '<div class="form-group" style="margin-bottom:0"><label class="form-label">自定义结汇价（如宁波银行）</label><div class="flex gap-sm items-center"><input type="number" step="0.0001" class="form-input" id="calc-custom-rate" value="' + (this.customRate || '') + '" placeholder="输入后点确认" style="width:150px">' +
                '<button id="calc-apply-custom" class="btn btn-sm btn-primary">确认</button>' +
                (this.customRate ? '<button id="calc-clear-custom" class="btn btn-sm btn-outline">清除</button>' : '') + '</div></div>' +
            '</div>' +
        '</div>';

        // Render each version
        html += this._renderVersion(data.version_a, '🛡️ 保守版（10行结汇最低）');

        if (data.version_b) {
            html += this._renderVersion(data.version_b, '🏦 自定义结汇价');
        }

        c.innerHTML = html;
        this._bindEvents();
    };

    CalculatorPage.prototype._renderVersion = function(v, title) {
        var txns = v.transactions || [];
        var diffCls = v.diff_vs_rmb >= 0 ? 'color:#c5221f' : 'color:#137333';
        var diffSign = v.diff_vs_rmb >= 0 ? '+' : '';

        var h = '<div class="page-section mt-lg">' +
            '<h2 class="page-section-title">' + title + ' — 结汇 ¥' + Utils.formatCurrency(v.jiehui_rate, 4) +
                ' <span class="text-xs text-muted">(' + v.jiehui_source + ')</span></h2>';

        // Big result
        h += '<div style="text-align:center;padding:var(--space-lg);background:var(--color-surface);border-radius:var(--radius-md);margin-bottom:var(--space-lg)">' +
            '<div class="text-sm text-muted mb-sm">美元理财 vs 人民币理财</div>' +
            '<div style="font-size:2.2rem;font-weight:700;' + diffCls + '">' + diffSign + '¥' + Utils.formatCurrency(Math.abs(v.diff_vs_rmb)) + '</div>' +
            '<div class="text-sm text-muted">' + v.diff_label + '</div>' +
        '</div>';

        // Summary
        h += '<div class="card-grid mb-md">' +
            '<div class="card"><div class="text-xs text-muted">🇺🇸 美元理财净得</div><div class="fw-700 text-lg">¥' + Utils.formatCurrency(v.total_net) + '</div><div class="text-xs">利息¥' + Utils.formatCurrency(v.total_usd_interest_cny) + ' + 汇兑¥' + Utils.formatCurrency(v.total_exchange_pnl) + '</div></div>' +
            '<div class="card"><div class="text-xs text-muted">🇨🇳 人民币理财净得</div><div class="fw-700 text-lg">¥' + Utils.formatCurrency(v.total_rmb_interest) + '</div><div class="text-xs">无汇率风险</div></div>' +
            '<div class="card"><div class="text-xs text-muted">💵 ' + Utils.formatForeign(v.total_usd, 'USD') + ' 市值</div><div class="fw-700 text-lg">¥' + Utils.formatCurrency(v.current_market_cny) + '</div><div class="text-xs">浮动 ' + (v.floating_pnl >= 0 ? '+' : '') + '¥' + Utils.formatCurrency(v.floating_pnl) + '</div></div>' +
        '</div>';

        // Per-transaction table
        h += '<div class="table-responsive">' +
            '<table class="calc-scenario-table"><thead><tr>' +
                '<th>日期</th><th>$金额</th><th>成本¥</th><th>天数</th><th>利息$</th><th>利息¥</th><th>汇兑¥</th><th>净结果¥</th><th>RMB理财¥</th>' +
            '</tr></thead><tbody>';

        for (var i = 0; i < txns.length; i++) {
            var t = txns[i];
            var nc = t.net_result >= 0 ? 'scenario-profit' : 'scenario-loss';
            var ns = t.net_result >= 0 ? '+' : '';
            var ec = t.exchange_pnl >= 0 ? 'scenario-profit' : 'scenario-loss';
            var es = t.exchange_pnl >= 0 ? '+' : '';
            h += '<tr>' +
                '<td>' + t.date + '</td><td>$' + Utils.formatCurrency(t.usd_amount) + '</td><td>¥' + Utils.formatCurrency(t.cny_cost) + '</td><td>' + t.days + '</td>' +
                '<td>$' + Utils.formatCurrency(t.usd_interest, 4) + '</td><td>¥' + Utils.formatCurrency(t.usd_interest_cny, 2) + '</td>' +
                '<td class="' + ec + '">' + es + '¥' + Utils.formatCurrency(Math.abs(t.exchange_pnl)) + '</td>' +
                '<td class="' + nc + ' fw-600">' + ns + '¥' + Utils.formatCurrency(Math.abs(t.net_result)) + '</td>' +
                '<td>¥' + Utils.formatCurrency(t.rmb_interest, 2) + '</td></tr>';
        }

        // Total row
        var tnc = v.total_net >= 0 ? 'scenario-profit' : 'scenario-loss';
        var tns = v.total_net >= 0 ? '+' : '';
        var tec = v.total_exchange_pnl >= 0 ? 'scenario-profit' : 'scenario-loss';
        var tes = v.total_exchange_pnl >= 0 ? '+' : '';
        h += '<tr style="border-top:2px solid var(--color-text);font-weight:700">' +
            '<td colspan="2">合计</td><td>¥' + Utils.formatCurrency(v.total_cny_cost) + '</td><td></td>' +
            '<td>$' + Utils.formatCurrency(v.total_usd_interest, 4) + '</td><td>¥' + Utils.formatCurrency(v.total_usd_interest_cny, 2) + '</td>' +
            '<td class="' + tec + '">' + tes + '¥' + Utils.formatCurrency(Math.abs(v.total_exchange_pnl)) + '</td>' +
            '<td class="' + tnc + '">' + tns + '¥' + Utils.formatCurrency(Math.abs(v.total_net)) + '</td>' +
            '<td>¥' + Utils.formatCurrency(v.total_rmb_interest, 2) + '</td></tr>';

        h += '</tbody></table></div>';
        return h;
    };

    CalculatorPage.prototype._bindEvents = function() {
        var self = this;
        var usdEl = document.getElementById('calc-usd-rate');
        var rmbEl = document.getElementById('calc-rmb-rate');
        var customEl = document.getElementById('calc-custom-rate');
        var applyBtn = document.getElementById('calc-apply-custom');
        var clearBtn = document.getElementById('calc-clear-custom');

        var refreshParams = Utils.debounce(function() {
            self.usdRate = parseFloat(usdEl.value) || 3.44;
            self.rmbRate = parseFloat(rmbEl.value) || 1.4;
            self._refresh();
        }, 600);

        if (usdEl) usdEl.addEventListener('input', refreshParams);
        if (rmbEl) rmbEl.addEventListener('input', refreshParams);

        if (applyBtn) applyBtn.addEventListener('click', function() {
            var val = customEl.value.trim();
            if (!val) { Toast.warning('请输入结汇价'); return; }
            var rate = parseFloat(val);
            if (isNaN(rate) || rate <= 0) { Toast.warning('请输入有效的结汇价'); return; }
            self.customRate = rate;
            self._refresh();
        });

        if (customEl) customEl.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') applyBtn.click();
        });

        if (clearBtn) clearBtn.addEventListener('click', function() {
            customEl.value = '';
            self.customRate = '';
            self._refresh();
        });
    };

    return CalculatorPage;
})();

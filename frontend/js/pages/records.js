/**
 * Records page - Transaction management with quota tracking.
 */
var RecordsPage = (function() {
    function RecordsPage(ctx) {
        this.ctx = ctx;
        this.queryParams = {};
        this.activeTab = 'purchase';
        this.currencies = [];
        this.records = [];
    }

    RecordsPage.prototype.render = function() {
        var container = document.getElementById('app-content');
        if (!container) return;

        container.innerHTML =
            '<div class="page-section quota-section">' +
                '<h2 class="page-section-title">年度额度追踪</h2>' +
                '<div id="quota-container" class="quota-cards">' +
                    '<div class="skeleton skeleton-card"></div>' +
                    '<div class="skeleton skeleton-card"></div>' +
                '</div>' +
            '</div>' +

            '<div class="page-section">' +
                '<h2 class="page-section-title">持仓概览</h2>' +
                '<div class="table-responsive">' +
                    '<table id="position-table" class="position-table">' +
                        '<thead><tr>' +
                            '<th>币种</th><th>持仓余额</th><th>加权成本</th><th>当前牌价</th><th>浮动盈亏</th>' +
                        '</tr></thead>' +
                        '<tbody id="position-tbody">' +
                            '<tr><td colspan="5" class="text-center text-muted">加载中...</td></tr>' +
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>' +

            '<div class="page-section">' +
                '<div class="tabs">' +
                    '<button class="tab-item active" data-tab="purchase">购汇记录</button>' +
                    '<button class="tab-item" data-tab="redemption">赎回记录</button>' +
                '</div>' +
                '<div id="records-list" class="mt-lg"></div>' +
            '</div>' +

            '<button id="records-fab" class="fab" title="新增记录">+</button>';

        this._loadData();
        this._bindEvents();
    };

    RecordsPage.prototype.destroy = function() {};

    RecordsPage.prototype._loadData = function() {
        var self = this;
        var api = this.ctx.api;

        if (!this.ctx.state.isAuthenticated()) {
            this._showAuthRequired();
            return;
        }

        // Load currencies
        api.get('/currencies').then(function(res) {
            if (res && res.success) {
                self.currencies = res.data || [];
            }
        }).catch(function() {});

        // Load quota
        var year = new Date().getFullYear();
        api.get('/portfolio/quota?year=' + year).then(function(res) {
            if (res && res.success && res.data) {
                self._renderQuota(res.data);
            }
        }).catch(function() {});

        // Load portfolio
        api.get('/portfolio/summary').then(function(res) {
            if (res && res.success && res.data) {
                self._renderPosition(res.data.holdings || []);
            }
        }).catch(function() {});

        // Load records for active tab
        this._loadRecords();
    };

    RecordsPage.prototype._loadRecords = function() {
        var self = this;
        var api = this.ctx.api;
        var endpoint = this.activeTab === 'purchase' ? '/transactions/purchase' : '/transactions/redemption';

        api.get(endpoint).then(function(res) {
            if (res && res.success) {
                self.records = Array.isArray(res.data) ? res.data : ((res.data && res.data.items) ? res.data.items : []);
                self._renderRecords();
            }
        }).catch(function() {});
    };

    RecordsPage.prototype._renderQuota = function(data) {
        var container = document.getElementById('quota-container');
        if (!container) return;

        var total = data.total_usd_equivalent || {};
        var purchasePct = total.purchase_pct || 0;
        var redemptionPct = total.redemption_pct || 0;

        container.innerHTML =
            '<div class="quota-card">' +
                '<div class="quota-card-label">年度购汇额度</div>' +
                '<div class="quota-card-value">$' + Utils.formatCurrency(total.purchase_used || 0) + '</div>' +
                '<div class="quota-card-meta">剩余: $' + Utils.formatCurrency((50000 - (total.purchase_used || 0))) + '</div>' +
                '<div class="quota-progress">' +
                    '<div class="progress-bar"><div class="progress-fill ' + (purchasePct > 80 ? 'danger' : purchasePct > 50 ? 'warning' : 'success') + '" style="width:' + Math.min(purchasePct, 100) + '%"></div></div>' +
                    '<div class="text-xs text-muted mt-sm">' + Utils.formatPercent(purchasePct, 1) + ' 已使用</div>' +
                '</div>' +
            '</div>' +
            '<div class="quota-card">' +
                '<div class="quota-card-label">年度结汇额度</div>' +
                '<div class="quota-card-value">$' + Utils.formatCurrency(total.redemption_used || 0) + '</div>' +
                '<div class="quota-card-meta">剩余: $' + Utils.formatCurrency((50000 - (total.redemption_used || 0))) + '</div>' +
                '<div class="quota-progress">' +
                    '<div class="progress-bar"><div class="progress-fill ' + (redemptionPct > 80 ? 'danger' : redemptionPct > 50 ? 'warning' : 'success') + '" style="width:' + Math.min(redemptionPct, 100) + '%"></div></div>' +
                    '<div class="text-xs text-muted mt-sm">' + Utils.formatPercent(redemptionPct, 1) + ' 已使用</div>' +
                '</div>' +
            '</div>';
    };

    RecordsPage.prototype._renderPosition = function(holdings) {
        var tbody = document.getElementById('position-tbody');
        if (!tbody) return;

        if (!holdings || !holdings.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">暂无持仓</td></tr>';
            return;
        }

        tbody.innerHTML = holdings.map(function(h) {
            var pnl = h.floating_pnl || 0;
            var pnlInfo = Utils.pnlClass(pnl);
            var pnlBg = pnl >= 0 ? 'background:#fce8e6;' : 'background:#e6f4ea;';
            var pnlClr = pnl >= 0 ? 'color:#c5221f;' : 'color:#137333;';
            return '<tr>' +
                '<td class="fw-600">' + Utils.escapeHtml(h.currency_code) + '</td>' +
                '<td>' + Utils.formatForeign(h.holding_amount, h.currency_code) + '</td>' +
                '<td>¥' + Utils.formatCurrency(h.avg_cost, 4) + '</td>' +
                '<td>¥' + Utils.formatCurrency(h.current_rate, 4) + '</td>' +
                '<td style="' + pnlBg + pnlClr + 'font-weight:700;font-size:1.05rem;padding:6px 12px;border-radius:6px">' + (pnl >= 0 ? '+' : '') + '¥' + Utils.formatCurrency(Math.abs(pnl)) + '</td>' +
            '</tr>';
        }).join('');
    };

    RecordsPage.prototype._renderRecords = function() {
        var container = document.getElementById('records-list');
        if (!container) return;

        if (!this.records.length) {
            container.innerHTML = '<div class="empty-state">' +
                '<div class="empty-state-icon">📝</div>' +
                '<div class="empty-state-title">暂无' + (this.activeTab === 'purchase' ? '购汇' : '赎回') + '记录</div>' +
                '<div class="empty-state-text">点击下方 + 按钮添加第一条记录</div>' +
            '</div>';
            return;
        }

        var self = this;
        container.innerHTML = this.records.map(function(r) {
            return '<div class="txn-list-item">' +
                '<div class="txn-info">' +
                    '<div class="txn-currency">' + Utils.escapeHtml(r.currency_code || '') + '</div>' +
                    '<div class="txn-date">' + Utils.formatDate(r.transaction_date, 'full') +
                        (r.fund_name ? ' · ' + Utils.escapeHtml(r.fund_name) : '') + '</div>' +
                '</div>' +
                '<div class="txn-amount">' +
                    '<div class="txn-amount-foreign">' + Utils.formatForeign(r.amount_foreign, r.currency_code) + '</div>' +
                    '<div class="txn-amount-cny">¥' + Utils.formatCurrency(r.amount_cny) + '</div>' +
                '</div>' +
                '<div class="txn-rate">@ ' + Utils.formatCurrency(r.exchange_rate, 4) + '</div>' +
                '<div class="txn-actions">' +
                    '<button class="btn btn-sm btn-outline txn-edit" data-id="' + r.id + '">编辑</button>' +
                    '<button class="btn btn-sm btn-danger txn-delete" data-id="' + r.id + '">删除</button>' +
                '</div>' +
            '</div>';
        }).join('');

        // Bind record actions
        container.querySelectorAll('.txn-edit').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.getAttribute('data-id'), 10);
                var record = self.records.find(function(r) { return r.id === id; });
                if (record) self._openForm(record);
            });
        });

        container.querySelectorAll('.txn-delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.getAttribute('data-id'), 10);
                self._deleteRecord(id);
            });
        });
    };

    RecordsPage.prototype._openForm = function(data) {
        var self = this;
        TransactionForm.open({
            mode: this.activeTab,
            data: data || {},
            currencies: this.currencies,
            onSave: function(formData) {
                var api = self.ctx.api;
                var base = self.activeTab === 'purchase' ? '/transactions/purchase' : '/transactions/redemption';
                // Strip internal fields before sending to API
                var payload = {
                    currency_id: formData.currency_id,
                    amount_foreign: formData.amount_foreign,
                    amount_cny: formData.amount_cny,
                    exchange_rate: formData.exchange_rate,
                    transaction_date: formData.transaction_date,
                    fund_name: formData.fund_name || '',
                    fund_code: '',
                    notes: formData.notes || '',
                };
                var req;
                if (formData.id) {
                    req = api.put(base + '/' + formData.id, payload);
                } else {
                    req = api.post(base, payload);
                }
                req.then(function(res) {
                    if (res && res.success) {
                        Toast.success('保存成功');
                        self._loadData();
                    }
                }).catch(function(err) {
                    Toast.error((err.data && err.data.error && err.data.error.message) || '保存失败');
                });
            },
        });
    };

    RecordsPage.prototype._deleteRecord = function(id) {
        var self = this;
        Modal.confirm('确认删除', '确定要删除这条记录吗？此操作不可撤销。', { danger: true })
            .then(function(confirmed) {
                if (!confirmed) return;
                var base = self.activeTab === 'purchase' ? '/transactions/purchase' : '/transactions/redemption';
                self.ctx.api.delete(base + '/' + id).then(function(res) {
                    if (res && res.success) {
                        Toast.success('删除成功');
                        self._loadData();
                    }
                }).catch(function() {
                    Toast.error('删除失败');
                });
            });
    };

    RecordsPage.prototype._showAuthRequired = function() {
        var container = document.getElementById('quota-container');
        if (container) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔒</div><div class="empty-state-title">请先登录</div></div>';
        }
    };

    RecordsPage.prototype._bindEvents = function() {
        var self = this;

        // Tab switching
        document.querySelectorAll('.tab-item').forEach(function(tab) {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.tab-item').forEach(function(t) { t.classList.remove('active'); });
                this.classList.add('active');
                self.activeTab = this.getAttribute('data-tab');
                self._loadRecords();
            });
        });

        // FAB
        var fab = document.getElementById('records-fab');
        if (fab) {
            fab.addEventListener('click', function() {
                self._openForm(null);
            });
        }
    };

    return RecordsPage;
})();

/**
 * Reminders page - Filter, list, batch operations.
 */
var RemindersPage = (function() {
    function RemindersPage(ctx) {
        this.ctx = ctx;
        this.queryParams = {};
        this.filterType = '';
        this.filterRead = '';
        this.batchMode = false;
        this.reminders = [];
    }

    RemindersPage.prototype.render = function() {
        var container = document.getElementById('app-content');
        if (!container) return;

        container.innerHTML =
            '<div class="page-section">' +
                '<h2 class="page-section-title">提醒中心</h2>' +

                '<div class="reminders-filter">' +
                    '<select id="reminder-filter-type" class="form-select">' +
                        '<option value="">全部类型</option>' +
                        '<option value="cost_anchor">成本锚定</option>' +
                        '<option value="trend_tracking">趋势跟踪</option>' +
                        '<option value="macro_event">宏观事件</option>' +
                        '<option value="fund_validation">资金校验</option>' +
                    '</select>' +
                    '<select id="reminder-filter-read" class="form-select">' +
                        '<option value="">全部状态</option>' +
                        '<option value="0">未读</option>' +
                        '<option value="1">已读</option>' +
                    '</select>' +
                    '<button id="reminder-batch-toggle" class="btn btn-sm btn-outline">批量操作</button>' +
                '</div>' +
            '</div>' +

            '<div id="reminders-list-container"></div>' +

            '<div id="batch-toolbar" class="batch-toolbar">' +
                '<span class="batch-count" id="batch-count">已选 0 项</span>' +
                '<div class="flex gap-sm">' +
                    '<button id="batch-mark-read" class="btn btn-sm btn-primary">标记已读</button>' +
                    '<button id="batch-archive" class="btn btn-sm btn-outline">归档</button>' +
                    '<button id="batch-cancel" class="btn btn-sm btn-outline">取消</button>' +
                '</div>' +
            '</div>';

        this._loadData();
        this._bindEvents();
    };

    RemindersPage.prototype.destroy = function() {};

    RemindersPage.prototype._loadData = function() {
        var self = this;
        var api = this.ctx.api;

        if (!this.ctx.state.isAuthenticated()) {
            document.getElementById('reminders-list-container').innerHTML =
                '<div class="empty-state"><div class="empty-state-icon">🔒</div><div class="empty-state-title">请先登录</div></div>';
            return;
        }

        var params = [];
        if (this.filterType) params.push('type=' + this.filterType);
        if (this.filterRead !== '') params.push('is_read=' + this.filterRead);

        var path = '/reminders' + (params.length ? '?' + params.join('&') : '');

        api.get(path).then(function(res) {
            if (res && res.success && res.data) {
                self.reminders = Array.isArray(res.data) ? res.data : (res.data && res.data.items ? res.data.items : []);
                ReminderCard.renderList(
                    document.getElementById('reminders-list-container'),
                    self.reminders,
                    self.batchMode
                );
                if (self.batchMode) self._updateBatchCount();
            }
        }).catch(function() {
            Toast.error('加载提醒失败');
        });
    };

    RemindersPage.prototype._bindEvents = function() {
        var self = this;

        // Filter changes
        var typeFilter = document.getElementById('reminder-filter-type');
        var readFilter = document.getElementById('reminder-filter-read');
        if (typeFilter) {
            typeFilter.addEventListener('change', function() {
                self.filterType = this.value;
                self._loadData();
            });
        }
        if (readFilter) {
            readFilter.addEventListener('change', function() {
                self.filterRead = this.value;
                self._loadData();
            });
        }

        // Batch toggle
        var batchToggle = document.getElementById('reminder-batch-toggle');
        if (batchToggle) {
            batchToggle.addEventListener('click', function() {
                self.batchMode = !self.batchMode;
                var container = document.getElementById('reminders-list-container');
                var toolbar = document.getElementById('batch-toolbar');
                if (container) {
                    if (self.batchMode) {
                        container.classList.add('batch-mode');
                    } else {
                        container.classList.remove('batch-mode');
                    }
                }
                if (toolbar) {
                    toolbar.classList.toggle('visible', self.batchMode);
                }
                batchToggle.textContent = self.batchMode ? '退出批量' : '批量操作';
                self._loadData();
            });
        }

        // Batch actions
        var batchMarkRead = document.getElementById('batch-mark-read');
        var batchArchive = document.getElementById('batch-archive');
        var batchCancel = document.getElementById('batch-cancel');

        if (batchMarkRead) {
            batchMarkRead.addEventListener('click', function() {
                var ids = self._getSelectedIds();
                if (!ids.length) { Toast.warning('请选择提醒'); return; }
                self.ctx.api.put('/reminders/batch', { ids: ids }).then(function(res) {
                    if (res && res.success) {
                        Toast.success('已标记为已读');
                        self._loadData();
                    }
                }).catch(function() { Toast.error('操作失败'); });
            });
        }

        if (batchArchive) {
            batchArchive.addEventListener('click', function() {
                var ids = self._getSelectedIds();
                if (!ids.length) { Toast.warning('请选择提醒'); return; }
                // Archive via individual API calls
                Promise.all(ids.map(function(id) {
                    return self.ctx.api.put('/reminders/' + id + '/action', { action: 'archived' });
                })).then(function() {
                    Toast.success('已归档');
                    self._loadData();
                }).catch(function() { Toast.error('操作失败'); });
            });
        }

        if (batchCancel) {
            batchCancel.addEventListener('click', function() {
                self.batchMode = false;
                var container = document.getElementById('reminders-list-container');
                var toolbar = document.getElementById('batch-toolbar');
                if (container) container.classList.remove('batch-mode');
                if (toolbar) toolbar.classList.remove('visible');
                var bt = document.getElementById('reminder-batch-toggle');
                if (bt) bt.textContent = '批量操作';
                self._loadData();
            });
        }

        // Delegate event listeners for reminder card actions
        var listContainer = document.getElementById('reminders-list-container');
        if (listContainer) {
            listContainer.addEventListener('click', function(e) {
                var target = e.target;

                // 3-button actions: 已执行 / 忽略 / 稍后提醒
                if (target.classList.contains('reminder-action')) {
                    var id = target.getAttribute('data-id');
                    var action = target.getAttribute('data-action');
                    var labels = { 'executed': '已执行', 'ignored': '已忽略', 'snoozed': '已推迟' };
                    self.ctx.api.put('/reminders/' + id + '/action', { action: action }).then(function() {
                        Toast.success(labels[action] || '操作成功');
                        self._loadData();
                    }).catch(function() { Toast.error('操作失败'); });
                }

                // Checkbox selection
                if (target.classList.contains('reminder-select')) {
                    self._updateBatchCount();
                }
            });
        }
    };

    RemindersPage.prototype._getSelectedIds = function() {
        var checkboxes = document.querySelectorAll('.reminder-select:checked');
        var ids = [];
        for (var i = 0; i < checkboxes.length; i++) {
            ids.push(parseInt(checkboxes[i].value, 10));
        }
        return ids;
    };

    RemindersPage.prototype._updateBatchCount = function() {
        var count = document.getElementById('batch-count');
        if (count) {
            var n = this._getSelectedIds().length;
            count.textContent = '已选 ' + n + ' 项';
        }
    };

    return RemindersPage;
})();

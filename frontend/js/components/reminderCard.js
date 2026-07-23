/**
 * Reminder card component with rich content and 3 action buttons.
 */
var ReminderCard = (function() {
    var TYPE_LABELS = {
        'cost_anchor': '成本锚定',
        'trend_tracking': '趋势跟踪',
        'macro_event': '宏观事件',
        'fund_validation': '资金校验',
    };

    function render(r, showCheckbox) {
        var typeLabel = TYPE_LABELS[r.reminder_type] || r.reminder_type;
        var time = Utils.formatRelativeTime(r.created_at);
        var unreadClass = r.is_read ? '' : ' unread';
        var actionTaken = r.action_taken || '';

        // Parse rich message into sections
        var msgParts = (r.message || '').split(' | ');
        var msgHtml = '';
        for (var i = 0; i < msgParts.length; i++) {
            var part = msgParts[i];
            var cls = '';
            if (part.indexOf('建议') === 0) cls = 'fw-600';
            msgHtml += '<div class="' + cls + '">' + Utils.escapeHtml(part) + '</div>';
        }

        // Determine action button states
        var actionHtml = '';
        if (!actionTaken) {
            actionHtml =
                '<button class="btn btn-sm btn-success reminder-action" data-id="' + r.id + '" data-action="executed">已执行</button>' +
                '<button class="btn btn-sm btn-outline reminder-action" data-id="' + r.id + '" data-action="ignored">忽略</button>' +
                '<button class="btn btn-sm btn-outline reminder-action" data-id="' + r.id + '" data-action="snoozed">稍后提醒</button>';
        } else {
            var actionLabel = actionTaken === 'executed' ? '已执行' : actionTaken === 'ignored' ? '已忽略' : '已推迟';
            var actionCls = actionTaken === 'executed' ? 'badge-success' : actionTaken === 'ignored' ? 'badge-warning' : 'badge-primary';
            actionHtml = '<span class="badge ' + actionCls + '">' + actionLabel + '</span>';
        }

        return '<div class="reminder-card type-' + r.reminder_type + unreadClass + '" data-id="' + r.id + '">' +
            (showCheckbox ? '<div class="reminder-checkbox"><input type="checkbox" class="reminder-select" value="' + r.id + '"></div>' : '') +
            '<div class="reminder-card-header">' +
                '<h3 class="reminder-card-title">' + Utils.escapeHtml(r.title) + '</h3>' +
                '<span class="reminder-card-type">' + typeLabel + '</span>' +
            '</div>' +
            '<div class="reminder-card-message">' + msgHtml + '</div>' +
            '<div class="reminder-card-meta">' +
                '<span class="reminder-card-time">' + time + '</span>' +
                '<div class="reminder-card-actions">' + actionHtml + '</div>' +
            '</div>' +
        '</div>';
    }

    function renderList(container, reminders, showCheckbox) {
        if (!container) return;
        if (!reminders || !reminders.length) {
            container.innerHTML = '<div class="empty-state">' +
                '<div class="empty-state-icon">🔔</div>' +
                '<div class="empty-state-title">暂无提醒</div>' +
                '<div class="empty-state-text">当汇率触发您设置的条件时自动生成</div>' +
            '</div>';
            return;
        }
        container.innerHTML = reminders.map(function(r) {
            return render(r, showCheckbox);
        }).join('');
    }

    return {
        render: render,
        renderList: renderList,
        TYPE_LABELS: TYPE_LABELS,
    };
})();

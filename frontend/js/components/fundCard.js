/**
 * Fund/Position card component for dashboard.
 */
var FundCard = (function() {
    /**
     * Render a fund card HTML string.
     * @param {Object} fund - { currency_code, holding_amount, avg_cost, current_rate, floating_pnl, floating_pnl_pct }
     * @returns {string}
     */
    function render(fund) {
        if (!fund) return '';
        var pnl = fund.floating_pnl || 0;
        var pnlInfo = Utils.pnlClass(pnl);
        var symbol = Utils.getCurrencySymbol(fund.currency_code);

        return '<div class="fund-card">' +
            '<div class="fund-card-currency">' +
                '<span class="fund-card-code">' + Utils.escapeHtml(fund.currency_code) + '</span>' +
            '</div>' +
            '<div class="fund-card-holding">' + Utils.formatForeign(fund.holding_amount, fund.currency_code) + '</div>' +
            '<div class="fund-card-cost">成本: ¥' + Utils.formatCurrency(fund.avg_cost, 4) + '</div>' +
            '<div class="fund-card-pnl">' +
                '<div>' +
                    '<div class="fund-card-pnl-label">浮动盈亏</div>' +
                    '<div class="fund-card-pnl-value ' + pnlInfo.cls + '">' +
                        pnlInfo.sign + '¥' + Utils.formatCurrency(Math.abs(pnl)) +
                    '</div>' +
                '</div>' +
                '<div class="text-right">' +
                    '<div class="fund-card-pnl-label">当前牌价</div>' +
                    '<div class="fund-card-pnl-value">¥' + Utils.formatCurrency(fund.current_rate, 4) + '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    /**
     * Render an array of fund cards into a container.
     * @param {HTMLElement} container
     * @param {Array} funds
     */
    function renderList(container, funds) {
        if (!container) return;
        if (!funds || !funds.length) {
            container.innerHTML = '<div class="empty-state">' +
                '<div class="empty-state-icon">📊</div>' +
                '<div class="empty-state-title">暂无持仓</div>' +
                '<div class="empty-state-text">添加购汇记录后，这里将显示您的持仓概览</div>' +
            '</div>';
            return;
        }
        container.innerHTML = funds.map(function(f) { return render(f); }).join('');
    }

    return {
        render: render,
        renderList: renderList,
    };
})();

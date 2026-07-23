/**
 * Calculator input form with multi-transaction support.
 */
var CalculatorForm = (function() {
    /**
     * Render the calculator input form.
     * @param {HTMLElement} container
     * @param {Object} ctx - App context
     */
    function render(container, ctx) {
        container.innerHTML =
            '<div class="calc-section">' +
                '<h2 class="page-section-title">交易输入</h2>' +
                '<div id="calc-txn-list">' +
                    '<div class="calc-txn-row" data-index="0">' +
                        '<div class="form-group">' +
                            '<label class="form-label">外币金额</label>' +
                            '<input type="number" step="0.01" class="form-input calc-amount" placeholder="0.00">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label class="form-label">购汇汇率</label>' +
                            '<input type="number" step="0.000001" class="form-input calc-rate" placeholder="0.000000">' +
                        '</div>' +
                        '<div class="form-group">' +
                            '<label class="form-label">标签（可选）</label>' +
                            '<input type="text" class="form-input calc-label" placeholder="如: 首次购汇">' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div id="calc-multi-area" class="calc-multi-txns"></div>' +
                '<button id="calc-toggle-multi" class="calc-add-btn mt-sm">' +
                    '<span class="arrow"></span> 多笔购汇/赎回' +
                '</button>' +
            '</div>' +

            '<div class="calc-section">' +
                '<h2 class="page-section-title">场景参数</h2>' +
                '<div class="form-row">' +
                    '<div class="form-group">' +
                        '<label class="form-label">理财收益率（%）</label>' +
                        '<input type="number" step="0.01" class="form-input" id="calc-finance-rate" placeholder="如: 4.5">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label class="form-label">持有天数</label>' +
                        '<input type="number" class="form-input" id="calc-hold-days" placeholder="如: 90">' +
                    '</div>' +
                '</div>' +
                '<div class="form-row">' +
                    '<div class="form-group">' +
                        '<label class="form-label">高位结汇汇率（可选）</label>' +
                        '<input type="number" step="0.000001" class="form-input" id="calc-high-rate" placeholder="如: 7.35">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label class="form-label">低位结汇汇率（可选）</label>' +
                        '<input type="number" step="0.000001" class="form-input" id="calc-low-rate" placeholder="如: 7.15">' +
                    '</div>' +
                '</div>' +
                '<div class="form-row">' +
                    '<div class="form-group">' +
                        '<label class="form-label">人民币理财收益率（%）（可选）</label>' +
                        '<input type="number" step="0.01" class="form-input" id="calc-cny-finance-rate" placeholder="如: 1.5">' +
                    '</div>' +
                '</div>' +
                '<button id="calc-submit" class="btn btn-primary btn-block mt-md">计算收益</button>' +
            '</div>' +

            '<div id="calc-results" style="display:none;"></div>';
    }

    /**
     * Get all transaction data from the form.
     * @returns {Array}
     */
    function getTransactions() {
        var rows = document.querySelectorAll('.calc-txn-row');
        var txns = [];
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var amt = parseFloat(row.querySelector('.calc-amount').value);
            var rate = parseFloat(row.querySelector('.calc-rate').value);
            if (!isNaN(amt) && !isNaN(rate) && amt > 0 && rate > 0) {
                var label = row.querySelector('.calc-label');
                txns.push({
                    amount_foreign: amt,
                    exchange_rate: rate,
                    label: label ? label.value : '',
                });
            }
        }
        return txns;
    }

    return {
        render: render,
        getTransactions: getTransactions,
    };
})();

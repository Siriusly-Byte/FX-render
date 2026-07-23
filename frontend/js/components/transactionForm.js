/**
 * Transaction form component (modal-based for create/edit purchase/redemption).
 */
var TransactionForm = (function() {
    function open(opts) {
        opts = opts || {};
        var mode = opts.mode || 'purchase';
        var data = opts.data || {};
        var currencies = opts.currencies || [];
        var onSave = opts.onSave || function() {};
        var modeLabel = mode === 'purchase' ? '购汇' : '赎回';
        var title = (data.id ? '编辑' : '新增') + modeLabel + '记录';

        // Build currency options
        var currencyOptions = currencies.map(function(c) {
            var sel = (data.currency_id === c.id) ? ' selected' : '';
            return '<option value="' + c.id + '"' + sel + '>' +
                Utils.escapeHtml(c.code) + ' - ' + Utils.escapeHtml(c.name) + '</option>';
        }).join('');

        // Build form HTML with unique ID to avoid conflicts
        var formId = 'txn-form-' + Utils.uid();

        var formHtml = '<form id="' + formId + '" class="mt-md">' +
            '<div class="form-row">' +
                '<div class="form-group">' +
                    '<label class="form-label">币种</label>' +
                    '<select class="form-select txn-ccy" required>' +
                        '<option value="">选择币种</option>' + currencyOptions +
                    '</select>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label class="form-label">交易日期</label>' +
                    '<input type="date" class="form-input txn-date" value="' + (data.transaction_date || new Date().toISOString().split('T')[0]) + '" required>' +
                '</div>' +
            '</div>' +
            '<div class="form-row">' +
                '<div class="form-group">' +
                    '<label class="form-label">外币金额</label>' +
                    '<input type="number" step="0.01" class="form-input txn-foreign" value="' + (data.amount_foreign || '') + '" placeholder="0.00" required>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label class="form-label">汇率</label>' +
                    '<input type="number" step="0.000001" class="form-input txn-rate" value="' + (data.exchange_rate || '') + '" placeholder="0.000000" required>' +
                '</div>' +
            '</div>' +
            '<div class="form-row">' +
                '<div class="form-group">' +
                    '<label class="form-label">人民币金额</label>' +
                    '<input type="text" class="form-input txn-cny" value="' + (data.amount_cny || '') + '" placeholder="输入外币和汇率后自动计算">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label class="form-label">基金/产品名称</label>' +
                    '<input type="text" class="form-input txn-fund" value="' + (data.fund_name || '') + '" placeholder="可选">' +
                '</div>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="form-label">备注</label>' +
                '<textarea class="form-textarea txn-notes" rows="2" placeholder="可选">' + (data.notes || '') + '</textarea>' +
            '</div>' +
        '</form>';

        // Read form values function (called before modal closes)
        function readForm() {
            var form = document.getElementById(formId);
            if (!form) return null;

            var foreign = parseFloat(form.querySelector('.txn-foreign').value) || 0;
            var rate = parseFloat(form.querySelector('.txn-rate').value) || 0;
            var cnyInput = form.querySelector('.txn-cny');
            var cny = parseFloat(cnyInput.value) || (foreign * rate);

            return {
                id: data.id || null,
                currency_id: parseInt(form.querySelector('.txn-ccy').value, 10) || 0,
                amount_foreign: foreign,
                amount_cny: parseFloat(cny.toFixed(2)),
                exchange_rate: rate,
                transaction_date: form.querySelector('.txn-date').value || '',
                fund_name: form.querySelector('.txn-fund').value || '',
                notes: form.querySelector('.txn-notes').value || '',
            };
        }

        // Validate before saving
        function validate(result) {
            if (!result.currency_id) { Toast.warning('请选择币种'); return false; }
            if (!result.amount_foreign || result.amount_foreign <= 0) { Toast.warning('请输入有效的外币金额'); return false; }
            if (!result.exchange_rate || result.exchange_rate <= 0) { Toast.warning('请输入有效的汇率'); return false; }
            if (!result.amount_cny || result.amount_cny <= 0) { Toast.warning('人民币金额无效'); return false; }
            if (!result.transaction_date) { Toast.warning('请选择交易日期'); return false; }
            return true;
        }

        Modal.show({
            title: title,
            body: formHtml,
            confirmText: '保存',
            onConfirm: function() {
                var result = readForm();
                if (!result || !validate(result)) return false;  // return false keeps modal open
                onSave(result);
            },
        });

        // Bind auto-calc after DOM is ready
        setTimeout(function() {
            var form = document.getElementById(formId);
            if (!form) return;
            var foreignEl = form.querySelector('.txn-foreign');
            var rateEl = form.querySelector('.txn-rate');
            var cnyEl = form.querySelector('.txn-cny');

            function recalc() {
                var f = parseFloat(foreignEl.value) || 0;
                var r = parseFloat(rateEl.value) || 0;
                cnyEl.value = (f * r).toFixed(2);
            }
            if (foreignEl) foreignEl.addEventListener('input', recalc);
            if (rateEl) rateEl.addEventListener('input', recalc);
        }, 150);
    }

    return { open: open };
})();

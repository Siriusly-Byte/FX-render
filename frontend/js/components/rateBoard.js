/**
 * Real-time exchange rate board with 10-bank comparison.
 */
var RateBoard = (function() {
    var refreshTimer = null;

    function render(container, rates, bankRates, lastUpdate) {
        if (!container || !rates) return;
        bankRates = bankRates || {};

        var timeStr = lastUpdate || (function() {
            var n = new Date();
            return n.getFullYear() + '-' +
                (n.getMonth()+1).toString().padStart(2,'0') + '-' +
                n.getDate().toString().padStart(2,'0') + ' ' +
                n.getHours().toString().padStart(2,'0') + ':' +
                n.getMinutes().toString().padStart(2,'0') + ':' +
                n.getSeconds().toString().padStart(2,'0');
        })();

        var html = '<div class="rate-board">' +
            '<div class="rate-board-header">' +
                '<span class="rate-board-title">实时牌价看板</span>' +
                '<span style="display:flex;align-items:center;gap:8px">' +
                    '<span class="rate-board-updated" id="rate-update-time">' + timeStr + '</span>' +
                    '<button id="rate-refresh-btn" class="btn btn-sm btn-primary" title="从外管局抓取最新中间价">🔄 刷新</button>' +
                '</span>' +
            '</div>' +
            '<div class="table-responsive">' +
                '<table class="rate-table">' +
                    '<thead><tr>' +
                        '<th>币种</th>' +
                        '<th>中间价</th>' +
                        '<th>购汇牌价</th>' +
                        '<th>结汇牌价</th>' +
                    '</tr></thead>' +
                    '<tbody>';

        for (var i = 0; i < rates.length; i++) {
            var r = rates[i];
            var br = bankRates[r.code] || {};

            // 购汇牌价 = 银行汇卖价: show 最高(最贵) and 最低(最便宜)
            var buyHtml = '--';
            if (br['购汇最优'] && br['购汇最差']) {
                buyHtml =
                    '<div><span class="text-success fw-600">¥' + Utils.formatCurrency(br['购汇最优'].rate, 4) + '</span>' +
                    '<span class="text-xs text-muted ml-sm">' + Utils.escapeHtml(br['购汇最优'].bank) + '</span></div>' +
                    '<div><span class="text-danger fw-600">¥' + Utils.formatCurrency(br['购汇最差'].rate, 4) + '</span>' +
                    '<span class="text-xs text-muted ml-sm">' + Utils.escapeHtml(br['购汇最差'].bank) + '</span></div>';
            }

            // 结汇牌价 = 银行汇买价: show 最高(最优) and 最低(最差)
            var sellHtml = '--';
            if (br['结汇最优'] && br['结汇最差']) {
                sellHtml =
                    '<div><span class="text-danger fw-600">¥' + Utils.formatCurrency(br['结汇最优'].rate, 4) + '</span>' +
                    '<span class="text-xs text-muted ml-sm">' + Utils.escapeHtml(br['结汇最优'].bank) + '</span></div>' +
                    '<div><span class="text-success fw-600">¥' + Utils.formatCurrency(br['结汇最差'].rate, 4) + '</span>' +
                    '<span class="text-xs text-muted ml-sm">' + Utils.escapeHtml(br['结汇最差'].bank) + '</span></div>';
            }

            html += '<tr>' +
                '<td><span class="rate-currency">' + Utils.escapeHtml(r.code) + '</span></td>' +
                '<td><span class="rate-value">¥' + Utils.formatCurrency(r.middle_rate, 4) + '</span>' +
                    '<div class="text-xs text-muted">外管局</div></td>' +
                '<td>' + buyHtml + '</td>' +
                '<td>' + sellHtml + '</td>' +
            '</tr>';
        }

        html += '</tbody></table></div></div>';
        container.innerHTML = html;
    }

    function startAutoRefresh(container, api, interval) {
        stopAutoRefresh();
        interval = interval || 30000;
        refreshTimer = setInterval(function() {
            // Reload bank rates
            api.get('/rates/banks').then(function(res) {
                if (res && res.success && res.data) {
                    // Update only the bank rate cells, re-render full board
                    api.get('/rates/current').then(function(rateRes) {
                        if (rateRes && rateRes.success) {
                            render(container, rateRes.data, res.data);
                        }
                    }).catch(function() {});
                }
            }).catch(function() {});
        }, interval);
    }

    function stopAutoRefresh() {
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
        }
    }

    return {
        render: render,
        startAutoRefresh: startAutoRefresh,
        stopAutoRefresh: stopAutoRefresh,
    };
})();

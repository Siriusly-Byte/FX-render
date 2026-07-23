/**
 * Rate trend chart component using Chart.js.
 */
var RateChart = (function() {
    var chartInstance = null;

    /**
     * Render a rate trend line chart.
     * @param {HTMLCanvasElement|string} canvas - Canvas element or its ID
     * @param {Array} data - [{ date: '2024-01-01', rate: 7.25 }, ...]
     * @param {string} currencyCode - e.g., 'USD'
     */
    function render(canvas, data, currencyCode) {
        if (typeof canvas === 'string') {
            canvas = document.getElementById(canvas);
        }
        if (!canvas || !data || !data.length) return;

        // Destroy previous chart
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        var labels = data.map(function(d) { return d.date || d.rate_date || ''; });
        var values = data.map(function(d) { return d.rate || d.middle_rate || 0; });

        chartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: (currencyCode || '') + '/CNY 中间价',
                    data: values,
                    borderColor: '#1a73e8',
                    backgroundColor: 'rgba(26, 115, 232, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    fill: true,
                    tension: 0.3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        displayColors: false,
                        callbacks: {
                            label: function(ctx) {
                                return '¥' + Utils.formatCurrency(ctx.parsed.y, 4);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            maxTicksLimit: 8,
                            font: { size: 11 }
                        }
                    },
                    y: {
                        grid: { color: '#f1f3f4' },
                        ticks: {
                            callback: function(v) { return Utils.formatCurrency(v, 2); },
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }

    /**
     * Destroy the current chart instance.
     */
    function destroy() {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    }

    return {
        render: render,
        destroy: destroy,
    };
})();

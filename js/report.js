export function renderReport() {
    const report = JSON.parse(sessionStorage.getItem('report') || '{}');

    return `
        <div class="report-container">
            <h1>Monthly Expense Report</h1>
            <div class="report-content">
                <p>${report.report1 || ''}</p>
                <p>${report.report2 || ''}</p>
                <p>${report.report3 || ''}</p>
                <p>${report.report4 || ''}</p>
                <p>${report.report5 || ''}</p>
            </div>
            <div class="final-report">
                ${report.finalReport || 'No report data available'}
            </div>
            <div class="report-actions">
                <button onclick="window.location.hash = '#home'">Back to Home</button>
            </div>
        </div>
    `;
}

export function renderNoReport() {
    return `
        <div class="report-container">
            <h1>No Report Available</h1>
            <div class="report-content">
                <p>Nothing to report yet. No payments and debts registered or an error occurred during the total values consulting.</p>
            </div>
            <div class="report-actions">
                <button onclick="window.location.hash = '#home'">Back to Home</button>
            </div>
        </div>
    `;
}

const formatCurrency = (value) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
}).format(value);

const formatDate = (iso) => new Date(iso).toLocaleDateString('es-CO');

function renderItemTable(title, items) {
    const rows = items.length === 0
        ? `<div class="full-report-empty">No entries.</div>`
        : items.map(it => `
            <div class="full-report-row">
                <span>${it.name}</span>
                <span>${formatCurrency(it.value)}</span>
                <span>${formatDate(it.createDate)}</span>
            </div>
        `).join('');

    const total = items.reduce((sum, it) => sum + it.value, 0);

    return `
        <div class="full-report-section">
            <h3>${title}</h3>
            <div class="full-report-header">
                <h4>Name</h4>
                <h4>Value</h4>
                <h4>Date</h4>
            </div>
            ${rows}
            <div class="full-report-total">
                <span>Total</span>
                <span>${formatCurrency(total)}</span>
            </div>
        </div>
    `;
}

function renderUserBlock(user) {
    return `
        <div class="full-report-user">
            <h2>${user.name}</h2>
            ${renderItemTable('Payments', user.payments || [])}
            ${renderItemTable('Debts', user.debts || [])}
        </div>
    `;
}

export function renderFullReport() {
    const report = JSON.parse(sessionStorage.getItem('report') || '{}');
    const data = JSON.parse(sessionStorage.getItem('fullReportData') || 'null');

    if (!data) {
        return `
            <div class="report-container">
                <h1>Full Expense Report</h1>
                <p>No data available. Go back to home and click "Full report (PDF)".</p>
                <div class="report-actions">
                    <button onclick="window.location.hash = '#home'">Back to Home</button>
                </div>
            </div>
        `;
    }

    return `
        <div class="full-report-container">
            <div class="full-report-actions no-print">
                <button onclick="window.location.hash = '#home'">Back to Home</button>
                <button onclick="window.print()">Save as PDF</button>
            </div>

            <header class="full-report-heading">
                <h1>PairXpenses — Full Expense Report</h1>
                <p class="full-report-date">${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </header>

            <section class="full-report-summary">
                <h2>Monthly Expense Report</h2>
                <p>${report.report1 || ''}</p>
                <p>${report.report2 || ''}</p>
                <p>${report.report3 || ''}</p>
                <p>${report.report4 || ''}</p>
                <p>${report.report5 || ''}</p>
                <div class="full-report-final">${report.finalReport || ''}</div>
            </section>

            <section class="full-report-users">
                ${renderUserBlock(data.userA)}
                ${renderUserBlock(data.userB)}
            </section>
        </div>
    `;
}

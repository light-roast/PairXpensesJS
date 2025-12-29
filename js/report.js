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

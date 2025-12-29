import { ApiService } from './api.js';

let state = {
    users: [],
    userA: { id: 1, name: 'User A' },
    userB: { id: 2, name: 'User B' },
    percentageA: 50,
    isOrderReversed: false,
    paymentsA: [],
    paymentsB: [],
    debtsA: [],
    debtsB: []
};

export async function initHome() {
    const users = await ApiService.getUsers();
    if (users && users.length >= 2) {
        state.users = users;
        state.userA = users[0];
        state.userB = users[1];
    }
    
    await loadUserData(state.userA.id, 'A');
    await loadUserData(state.userB.id, 'B');
}

async function loadUserData(userId, userKey) {
    state[`payments${userKey}`] = await ApiService.getPaymentsByUser(userId);
    state[`debts${userKey}`] = await ApiService.getDebtsByUser(userId);
}

export function renderHome() {
    return `
        <nav>
            <h1>PairXpenses</h1>
            ${renderChargeControl()}
        </nav>
        
        <main>
            <div class="${state.isOrderReversed ? 'order-2' : 'order-1'}">
                ${renderUserColumn(state.userA, 'A')}
            </div>
            <div class="${state.isOrderReversed ? 'order-1' : 'order-2'}">
                ${renderUserColumn(state.userB, 'B')}
            </div>
        </main>
        
        <section class="actions-section">
            <button id="generateReportBtn">Generate report</button>
            <div>
                <div id="confirmationDialog" style="display: none;" class="confirmation-dialog">
                    <p>Are you sure you want to start a new month and reset debts and payments?</p>
                    <button id="confirmDeleteBtn">Yes</button>
                    <button id="no-btn">No</button>
                </div>
                <button id="deleteAllBtn">Reset debts and payments</button>
            </div>
        </section>
        
        <!-- Edit Modal -->
        <div id="editModal" class="modal" style="display: none;">
            <div class="modal-content">
                <span class="close" onclick="closeModal()">&times;</span>
                <h2 id="modalTitle">Edit Item</h2>
                <form id="editForm">
                    <div class="form-group">
                        <label>Name:</label>
                        <input type="text" id="editName" required />
                    </div>
                    <div class="form-group">
                        <label>Value:</label>
                        <input type="number" id="editValue" min="0" required />
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="save-btn">Save Changes</button>
                        <button type="button" class="delete-modal-btn" id="deleteModalBtn">Delete</button>
                        <button type="button" class="cancel-btn" onclick="closeModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- User Name Edit Modal -->
        <div id="editUserModal" class="modal" style="display: none;">
            <div class="modal-content">
                <span class="close" onclick="closeUserModal()">&times;</span>
                <h2>Edit User Name</h2>
                <form id="editUserForm">
                    <div class="form-group">
                        <label>User Name:</label>
                        <input type="text" id="editUserName" required />
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="save-btn">Save Changes</button>
                        <button type="button" class="cancel-btn" onclick="closeUserModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function renderChargeControl() {
    return `
        <div class="charge-control">
            <div class="percentage-control">
                <label>Split:</label>
                <input type="range" id="percentageSlider" min="0" max="100" value="${state.percentageA}" />
            </div>
            <div class="percentage-display">
                <span>${state.userA.name}: <strong id="percentageADisplay">${state.percentageA}%</strong></span>
                <span>${state.userB.name}: <strong id="percentageBDisplay">${100 - state.percentageA}%</strong></span>
            </div>
            <div class="toggle-order">
                <label for="reverseOrderCheckbox">Reverse Order:</label>
                <label class="switch">
                    <input type="checkbox" id="reverseOrderCheckbox" ${state.isOrderReversed ? 'checked' : ''} />
                    <span class="slider"></span>
                </label>
            </div>
        </div>
    `;
}

function renderUserColumn(user, userKey) {
    const payments = state[`payments${userKey}`] || [];
    const debts = state[`debts${userKey}`] || [];
    
    return `
        <div class="user-column">
            <div class="user-name">
                <h3 id="userName${userKey}">${user.name}</h3>
                <i class="bi bi-pencil-square edit-user-icon" data-userkey="${userKey}" style="cursor: pointer;"></i>
            </div>
            
            <form class="form-container" data-user="${userKey}">
                <h3>Add new entry:</h3>
                <select class="item-type-select">
                    <option value="payment">Payment</option>
                    <option value="debt">Debt</option>
                </select>
                
                <div>
                    <label>Name:</label>
                    <input type="text" class="item-name" required />
                </div>
                
                <div>
                    <label>Value:</label>
                    <input type="number" class="item-value" min="0" required />
                </div>
                
                <button type="submit">Create</button>
            </form>
            
            <div class="items-section">
                <h3 style="text-align: center; font-family: 'Expletus Sans', sans-serif;">Payments</h3>
                <div class="items-header">
                    <h4>Name</h4>
                    <h4>Value</h4>
                    <h4>Date</h4>
                </div>
                <div id="payments${userKey}">
                    ${payments.map(p => renderPaymentItem(p)).join('')}
                </div>
            </div>
            
            <div class="items-section">
                <h3 style="text-align: center; font-family: 'Expletus Sans', sans-serif;">Debts</h3>
                <div class="items-header">
                    <h4>Name</h4>
                    <h4>Value</h4>
                    <h4>Date</h4>
                </div>
                <div id="debts${userKey}">
                    ${debts.map(d => renderDebtItem(d)).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderPaymentItem(payment) {
    const date = new Date(payment.createDate).toLocaleDateString('es-CO');
    const value = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(payment.value);
    
    return `
        <div class="item-row" onclick="openItemModal('payment', ${payment.id}, '${payment.name.replace(/'/g, "\\'")}'  , ${payment.value}, ${payment.userId})" style="cursor: pointer;">
            <span>${payment.name}</span>
            <span>${value}</span>
            <span>${date}</span>
        </div>
    `;
}

function renderDebtItem(debt) {
    const date = new Date(debt.createDate).toLocaleDateString('es-CO');
    const value = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(debt.value);
    
    return `
        <div class="item-row" onclick="openItemModal('debt', ${debt.id}, '${debt.name.replace(/'/g, "\\'")}'  , ${debt.value}, ${debt.userId})" style="cursor: pointer;">
            <span>${debt.name}</span>
            <span>${value}</span>
            <span>${date}</span>
        </div>
    `;
}

export function setupHomeHandlers() {
    // Percentage slider
    const slider = document.getElementById('percentageSlider');
    slider.addEventListener('input', (e) => {
        state.percentageA = parseInt(e.target.value);
        document.getElementById('percentageADisplay').textContent = `${state.percentageA}%`;
        document.getElementById('percentageBDisplay').textContent = `${100 - state.percentageA}%`;
    });
    
    // Reverse order checkbox
    const checkbox = document.getElementById('reverseOrderCheckbox');
    checkbox.addEventListener('change', (e) => {
        state.isOrderReversed = e.target.checked;
        renderApp();
    });
    
    // Form submissions
    document.querySelectorAll('.form-container').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitButton = form.querySelector('button[type="submit"]');
            
            // Prevent duplicate submissions
            if (submitButton.disabled) {
                return;
            }
            
            submitButton.disabled = true;
            submitButton.textContent = 'Creating...';
            
            try {
                const userKey = form.dataset.user;
                const itemType = form.querySelector('.item-type-select').value;
                const name = form.querySelector('.item-name').value;
                const value = parseInt(form.querySelector('.item-value').value);
                
                const userId = state[`user${userKey}`].id;
                
                if (itemType === 'payment') {
                    await ApiService.createPayment({ name, value, userId });
                } else {
                    await ApiService.createDebt({ name, value, userId });
                }
                
                await loadUserData(userId, userKey);
                form.reset();
                renderApp();
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Create';
            }
        });
    });
    
    // Generate report button
    document.getElementById('generateReportBtn').addEventListener('click', async () => {
        const btn = document.getElementById('generateReportBtn');
        
        // Prevent duplicate submissions
        if (btn.disabled) {
            return;
        }
        
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation: spin 1s linear infinite;"></i> Generating...';
        
        try {
            await generateReport();
        } finally {
            btn.disabled = false;
            btn.textContent = 'Generate report';
        }
    });
    
    // Delete all button
    document.getElementById('deleteAllBtn').addEventListener('click', () => {
        document.getElementById('confirmationDialog').style.display = 'block';
        document.getElementById('deleteAllBtn').style.display = 'none';
    });
    
    // Confirm delete
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        await ApiService.deleteAllDebts();
        await ApiService.deleteAllPayments();
        
        await loadUserData(state.userA.id, 'A');
        await loadUserData(state.userB.id, 'B');
        
        document.getElementById('confirmationDialog').style.display = 'none';
        document.getElementById('deleteAllBtn').style.display = 'block';
        renderApp();
    });
    
    // Cancel delete
    document.getElementById('no-btn').addEventListener('click', () => {
        document.getElementById('confirmationDialog').style.display = 'none';
        document.getElementById('deleteAllBtn').style.display = 'block';
    });
    
    // Setup modal handlers
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', window.handleEditFormSubmit);
    }
    
    const deleteModalBtn = document.getElementById('deleteModalBtn');
    if (deleteModalBtn) {
        deleteModalBtn.addEventListener('click', window.handleModalDelete);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                window.closeModal();
            }
        });
    }
    
    // User name edit icons
    document.querySelectorAll('.edit-user-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const userKey = this.getAttribute('data-userkey');
            window.openUserModal(userKey);
        });
    });
    
    // Setup user modal handlers
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', window.handleUserFormSubmit);
    }
    
    // Close user modal when clicking outside
    const userModal = document.getElementById('editUserModal');
    if (userModal) {
        userModal.addEventListener('click', function(event) {
            if (event.target === userModal) {
                window.closeUserModal();
            }
        });
    }
}

// Global functions for delete buttons
window.deletePayment = async function(paymentId) {
    await ApiService.deletePayment(paymentId);
    await loadUserData(state.userA.id, 'A');
    await loadUserData(state.userB.id, 'B');
    renderApp();
};

window.deleteDebt = async function(debtId) {
    await ApiService.deleteDebt(debtId);
    await loadUserData(state.userA.id, 'A');
    await loadUserData(state.userB.id, 'B');
    renderApp();
};

// User modal state
let userModalState = {
    userKey: null
};

window.openUserModal = function(userKey) {
    userModalState.userKey = userKey;
    
    const modal = document.getElementById('editUserModal');
    const nameInput = document.getElementById('editUserName');
    const currentName = state[`user${userKey}`].name;
    
    nameInput.value = currentName;
    modal.style.display = 'block';
};

window.closeUserModal = function() {
    const modal = document.getElementById('editUserModal');
    modal.style.display = 'none';
    userModalState.userKey = null;
};

window.handleUserFormSubmit = async function(e) {
    e.preventDefault();
    
    const newName = document.getElementById('editUserName').value;
    const userKey = userModalState.userKey;
    const currentName = state[`user${userKey}`].name;
    
    if (newName && newName !== currentName) {
        const userId = state[`user${userKey}`].id;
        await ApiService.updateUser(userId, newName);
        state[`user${userKey}`].name = newName;
        window.closeUserModal();
        window.renderApp();
    }
};

async function generateReport() {
    const totalPaymentA = await ApiService.getTotalPaymentByUser(state.userA.id);
    const totalPaymentB = await ApiService.getTotalPaymentByUser(state.userB.id);
    const totalDebtA = await ApiService.getTotalDebtByUser(state.userA.id);
    const totalDebtB = await ApiService.getTotalDebtByUser(state.userB.id);
    
    if (totalPaymentA === 0 && totalPaymentB === 0 && totalDebtA === 0 && totalDebtB === 0) {
        window.location.hash = '#no-report';
        return;
    }
    
    const totalExpense = totalPaymentA + totalPaymentB;
    const expenseForA = totalExpense * state.percentageA / 100;
    const expenseForB = totalExpense - expenseForA;
    
    const formatCurrency = (value) => new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        minimumFractionDigits: 0 
    }).format(value);
    
    let report = {
        report1: `Total pair expenses during the month: ${formatCurrency(totalExpense)}.\n`,
        report2: '',
        report3: '',
        report4: '',
        report5: '',
        finalReport: ''
    };
    
    let debtFromAtoB = 0;
    let debtFromBtoA = 0;
    
    if (totalPaymentA > expenseForA) {
        debtFromBtoA = totalPaymentA - expenseForA;
        report.report2 = `${state.userA.name} spent ${formatCurrency(totalPaymentA)} during the month. Which is more than their share (${state.percentageA}% / ${formatCurrency(expenseForA)}).\n`;
        report.report3 = totalPaymentB !== 0 
            ? `${state.userB.name} spent ${formatCurrency(totalPaymentB)} during the month. Which is less than their share (${100 - state.percentageA}% / ${formatCurrency(expenseForB)}).\n`
            : `${state.userB.name} did not register payments during the month and their share is ${100 - state.percentageA}% / ${formatCurrency(expenseForB)}.\n`;
        report.report4 = totalDebtA !== 0 
            ? `${state.userA.name} accumulated a total of debts with ${state.userB.name} amounting to ${formatCurrency(totalDebtA)}`
            : `${state.userA.name} does not have any debts with ${state.userB.name}.`;
        report.report5 = totalDebtB !== 0 
            ? `${state.userB.name} accumulated a total of debts with ${state.userA.name} amounting to ${formatCurrency(totalDebtB)}`
            : `${state.userB.name} does not have any debts with ${state.userA.name}.`;
    } else if (totalPaymentB > expenseForB) {
        debtFromAtoB = totalPaymentB - expenseForB;
        report.report2 = `${state.userB.name} spent ${formatCurrency(totalPaymentB)} during the month. Which is more than their share (${100 - state.percentageA}% / ${formatCurrency(expenseForB)}).\n`;
        report.report3 = totalPaymentA !== 0 
            ? `${state.userA.name} spent ${formatCurrency(totalPaymentA)} during the month. Which is less than their share (${state.percentageA}% / ${formatCurrency(expenseForA)}).\n`
            : `${state.userA.name} did not register payments during the month and their share is ${state.percentageA}% / ${formatCurrency(expenseForA)}.\n`;
        report.report4 = totalDebtB !== 0 
            ? `${state.userB.name} accumulated a total of debts with ${state.userA.name} amounting to ${formatCurrency(totalDebtB)}`
            : `${state.userB.name} does not have any debts with ${state.userA.name}.`;
        report.report5 = totalDebtA !== 0 
            ? `${state.userA.name} accumulated a total of debts with ${state.userB.name} amounting to ${formatCurrency(totalDebtA)}`
            : `${state.userA.name} does not have any debts with ${state.userB.name}.`;
    } else {
        report.report3 = "All users spent accordingly to their shares";
        report.report4 = totalDebtA !== 0 
            ? `${state.userA.name} accumulated a total of debts with ${state.userB.name} amounting to ${formatCurrency(totalDebtA)}`
            : `${state.userA.name} does not have any debts with ${state.userB.name}.`;
        report.report5 = totalDebtB !== 0 
            ? `${state.userB.name} accumulated a total of debts with ${state.userA.name} amounting to ${formatCurrency(totalDebtB)}`
            : `${state.userB.name} does not have any debts with ${state.userA.name}.`;
    }
    
    // Calculate final report
    if (debtFromBtoA > 0) {
        const totalBDebt = debtFromBtoA + totalDebtB;
        const netDebt = totalBDebt - totalDebtA;
        
        if (netDebt > 0) {
            report.finalReport = `${state.userB.name} owes ${state.userA.name} ${formatCurrency(netDebt)} for the month's expenses.`;
        } else if (netDebt < 0) {
            report.finalReport = `${state.userA.name} owes ${state.userB.name} ${formatCurrency(-netDebt)} for the month's expenses.`;
        } else {
            report.finalReport = "Both users spent within their share and neither owes anything to the other.";
        }
    } else if (debtFromAtoB > 0) {
        const totalADebt = debtFromAtoB + totalDebtA;
        const netDebt = totalADebt - totalDebtB;
        
        if (netDebt > 0) {
            report.finalReport = `${state.userA.name} owes ${state.userB.name} ${formatCurrency(netDebt)} for the month's expenses.`;
        } else if (netDebt < 0) {
            report.finalReport = `${state.userB.name} owes ${state.userA.name} ${formatCurrency(-netDebt)} for the month's expenses.`;
        } else {
            report.finalReport = "Both users spent within their share and neither owes anything to the other.";
        }
    } else {
        if (totalDebtA === totalDebtB) {
            report.finalReport = "Both users spent within their share and neither owes anything to the other.";
        } else if (totalDebtA > totalDebtB) {
            const final = totalDebtA - totalDebtB;
            report.finalReport = `${state.userA.name} owes ${formatCurrency(final)} to ${state.userB.name}`;
        } else {
            const final = totalDebtB - totalDebtA;
            report.finalReport = `${state.userB.name} owes ${formatCurrency(final)} to ${state.userA.name}`;
        }
    }
    
    sessionStorage.setItem('report', JSON.stringify(report));
    window.location.hash = '#report';
}

// Modal state
let modalState = {
    type: null,
    id: null,
    userId: null
};

// Global modal functions
window.openItemModal = function(type, id, name, value, userId) {
    modalState = { type, id, userId };
    
    const modal = document.getElementById('editModal');
    const title = document.getElementById('modalTitle');
    const nameInput = document.getElementById('editName');
    const valueInput = document.getElementById('editValue');
    const deleteBtn = document.getElementById('deleteModalBtn');
    
    title.textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    nameInput.value = name;
    valueInput.value = value;
    
    // Reset delete button to original state
    deleteBtn.dataset.confirming = 'false';
    deleteBtn.disabled = false;
    deleteBtn.textContent = 'Delete';
    
    modal.style.display = 'block';
};

window.closeModal = function() {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
    modalState = { type: null, id: null, userId: null };
};

window.handleEditFormSubmit = async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('editName').value;
    const value = parseInt(document.getElementById('editValue').value);
    
    const itemData = {
        name,
        value
    };
    
    if (modalState.type === 'payment') {
        await ApiService.updatePayment(modalState.id, itemData);
    } else {
        await ApiService.updateDebt(modalState.id, itemData);
    }
    
    await loadUserData(state.userA.id, 'A');
    await loadUserData(state.userB.id, 'B');
    
    window.closeModal();
    window.renderApp();
};

window.handleModalDelete = async function() {
    const deleteBtn = document.getElementById('deleteModalBtn');
    
    // If already showing confirmation, don't do anything
    if (deleteBtn.dataset.confirming === 'true') {
        return;
    }
    
    // Mark as confirming and change button appearance
    deleteBtn.dataset.confirming = 'true';
    deleteBtn.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
            <span style="font-size: 14px;">Are you sure?</span>
            <div style="display: flex; gap: 8px;">
                <button type="button" id="confirmYes" style="background-color: #ff4444; color: white; padding: 5px 15px; border: none; border-radius: 3px; cursor: pointer;">Yes</button>
                <button type="button" id="confirmNo" style="background-color: #666; color: white; padding: 5px 15px; border: none; border-radius: 3px; cursor: pointer;">No</button>
            </div>
        </div>
    `;
    
    // Handle Yes click
    document.getElementById('confirmYes').addEventListener('click', async function() {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation: spin 1s linear infinite;"></i> Deleting...';
        
        try {
            if (modalState.type === 'payment') {
                await ApiService.deletePayment(modalState.id);
            } else {
                await ApiService.deleteDebt(modalState.id);
            }
            
            await loadUserData(state.userA.id, 'A');
            await loadUserData(state.userB.id, 'B');
            
            window.closeModal();
            window.renderApp();
        } catch (error) {
            console.error('Delete error:', error);
            resetDeleteButton(deleteBtn);
        }
    });
    
    // Handle No click
    document.getElementById('confirmNo').addEventListener('click', function() {
        window.closeModal();
    });
};

function resetDeleteButton(deleteBtn) {
    deleteBtn.dataset.confirming = 'false';
    deleteBtn.disabled = false;
    deleteBtn.textContent = 'Delete';
}

// Make renderApp available globally
window.renderApp = function() {
    const app = document.getElementById('app');
    app.innerHTML = renderHome();
    setupHomeHandlers();
};

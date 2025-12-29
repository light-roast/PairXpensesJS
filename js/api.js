// API Configuration
const API_BASE_URL = 'https://pairxpenses.azurewebsites.net/api';

// API Service
export class ApiService {
    static async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });

            if (!response.ok && response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/';
                return null;
            }

            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // User endpoints
    static async login(username, password) {
        try {
            const response = await this.request('/Account/Login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            if (response && response.ok) {
                const token = await response.text();
                if (token) {
                    localStorage.setItem('token', token);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }

    static async getUsers() {
        try {
            const response = await this.request('/User');
            if (response && response.ok) {
                return await response.json();
            }
            return [
                { id: 1, name: 'User A' },
                { id: 2, name: 'User B' }
            ];
        } catch (error) {
            console.error('Get users error:', error);
            return [
                { id: 1, name: 'User A' },
                { id: 2, name: 'User B' }
            ];
        }
    }

    static async updateUser(userId, newName) {
        try {
            const response = await this.request(`/user/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify({ id: userId, name: newName })
            });

            if (response && response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Update user error:', error);
            return null;
        }
    }

    // Payment endpoints
    static async getPaymentsByUser(userId) {
        try {
            const response = await this.request(`/Payment/user/${userId}`);
            if (response && response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Get payments error:', error);
            return [];
        }
    }

    static async getTotalPaymentByUser(userId) {
        try {
            const response = await this.request(`/Payment/total/${userId}`);
            if (response && response.ok) {
                const text = await response.text();
                return parseFloat(text) || 0;
            }
            return 0;
        } catch (error) {
            console.error('Get total payment error:', error);
            return 0;
        }
    }

    static async createPayment(payment) {
        try {
            const response = await this.request('/Payment', {
                method: 'POST',
                body: JSON.stringify(payment)
            });

            if (response && response.ok) {
                const text = await response.text();
                try {
                    return JSON.parse(text);
                } catch {
                    return text;
                }
            }
            return null;
        } catch (error) {
            console.error('Create payment error:', error);
            return null;
        }
    }

    static async updatePayment(paymentId, payment) {
        try {
            const response = await this.request(`/Payment/${paymentId}`, {
                method: 'PATCH',
                body: JSON.stringify({ name: payment.name, value: payment.value })
            });

            if (response && response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Update payment error:', error);
            return null;
        }
    }

    static async deletePayment(paymentId) {
        try {
            const response = await this.request(`/Payment/${paymentId}`, {
                method: 'DELETE'
            });
            return response && response.ok;
        } catch (error) {
            console.error('Delete payment error:', error);
            return false;
        }
    }

    static async deleteAllPayments() {
        try {
            const response = await this.request('/Payment/deleteAll', {
                method: 'DELETE'
            });
            return response && response.ok;
        } catch (error) {
            console.error('Delete all payments error:', error);
            return false;
        }
    }

    // Debt endpoints
    static async getDebtsByUser(userId) {
        try {
            const response = await this.request(`/Debt/user/${userId}`);
            if (response && response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Get debts error:', error);
            return [];
        }
    }

    static async getTotalDebtByUser(userId) {
        try {
            const response = await this.request(`/Debt/total/${userId}`);
            if (response && response.ok) {
                const text = await response.text();
                return parseFloat(text) || 0;
            }
            return 0;
        } catch (error) {
            console.error('Get total debt error:', error);
            return 0;
        }
    }

    static async createDebt(debt) {
        try {
            const response = await this.request('/Debt', {
                method: 'POST',
                body: JSON.stringify(debt)
            });

            if (response && response.ok) {
                const text = await response.text();
                try {
                    return JSON.parse(text);
                } catch {
                    return text;
                }
            }
            return null;
        } catch (error) {
            console.error('Create debt error:', error);
            return null;
        }
    }

    static async updateDebt(debtId, debt) {
        try {
            const response = await this.request(`/Debt/${debtId}`, {
                method: 'PATCH',
                body: JSON.stringify({ id: debtId, name: debt.name, value: debt.value })
            });

            if (response && response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Update debt error:', error);
            return null;
        }
    }

    static async deleteDebt(debtId) {
        try {
            const response = await this.request(`/Debt/${debtId}`, {
                method: 'DELETE'
            });
            return response && response.ok;
        } catch (error) {
            console.error('Delete debt error:', error);
            return false;
        }
    }

    static async deleteAllDebts() {
        try {
            const response = await this.request('/Debt/deleteAll', {
                method: 'DELETE'
            });
            return response && response.ok;
        } catch (error) {
            console.error('Delete all debts error:', error);
            return false;
        }
    }
}

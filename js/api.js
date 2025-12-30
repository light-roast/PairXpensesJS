// API Configuration
const API_BASE_URL = 'https://pairxpenses.azurewebsites.net/api';

// API Service
export class ApiService {
    // Decode JWT token
    static decodeToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    // Check if token is expired
    static isTokenExpired(token) {
        if (!token) return true;
        
        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.exp) return true;
        
        // exp is in seconds, Date.now() is in milliseconds
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    }

    // Show expired token modal
    static showExpiredTokenModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('expired-token-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal HTML
        const modalHTML = `
            <div id="expired-token-modal" class="modal-overlay">
                <div class="modal-content">
                    <h2>Session Expired</h2>
                    <p>Your session has expired. A new login is required.</p>
                    <button id="modal-ok-btn" class="modal-btn">OK</button>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add event listener to OK button
        document.getElementById('modal-ok-btn').addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/';
        });

        // Add styles if not already present
        if (!document.getElementById('modal-styles')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'modal-styles';
            styleTag.textContent = `
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }
                .modal-content {
                    background-color: var(--main-color, #FFF7F3);
                    padding: 30px 40px;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                }
                .modal-content h2 {
                    color: var(--primary-dark, #3A001E);
                    margin-bottom: 15px;
                    font-family: "Expletus Sans", sans-serif;
                }
                .modal-content p {
                    color: var(--primary-dark, #3A001E);
                    margin-bottom: 25px;
                    font-size: 16px;
                }
                .modal-btn {
                    background-color: var(--primary-accent, #FF8762);
                    color: var(--primary-dark, #3A001E);
                    padding: 12px 30px;
                    font-size: 16px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-family: "Expletus Sans", sans-serif;
                    font-weight: bold;
                    transition: background-color 0.3s ease;
                }
                .modal-btn:hover {
                    background-color: var(--accent-hover, #E65A32);
                }
            `;
            document.head.appendChild(styleTag);
        }
    }
    static async request(endpoint, options = {}) {
        // Skip token validation for login endpoint
        if (!endpoint.includes('/Account/Login')) {
            const token = localStorage.getItem('token');
            
            // Validate token before making request
            if (this.isTokenExpired(token)) {
                this.showExpiredTokenModal();
                return null;
            }
        }

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
                this.showExpiredTokenModal();
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

import { ApiService } from './api.js';

export function renderLogin() {
    return `
        <div class="login-container">
            <div class="login-box">
                <h1>PairXpenses</h1>
                <h3>Login</h3>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="username">Username:</label>
                        <input id="username" type="text" placeholder="Enter username" required />
                    </div>
                    <div class="form-group">
                        <label for="password">Password:</label>
                        <input id="password" type="password" placeholder="Enter password" required />
                    </div>
                    <button type="submit">Login</button>
                    <div id="errorMessage" class="error-message"></div>
                </form>
            </div>
        </div>
    `;
}

export function setupLoginHandlers() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = form.querySelector('button[type="submit"]');
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('errorMessage');
        
        // Prevent duplicate submissions and show loading
        if (submitButton.disabled) {
            return;
        }
        
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="bi bi-arrow-repeat" style="animation: spin 1s linear infinite;"></i> Loading...';
        errorDiv.textContent = '';
        
        try {
            const success = await ApiService.login(username, password);
            
            if (success) {
                window.location.hash = '#home';
            } else {
                errorDiv.textContent = 'Invalid username or password';
                submitButton.disabled = false;
                submitButton.textContent = 'Login';
            }
        } catch (error) {
            errorDiv.textContent = 'An error occurred. Please try again.';
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
        }
    });
}

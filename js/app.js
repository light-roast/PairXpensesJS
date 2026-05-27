import { renderLogin, setupLoginHandlers } from './login.js';
import { renderHome, setupHomeHandlers, initHome, renderHomeFromCache } from './home.js';
import { renderReport, renderNoReport, renderFullReport } from './report.js';

// Router
class Router {
    constructor() {
        this.routes = {
            '': this.handleLogin.bind(this),
            'home': this.handleHome.bind(this),
            'report': this.handleReport.bind(this),
            'full-report': this.handleFullReport.bind(this),
            'no-report': this.handleNoReport.bind(this)
        };
        
        window.addEventListener('hashchange', () => this.route());
        this.route();
    }
    
    route() {
        const hash = window.location.hash.slice(1);
        const handler = this.routes[hash] || this.routes[''];
        handler();
    }
    
    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
    
    async handleLogin() {
        if (this.isAuthenticated()) {
            window.location.hash = '#home';
            return;
        }
        
        const app = document.getElementById('app');
        app.innerHTML = renderLogin();
        setupLoginHandlers();
    }
    
    async handleHome() {
        if (!this.isAuthenticated()) {
            window.location.hash = '';
            return;
        }

        const app = document.getElementById('app');
        const hadCache = renderHomeFromCache();

        if (hadCache) {
            app.innerHTML = renderHome();
            setupHomeHandlers();

            try {
                await initHome();
                window.renderApp();
            } catch (_) {
                // network failure: keep cached view. 401 path handled by ApiService.
            }
            return;
        }

        app.innerHTML = '<div class="loading">Loading...</div>';
        await initHome();
        app.innerHTML = renderHome();
        setupHomeHandlers();
    }
    
    handleReport() {
        if (!this.isAuthenticated()) {
            window.location.hash = '';
            return;
        }
        
        const app = document.getElementById('app');
        app.innerHTML = renderReport();
    }
    
    handleNoReport() {
        if (!this.isAuthenticated()) {
            window.location.hash = '';
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = renderNoReport();
    }

    handleFullReport() {
        if (!this.isAuthenticated()) {
            window.location.hash = '';
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = renderFullReport();
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new Router();
});

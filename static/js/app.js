const App = {
    toast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    async fetchAPI(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/';
                }
                throw new Error(data.error || 'Something went wrong');
            }
            return data;
        } catch (error) {
            this.toast(error.message, 'error');
            throw error;
        }
    },
    
    async logout() {
        try {
            await this.fetchAPI('/api/auth/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (e) {
            console.error(e);
        }
    }
};

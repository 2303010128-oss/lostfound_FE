// Konfigurasi URL Backend (Otomatis menyesuaikan lingkungan Local / Production)
const isProduction = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('github.io');

// TODO: Ganti URL Render di bawah ini dengan URL Render backend Anda yang sebenarnya jika sudah ada!
const API_DOMAIN = isProduction 
    ? 'https://your-backend-app-name.onrender.com' // <-- Ganti dengan URL Render asli
    : 'http://127.0.0.1:8000';

const BASE_URL = `${API_DOMAIN}/api/v1`;
window.STORAGE_URL = `${API_DOMAIN}/storage/`;

// Fungsi otomatis untuk mengambil header (menyuntikkan Token dan format JSON)
function getHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    return headers;
}

// Fungsi serbaguna untuk menembak API Backend
async function apiFetch(endpoint, options = {}) {
    const url = BASE_URL + endpoint;
    const config = {
        ...options,
        headers: {
            ...getHeaders(),
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);
        
        if (response.status === 401) {
            console.error('API Error: Unauthenticated.');
            if (!options.skipRedirect) {
                console.error('Redirecting to login.');
                if (typeof logout === 'function') {
                    logout();
                } else {
                    localStorage.clear();
                    window.location.replace('/user/auth/login.html');
                }
            }
            // Parse error message if possible
            let errorData = null;
            try { errorData = await response.json(); } catch(e) {}
            return { response, data: errorData };
        }

        const data = await response.json();
        return { response, data };
    } catch (error) {
        console.error('Terjadi kesalahan jaringan atau server mati:', error);
        throw error;
    }
}

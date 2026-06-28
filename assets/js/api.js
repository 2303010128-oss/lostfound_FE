const BASE_URL = `https://lostfound-backend-pwtf.onrender.com/api/v1`;

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

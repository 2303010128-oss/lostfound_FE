function getAuthBasePath() {
    const path = window.location.pathname;
    if (path.includes('/lostfound-frontend/')) {
        return '/lostfound-frontend';
    }
    return '';
}

// Fungsi untuk menendang pengguna yang belum login
function requireAuth(allowedRoles = []) {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const base = getAuthBasePath();

    // Sistem 1 Pintu: Jika belum login, semua dilempar ke login mahasiswa
    if (!token) {
        window.location.replace(base + '/user/auth/login.html');
        return false;
    }

    // Jika peran (role) tidak sesuai dengan izin halaman
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        if (role === 'satpam' || role === 'admin') {
            window.location.replace(base + '/admin/dashboard/index.html');
        } else {
            window.location.replace(base + '/user/mading/index.html'); 
        }
        return false;
    }
    return true;
}

// Fungsi untuk menghapus sesi dan membuang pengguna ke pintu depan tunggal
async function logout() {
    // Beritahu backend untuk mematikan token (jika api.js tersedia)
    if (typeof window.apiFetch === 'function' && localStorage.getItem('token')) {
        try {
            await window.apiFetch('/auth/logout', { method: 'POST' });
        } catch (e) {
            console.warn('Gagal memanggil API logout:', e);
        }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    localStorage.removeItem('isLoggedIn');
    window.location.replace(getAuthBasePath() + '/user/auth/login.html');
}

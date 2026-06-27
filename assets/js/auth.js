// Fungsi untuk menendang pengguna yang belum login
function requireAuth(allowedRoles = []) {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Jika tidak punya kunci masuk (token), buang ke halaman Login Admin
    // (Bisa disesuaikan nanti jika ada halaman login khusus user)
    if (!token) {
        window.location.replace('/admin/auth/login.html');
        return false;
    }

    // Jika peran (role) tidak sesuai dengan izin halaman
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        if (role === 'satpam') {
            window.location.replace('/admin/dashboard/index.html');
        } else {
            // Jika dia user biasa tapi mencoba masuk halaman satpam
            window.location.replace('/'); 
        }
        return false;
    }
    return true;
}

// Fungsi untuk menghapus sesi dan membuang pengguna ke pintu depan
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    window.location.replace('/admin/auth/login.html');
}

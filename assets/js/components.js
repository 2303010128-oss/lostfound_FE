function getBasePath() {
    // Deteksi otomatis jika menggunakan XAMPP (lostfound-frontend)
    const path = window.location.pathname;
    if (path.includes('/lostfound-frontend/')) {
        return '/lostfound-frontend';
    }
    return ''; // Jika pakai Live Server biasa
}

async function loadSidebar() {
    const container = document.getElementById('app-sidebar');
    if (!container) return; // Skip jika halaman ini tidak butuh sidebar

    try {
        const res = await fetch(getBasePath() + '/components/sidebar_admin.html');
        const html = await res.text();
        container.innerHTML = html;

        // Logika Pintar: Beri warna aktif otomatis pada menu yang sedang dikunjungi
        const currentPath = window.location.pathname;
        const links = container.querySelectorAll('.menu-item');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            // Menghilangkan status active default bawaan dari HTML
            link.classList.remove('active');
            
            // Jika path URL cocok dengan nama folder menu (misal: /antrean/)
            if (href) {
                const folderName = href.split('/')[1]; 
                if (folderName && currentPath.includes('/' + folderName + '/')) {
                    link.classList.add('active');
                }
            }
        });
    } catch (error) {
        console.error('Gagal memuat sidebar:', error);
    }
}

// Jalankan otomatis saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    loadSidebar();
});

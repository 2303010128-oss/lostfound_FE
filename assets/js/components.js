// Panggil fungsi Satpam (Auth Guard) untuk memastikan hanya admin yang bisa masuk!
if (typeof requireAuth === 'function') {
    requireAuth(['satpam']);
}

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
        // Tambahkan cache-buster (?v=...) agar peramban selalu mengambil versi HTML terbaru
        const res = await fetch(getBasePath() + '/components/sidebar_admin.html?v=' + new Date().getTime());
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

        // Dynamic Badges Fetching
        if (typeof window.apiFetch === 'function') {
            try {
                // Fetch Items
                const itemsRes = await window.apiFetch('/items');
                if(itemsRes && itemsRes.data && itemsRes.data.data) {
                    const pendingItems = itemsRes.data.data.filter(i => i.status_barang === 'pending' || i.status_barang === 'menunggu').length;
                    const bAntrean = document.getElementById('badge-antrean');
                    if(bAntrean && pendingItems > 0) {
                        bAntrean.textContent = pendingItems;
                        bAntrean.style.display = 'inline-block';
                    }
                }

                // Fetch Claims
                const claimsRes = await window.apiFetch('/claims');
                if(claimsRes && claimsRes.data && claimsRes.data.data) {
                    const pendingClaims = claimsRes.data.data.filter(c => c.status_verif === 'pending' || c.status_verif === 'menunggu').length;
                    const bVerifikasi = document.getElementById('badge-verifikasi');
                    if(bVerifikasi && pendingClaims > 0) {
                        bVerifikasi.textContent = pendingClaims;
                        bVerifikasi.style.display = 'inline-block';
                    }
                }
            } catch(e) {
                console.error('Gagal mengambil data antrean:', e);
            }
        }
    } catch (error) {
        console.error('Gagal memuat sidebar:', error);
    }
}

// Jalankan otomatis saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    loadSidebar();
});

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardActivity();
});

async function loadDashboardActivity() {
    const tbody = document.getElementById('dashboardActivityBody');
    if (!tbody) return;

    try {
        const [claimsResult, itemsResult] = await Promise.all([
            apiFetch('/claims'),
            apiFetch('/admin/items')
        ]);

        if (claimsResult.response.ok && itemsResult.response.ok) {
            // Ekstrak Klaim
            let claims = [];
            if (Array.isArray(claimsResult.data)) claims = claimsResult.data;
            else if (claimsResult.data && Array.isArray(claimsResult.data.data)) claims = claimsResult.data.data;
            else if (claimsResult.data && claimsResult.data.data && Array.isArray(claimsResult.data.data.data)) claims = claimsResult.data.data.data;

            // Ekstrak Items
            let items = [];
            if (Array.isArray(itemsResult.data)) items = itemsResult.data;
            else if (itemsResult.data && Array.isArray(itemsResult.data.data)) items = itemsResult.data.data;
            else if (itemsResult.data && itemsResult.data.data && Array.isArray(itemsResult.data.data.data)) items = itemsResult.data.data.data;

            // Kalkulasi Statistik
            const pendingClaims = claims.filter(c => ['pending', 'clarification_required'].includes(c.status_verif)).length;
            const activeItems = items.filter(i => i.visibility === 'private').length;
            const returnedClaims = claims.filter(c => c.status_verif === 'returned').length;

            // Injeksi ke UI Kartu Statistik
            if (document.getElementById('stat-klaim-pending')) document.getElementById('stat-klaim-pending').innerText = pendingClaims;
            if (document.getElementById('stat-antrean')) document.getElementById('stat-antrean').innerText = activeItems;
            if (document.getElementById('stat-selesai')) document.getElementById('stat-selesai').innerText = returnedClaims;

            // Ambil 5 aktivitas klaim terbaru saja untuk tabel Dasbor
            let recentActivity = claims.slice(0, 5);

            tbody.innerHTML = '';

            if (recentActivity.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #64748b;">Belum ada aktivitas terbaru.</td></tr>`;
                return;
            }

            recentActivity.forEach(claim => {
                const tr = document.createElement('tr');
                
                let statusClass = 'diverifikasi';
                let statusText = 'Pending';
                
                if (claim.status_verif === 'returned') {
                    statusClass = 'diserahkan';
                    statusText = 'Diserahkan';
                } else if (claim.status_verif === 'approved') {
                    statusClass = 'diserahkan';
                    statusText = 'Disetujui';
                } else if (claim.status_verif === 'rejected') {
                    statusClass = 'diverifikasi';
                    statusText = 'Ditolak';
                } else {
                    statusText = 'Menunggu';
                }

                const timeString = claim.created_at ? new Date(claim.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : 'Baru saja';

                tr.innerHTML = `
                    <td><strong>${claim.item ? claim.item.judul : 'Barang'}</strong></td>
                    <td><span class="status-pill ${statusClass}">${statusText}</span></td>
                    <td>${claim.user ? claim.user.nama_lengkap : 'Siswa Anonim'}</td>
                    <td>${timeString} WIB</td>
                `;
                tbody.appendChild(tr);
            });

        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #dc2626;">Gagal memuat aktivitas.</td></tr>`;
        }
    } catch (error) {
        console.error('Error fetching dashboard activity:', error);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #dc2626;">Terjadi kesalahan jaringan.</td></tr>`;
    }
}

// --- Logika Proses Serah Terima (Handover) dengan Token ---
window.processHandover = function() {
    const input = document.getElementById('inputTokenHandover');
    const token = input.value.trim().toUpperCase();
    
    if (!token) {
        alert('TOLONG MASUKKAN TOKEN!\nSilakan minta kode token dari aplikasi mahasiswa.');
        input.focus();
        return;
    }

    // Redirect ke halaman Serah Terima Fisik (Jalur Langsung Disetujui)
    window.location.href = `../serah-terima/index.html?token=${encodeURIComponent(token)}`;
};

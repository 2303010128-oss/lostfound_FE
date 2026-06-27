document.addEventListener('DOMContentLoaded', () => {
    loadDetailItem();
});

let currentItemId = null;

async function loadDetailItem() {
    // Ambil ID dari URL (contoh: detail.html?id=12)
    const urlParams = new URLSearchParams(window.location.search);
    currentItemId = urlParams.get('id');

    if (!currentItemId) {
        alert('ID Barang tidak ditemukan. Kembali ke daftar antrean.');
        window.location.href = 'index.html';
        return;
    }

    try {
        const result = await apiFetch(`/items/${currentItemId}`);
        
        if (result.response.ok) {
            const item = result.data.data || result.data;
            renderDetail(item);
        } else {
            alert('Gagal memuat detail barang: ' + (result.data.message || 'Error Server'));
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error load detail:', error);
        alert('Terjadi kesalahan jaringan.');
    }
}

function renderDetail(item) {
    document.getElementById('detailHeaderId').innerText = `ID Laporan: #FND-${item.id}`;
    document.getElementById('detailHeaderStatus').innerText = (item.status || 'DRAFT').toUpperCase();
    
    document.getElementById('detailItemName').innerText = item.judul || 'Tanpa Nama';
    document.getElementById('detailItemCategory').innerHTML = `📦 ${item.category ? item.category.nama : 'Umum'}`;
    document.getElementById('detailItemLocation').innerHTML = `📍 ${item.location ? item.location.nama : 'Tidak diketahui'}`;
    
    const timeStr = item.created_at ? new Date(item.created_at).toLocaleString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'Baru saja';
    document.getElementById('detailItemTime').innerHTML = `📅 ${timeStr} WIB`;
    
    document.getElementById('detailItemDesc').innerText = `"${item.deskripsi || item.deskripsi_rahasia || 'Tidak ada deskripsi'}"`;
    
    // Foto
    const photoEl = document.getElementById('detailItemPhoto');
    const photoNameEl = document.getElementById('detailItemPhotoName');
    
    if (item.foto) {
        // Asumsi API mengembalikan absolute path atau relative
        // Sesuaikan Base URL Laravel jika path relative, tapi untuk saat ini anggap absolute atau full
        const photoUrl = item.foto.startsWith('http') ? item.foto : `http://localhost:8000/storage/${item.foto}`;
        photoEl.src = photoUrl;
        photoEl.style.display = 'block';
        photoNameEl.innerText = item.foto.split('/').pop();
    } else {
        photoNameEl.innerText = 'TIDAK ADA FOTO TERLAMPIR';
    }

    // Profil Pelapor
    if (item.user) {
        const name = item.user.nama_lengkap || 'Anonim';
        document.getElementById('detailReporterName').innerText = name;
        document.getElementById('detailReporterInitial').innerText = name.substring(0, 2).toUpperCase();
        document.getElementById('detailReporterNpm').innerText = `${item.user.role || 'Mahasiswa'} • ${item.user.email || ''}`;
    }
}

// --- LOGIKA AKSI APPROVE & REJECT ---
window.handleApprove = async function() {
    if (!confirm('Anda yakin ingin Menerima & Merilis temuan ini ke publik?')) return;
    
    try {
        const btn = document.querySelector('.btn-action-block.approve');
        const origTxt = btn.innerText;
        btn.innerText = 'Memproses...'; btn.disabled = true;

        // Memanggil endpoint release khusus satpam
        const result = await apiFetch(`/items/${currentItemId}/release`, {
            method: 'PATCH'
        });

        if (result.response.ok) {
            document.getElementById('successModal').style.display = 'flex';
        } else {
            alert('Gagal menerbitkan: ' + (result.data.message || 'Error server'));
        }
    } catch (e) {
        alert('Kesalahan jaringan.');
    }
};

window.handleReject = function() {
    document.getElementById('cancelModal').style.display = 'flex';
};

window.closeCancelModal = function() {
    document.getElementById('cancelModal').style.display = 'none';
};

window.executeCancellation = async function() {
    try {
        const btn = document.querySelector('.btn-modal-danger');
        btn.innerText = 'Menghapus...'; btn.disabled = true;

        // Simulasi membuang barang
        const result = await apiFetch(`/items/${currentItemId}`, { method: 'DELETE' });
        
        if (result.response.ok) {
            alert('Laporan dibatalkan dan dihapus.');
            window.location.href = 'index.html';
        } else {
            alert('Gagal membatalkan: ' + (result.data.message || 'Error'));
            btn.innerText = 'Ya, Batalkan'; btn.disabled = false;
        }
    } catch (e) {
        alert('Kesalahan jaringan.');
    }
};

// --- LOGIKA MODAL SUCCESS ---
window.closeModalAndRedirect = function() {
    window.location.href = 'index.html';
};
window.closeModalOnly = function(event) {
    event.preventDefault();
    document.getElementById('successModal').style.display = 'none';
    loadDetailItem(); // Refresh UI untuk update status badge
};

window.onclick = function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.style.display = 'none';
    }
};

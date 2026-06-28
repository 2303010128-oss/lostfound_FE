document.addEventListener('DOMContentLoaded', () => {
    loadAntrean();
});

let currentCancelId = null;

async function loadAntrean(page = 1) {
    const tbody = document.getElementById('antreanBody');
    if (!tbody) return;

    try {
        // Panggil API Laravel (menggunakan auth header otomatis dari api.js)
        const result = await apiFetch('/admin/items?visibility=private&page=' + page);

        if (result.response.ok) {
            // Anggap data yang dikembalikan ada di result.data.data (format pagination Laravel)
            let items = [];
            let pagination = null;
            if (Array.isArray(result.data)) {
                items = result.data;
            } else if (result.data && Array.isArray(result.data.data)) {
                items = result.data.data;
                pagination = result.data;
            } else if (result.data && result.data.data && Array.isArray(result.data.data.data)) {
                items = result.data.data.data;
                pagination = result.data.data;
            }
            
            tbody.innerHTML = ''; // Kosongkan status "Memuat data..."

            if (items.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 60px 20px; color: #64748b;">
                            <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
                            <div style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">Tidak Ada Antrean</div>
                            <div style="font-size: 13px;">Saat ini tidak ada data barang temuan yang tersedia.</div>
                        </td>
                    </tr>
                `;
                return;
            }

            items.forEach(item => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.onclick = () => window.location.href = `detail.html?id=${item.id}`;

                // Aman mengambil properti, jika tidak ada diberi nilai 'default'
                const judul = item.judul || 'Barang Tanpa Nama';
                const penemu = item.user ? item.user.nama_lengkap : 'Anonim';
                const lokasi = item.location ? item.location.nama : 'Lokasi Tidak Diketahui';
                const status = (item.status || 'DRAFT').toUpperCase();

                tr.innerHTML = `
                    <td class="col-id">#FND-${item.id}</td>
                    <td>
                        <div class="col-item-flex">
                            <div class="item-icon-box">📦</div>
                            <span>${judul}</span>
                        </div>
                    </td>
                    <td>${penemu}</td>
                    <td>
                        <div class="col-location-flex">
                            <span>📍</span> ${lokasi}
                        </div>
                    </td>
                    <td><span class="status-pill-draft">${status}</span></td>
                    <td>
                        <div class="actions-flex" onclick="event.stopPropagation();">
                            <button class="btn-table-action release" onclick="handleRelease(${item.id})">Terima & Rilis</button>
                            <button class="btn-table-action cancel" onclick="handleCancel(${item.id}, '${penemu}')">Batalkan</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            if (pagination) {
                renderPagination(pagination);
            }

        } else {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #dc2626;">Gagal memuat data: ${result.data.message || 'Error Backend'}</td></tr>`;
        }
    } catch (error) {
        console.error('Error fetching antrean:', error);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #dc2626;">Terjadi kesalahan jaringan saat memuat data.</td></tr>`;
    }
}

function renderPagination(pageData) {
    const info = document.getElementById('paginationInfo');
    const list = document.getElementById('paginationList');
    if (!info || !list) return;

    const from = pageData.from || 0;
    const to = pageData.to || 0;
    const total = pageData.total || 0;
    
    info.innerText = `Showing ${from}-${to} of ${total} entries`;

    let html = '';
    
    // Prev
    if (pageData.prev_page_url) {
        html += `<li class="page-link-item arrow" onclick="loadAntrean(${pageData.current_page - 1})">«</li>`;
    } else {
        html += `<li class="page-link-item arrow" style="opacity:0.5; cursor:not-allowed;">«</li>`;
    }

    // Pages
    for (let i = 1; i <= pageData.last_page; i++) {
        if (i === pageData.current_page) {
            html += `<li class="page-link-item active">${i}</li>`;
        } else {
            html += `<li class="page-link-item" onclick="loadAntrean(${i})">${i}</li>`;
        }
    }

    // Next
    if (pageData.next_page_url) {
        html += `<li class="page-link-item arrow" onclick="loadAntrean(${pageData.current_page + 1})">»</li>`;
    } else {
        html += `<li class="page-link-item arrow" style="opacity:0.5; cursor:not-allowed;">»</li>`;
    }

    list.innerHTML = html;
}

// --- Logika Interaksi Modals ---
window.handleRelease = function(itemId) {
    window.location.href = `detail.html?id=${itemId}`;
};

window.showSuccessReleaseModal = function(itemName) {
    if (itemName) {
        document.getElementById('successReleaseText').innerHTML = `Laporan fisik untuk <strong>'${itemName}'</strong> resmi diverifikasi. Status barang kini berubah menjadi 'Published' dan sudah tayang di halaman publik.`;
    }
    document.getElementById('successReleaseModal').style.display = 'flex';
};

window.closeSuccessReleaseModal = function() {
    document.getElementById('successReleaseModal').style.display = 'none';
};

window.handleCancel = function(itemId, penemuName) {
    currentCancelId = itemId;
    document.getElementById('targetPenemu').innerText = penemuName;
    document.getElementById('cancelModal').style.display = 'flex';
};

window.closeCancelModal = function() {
    document.getElementById('cancelModal').style.display = 'none';
    currentCancelId = null;
};

window.executeCancellation = async function() {
    if (!currentCancelId) return;

    const btn = document.querySelector('.btn-modal-danger');
    const originalText = btn.innerText;
    btn.innerText = 'Memproses...';
    btn.disabled = true;

    try {
        // Tembak API Delete ke Laravel
        const result = await apiFetch(`/items/${currentCancelId}`, { method: 'DELETE' });
        
        if (result.response.ok) {
            alert('Sukses! Laporan telah dibatalkan dan dihapus dari antrean.');
            closeCancelModal();
            
            // Render ulang tabel untuk menghilangkan baris yang baru saja dihapus
            const tbody = document.getElementById('antreanBody');
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px;"><span style="color: #64748b;">Memuat data...</span></td></tr>`;
            loadAntrean(); 
        } else {
            alert('Gagal membatalkan laporan: ' + (result.data.message || 'Error server'));
        }
    } catch (error) {
        alert('Kesalahan jaringan!');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

// Tutup popup saat mengklik luar kotak
window.onclick = function(event) {
    const modal = document.getElementById('cancelModal');
    const successModal = document.getElementById('successReleaseModal');
    if (event.target == modal) {
        closeCancelModal();
    }
    if (event.target == successModal) {
        closeSuccessReleaseModal();
    }
};

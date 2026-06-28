document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
});

let searchTimeout = null;

function handleSearch(e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadUsers(1);
    }, 500);
}

async function loadUsers(page = 1) {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;

    const searchQuery = document.getElementById('searchInput').value;
    const roleFilter = document.getElementById('roleFilter').value;

    try {
        let url = `/users?page=${page}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        if (roleFilter !== 'all') url += `&role=${roleFilter}`;

        const result = await apiFetch(url);

        if (result.response.ok) {
            let users = [];
            let pagination = null;
            if (Array.isArray(result.data)) {
                users = result.data;
            } else if (result.data && Array.isArray(result.data.data)) {
                users = result.data.data;
                pagination = result.data;
            } else if (result.data && result.data.data && Array.isArray(result.data.data.data)) {
                users = result.data.data.data;
                pagination = result.data.data;
            }
            
            tbody.innerHTML = '';

            if (users.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 60px 20px; color: #64748b;">
                    <div style="font-size: 40px; margin-bottom: 12px;">👻</div>
                    <div style="font-weight: 600;">Tidak ada user yang ditemukan</div>
                </td></tr>`;
                document.getElementById('paginationList').innerHTML = '';
                document.getElementById('paginationInfo').innerText = '';
                return;
            }

            users.forEach(u => {
                const initial = u.nama_lengkap ? u.nama_lengkap.substring(0, 2).toUpperCase() : 'US';
                const isSatpam = u.role === 'satpam';
                const roleClass = isSatpam ? 'role-satpam' : 'role-mahasiswa';
                const roleName = isSatpam ? 'Satpam (Admin)' : 'Mahasiswa';
                const bgGradient = isSatpam ? 'linear-gradient(135deg, #1e293b, #334155)' : 'linear-gradient(135deg, #ea580c, #c2410c)';

                const date = new Date(u.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });

                window[`userData_${u.id}`] = u;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="user-name-col">
                            <div class="user-avatar" style="background: ${bgGradient};">${initial}</div>
                            <div class="user-info-text">
                                <span class="user-name-title">${u.nama_lengkap}</span>
                                <span class="user-phone">${u.no_hp || '-'}</span>
                            </div>
                        </div>
                    </td>
                    <td><span class="role-badge ${roleClass}">${roleName}</span></td>
                    <td style="color: #475569;">${u.email}</td>
                    <td style="color: #64748b;">${date}</td>
                    <td>
                        <div class="actions-flex">
                            <button class="btn-action-sm btn-edit" title="Edit User" onclick="editUser(${u.id})">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="btn-action-sm btn-delete" title="Hapus User" onclick="deleteUser(${u.id})">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            if (pagination) {
                renderPagination(pagination);
            }

        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #dc2626;">Gagal memuat: ${result.data.message || 'Error'}</td></tr>`;
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #dc2626;">Kesalahan Jaringan.</td></tr>`;
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
    if (pageData.prev_page_url) html += `<li class="page-link-item arrow" onclick="loadUsers(${pageData.current_page - 1})">«</li>`;
    else html += `<li class="page-link-item arrow" style="opacity:0.5; cursor:not-allowed;">«</li>`;

    for (let i = 1; i <= pageData.last_page; i++) {
        if (i === pageData.current_page) html += `<li class="page-link-item active">${i}</li>`;
        else html += `<li class="page-link-item" onclick="loadUsers(${i})">${i}</li>`;
    }

    if (pageData.next_page_url) html += `<li class="page-link-item arrow" onclick="loadUsers(${pageData.current_page + 1})">»</li>`;
    else html += `<li class="page-link-item arrow" style="opacity:0.5; cursor:not-allowed;">»</li>`;

    list.innerHTML = html;
}

// MODAL LOGIC
function openUserModal() {
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('modalTitle').innerText = 'Tambah User Baru';
    document.getElementById('userPassword').required = true;
    document.getElementById('passwordHelp').style.display = 'none';
    document.getElementById('userModal').style.display = 'flex';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

function editUser(id) {
    const u = window[`userData_${id}`];
    if (!u) return;

    document.getElementById('userForm').reset();
    document.getElementById('userId').value = u.id;
    document.getElementById('modalTitle').innerText = 'Edit User';
    
    document.getElementById('userName').value = u.nama_lengkap;
    document.getElementById('userEmail').value = u.email;
    document.getElementById('userPhone').value = u.no_hp;
    document.getElementById('userRole').value = u.role;
    
    document.getElementById('userPassword').required = false;
    document.getElementById('passwordHelp').style.display = 'block';

    document.getElementById('userModal').style.display = 'flex';
}

async function saveUser(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveUser');
    const originalText = btn.innerText;
    btn.innerText = 'Menyimpan...';
    btn.disabled = true;

    const id = document.getElementById('userId').value;
    const isEdit = !!id;

    const payload = {
        nama_lengkap: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        no_hp: document.getElementById('userPhone').value,
        role: document.getElementById('userRole').value,
    };

    const pwd = document.getElementById('userPassword').value;
    if (pwd) payload.password = pwd;

    try {
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `/users/${id}` : `/users`;
        
        const result = await apiFetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (result.response.ok) {
            alert(`User berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!`);
            closeUserModal();
            loadUsers(1);
        } else {
            let errorMsg = result.data.message || 'Gagal menyimpan user.';
            if (result.data.errors) {
                errorMsg = Object.values(result.data.errors).flat().join('\n');
            }
            alert('Gagal: \n' + errorMsg);
        }
    } catch (error) {
        alert('Terjadi kesalahan jaringan.');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function deleteUser(id) {
    if (!confirm('⚠️ PERINGATAN: Apakah Anda yakin ingin menghapus user ini secara permanen?')) return;
    try {
        const result = await apiFetch('/users/' + id, { method: 'DELETE' });
        if (result.response.ok) {
            alert('User berhasil dihapus!');
            loadUsers(1);
        } else {
            alert('Gagal menghapus: ' + (result.data.message || 'Error server'));
        }
    } catch (e) {
        alert('Kesalahan jaringan.');
    }
}

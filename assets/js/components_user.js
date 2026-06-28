function getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/lostfound-frontend/')) {
        return '/lostfound-frontend';
    }
    return '';
}

async function loadUserNavbar() {
    const container = document.getElementById('app-navbar');
    if (!container) return;

    try {
        const res = await fetch(getBasePath() + '/components/navbar_user.html?v=' + new Date().getTime());
        const html = await res.text();
        container.innerHTML = html;

        // Beri warna aktif pada navbar
        const currentPath = window.location.pathname;
        const links = container.querySelectorAll('.nav-link');
        
        links.forEach(link => {
            link.classList.remove('active');
            const dataPath = link.getAttribute('data-path');
            if (dataPath && currentPath.includes('/' + dataPath + '/')) {
                link.classList.add('active');
            }
        });

        checkAuthentication();

    } catch (e) {
        console.error('Gagal memuat navbar user:', e);
    }
}

function checkAuthentication() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const guestNav = document.getElementById('authNotLoggedIn');
    const userNav = document.getElementById('authLoggedIn');

    if (isLoggedIn) {
        if (guestNav) guestNav.style.display = 'none';
        if (userNav) userNav.classList.remove('hidden');

        const user = JSON.parse(localStorage.getItem('user'));
        const name = user ? user.nama_lengkap : 'Mahasiswa';
        
        const userNameTxt = document.getElementById('userNameTxt');
        const avatarName = document.getElementById('avatarName');
        
        if (userNameTxt) userNameTxt.textContent = name;
        if (avatarName) avatarName.textContent = name.substring(0, 2).toUpperCase();
    } else {
        if (guestNav) guestNav.style.display = 'flex';
        if (userNav) userNav.classList.add('hidden');
    }
}

function toggleDropdownMenu(e) {
    if(e) e.stopPropagation();
    const menu = document.getElementById('dropdownMenu');
    if(menu) menu.classList.toggle('open');
}

// Global click event to close dropdown if clicked outside
document.addEventListener('click', function(e) {
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (dropdownMenu && dropdownMenu.classList.contains('open')) {
        dropdownMenu.classList.remove('open');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadUserNavbar();
});

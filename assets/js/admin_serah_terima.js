document.addEventListener('DOMContentLoaded', () => {
    initHandover();
});

async function initHandover() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        alert('Token validasi tidak ditemukan!');
        window.location.href = '../dashboard/index.html';
        return;
    }

    document.getElementById('uiTokenString').innerText = token;
    document.getElementById('uiTimestamp').innerText = `TIMESTAMP: ${new Date().toISOString()}`;

    // Note: The item name could be fetched if we had a dedicated token preview endpoint.
    document.getElementById('uiItemName').innerText = "Barang (Validasi Token)";

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const submitBtn = document.getElementById('finishButton');

    // Initially disable button
    submitBtn.disabled = true;

    const checkState = () => {
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        submitBtn.disabled = !allChecked;
    };

    checkboxes.forEach(cb => {
        cb.addEventListener('change', checkState);
    });

    submitBtn.addEventListener('click', async () => {
        submitBtn.innerHTML = `
            <span class="material-symbols-outlined animate-spin">sync</span>
            Memproses Serah Terima...
        `;
        submitBtn.disabled = true;

        try {
            const result = await apiFetch('/handovers', {
                method: 'POST',
                body: JSON.stringify({ token_pengambilan: token })
            });

            if (result.response.ok) {
                submitBtn.classList.replace('bg-[#10B981]', 'bg-blue-600');
                submitBtn.innerHTML = `
                    <span class="material-symbols-outlined">check_circle</span>
                    Serah Terima Selesai!
                `;
                setTimeout(() => {
                    alert('🎉 Laporan Berhasil Ditutup & Diarsipkan.');
                    window.location.href = '../dashboard/index.html';
                }, 1000);
            } else {
                alert('❌ Serah terima gagal: ' + (result.data.message || 'Token tidak valid.'));
                submitBtn.innerHTML = `
                    <span class="material-symbols-outlined">task_alt</span>
                    Selesaikan Serah Terima & Tutup Laporan
                `;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Handover Error:', error);
            alert('Terjadi kesalahan jaringan.');
            submitBtn.innerHTML = `
                <span class="material-symbols-outlined">task_alt</span>
                Selesaikan Serah Terima & Tutup Laporan
            `;
            submitBtn.disabled = false;
        }
    });
}

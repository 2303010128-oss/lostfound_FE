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
    
    // Webcam logic
    initWebcam();
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
            const formData = new FormData();
            formData.append('token_pengambilan', token);

            // Ambil gambar dari canvas jika ada
            const webcamCanvas = document.getElementById('webcamCanvas');
            if (webcamCanvas && webcamCanvas.style.display === 'block') {
                const dataUrl = webcamCanvas.toDataURL('image/jpeg', 0.8);
                const blob = await (await fetch(dataUrl)).blob();
                formData.append('foto_serah_terima', blob, 'dokumentasi_serah_terima.jpg');
            }

            // Jangan gunakan JSON.stringify karena kita mengirim FormData
            // Hapus Content-Type header default dari apiFetch agar browser set boundary otomatis
            const headers = {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            };

            const response = await fetch('http://127.0.0.1:8000/api/v1/handovers', {
                method: 'POST',
                headers: headers,
                body: formData
            });
            const data = await response.json();

            if (response.ok) {
                submitBtn.classList.replace('bg-[#10B981]', 'bg-blue-600');
                submitBtn.innerHTML = `
                    <span class="material-symbols-outlined">check_circle</span>
                    Serah Terima Selesai!
                `;
                // Tampilkan Modal Sukses (Hapus hidden class)
                const modalSukses = document.getElementById('modal-sukses-final');
                if (modalSukses) {
                    const pTag = modalSukses.querySelector('p.text-slate-500');
                    if (pTag) {
                        pTag.innerHTML = `Barang terkait dengan <strong>Token ${token}</strong> resmi ditutup secara permanen. Berkas bukti dokumentasi fisik telah berhasil dikunci ke dalam gudang server 'Arsip Laporan'.`;
                    }
                    modalSukses.classList.remove('hidden');
                } else {
                    alert('🎉 Laporan Berhasil Ditutup & Diarsipkan.');
                    window.location.href = '../dashboard/index.html';
                }
            } else {
                alert('❌ Serah terima gagal: ' + (data.message || 'Gagal diproses server.'));
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

let stream = null;
function initWebcam() {
    const btnStartCamera = document.getElementById('btnStartCamera');
    const btnCapturePhoto = document.getElementById('btnCapturePhoto');
    const webcamVideo = document.getElementById('webcamVideo');
    const webcamCanvas = document.getElementById('webcamCanvas');
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const recIndicator = document.getElementById('recIndicator');
    const captureBtnText = document.getElementById('captureBtnText');
    const btnUploadPhoto = document.getElementById('btnUploadPhoto');
    const uploadPhotoInput = document.getElementById('uploadPhotoInput');
    const orDivider = document.getElementById('orDivider');

    if (!btnStartCamera) return;

    btnStartCamera.addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            webcamVideo.srcObject = stream;
            webcamVideo.style.display = 'block';
            cameraPlaceholder.style.display = 'none';
            recIndicator.style.display = 'flex';
            webcamCanvas.style.display = 'none';
            
            btnStartCamera.style.display = 'none';
            btnCapturePhoto.style.display = 'flex';
            captureBtnText.innerText = 'Ambil Foto Penerima';
        } catch (err) {
            console.error("Error accessing webcam:", err);
            alert("Gagal mengakses kamera. Pastikan Anda memberikan izin akses kamera ke browser.");
        }
    });

    btnCapturePhoto.addEventListener('click', () => {
        if (webcamVideo.style.display === 'block') {
            // Take photo
            const context = webcamCanvas.getContext('2d');
            webcamCanvas.width = webcamVideo.videoWidth;
            webcamCanvas.height = webcamVideo.videoHeight;
            context.drawImage(webcamVideo, 0, 0, webcamCanvas.width, webcamCanvas.height);
            
            webcamVideo.style.display = 'none';
            webcamCanvas.style.display = 'block';
            recIndicator.style.display = 'none';
            
            captureBtnText.innerText = 'Ambil Ulang Foto Penerima';
        } else {
            // Retake photo
            webcamCanvas.style.display = 'none';
            webcamVideo.style.display = 'block';
            recIndicator.style.display = 'flex';
            captureBtnText.innerText = 'Ambil Foto Penerima';
        }
    });

    if (btnUploadPhoto && uploadPhotoInput) {
        btnUploadPhoto.addEventListener('click', () => {
            uploadPhotoInput.click();
        });

        uploadPhotoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = new Image();
                    img.onload = function() {
                        // Stop webcam if running
                        if (stream) {
                            stream.getTracks().forEach(track => track.stop());
                            stream = null;
                        }
                        
                        webcamVideo.style.display = 'none';
                        cameraPlaceholder.style.display = 'none';
                        recIndicator.style.display = 'none';
                        
                        // Draw image to canvas
                        webcamCanvas.width = img.width;
                        webcamCanvas.height = img.height;
                        const context = webcamCanvas.getContext('2d');
                        context.drawImage(img, 0, 0, webcamCanvas.width, webcamCanvas.height);
                        webcamCanvas.style.display = 'block';

                        // Update UI buttons
                        btnStartCamera.style.display = 'flex';
                        btnStartCamera.innerHTML = `<span class="material-symbols-outlined text-lg">videocam</span> Ganti ke Kamera`;
                        btnCapturePhoto.style.display = 'none';
                        orDivider.style.display = 'flex';
                        btnUploadPhoto.innerHTML = `<span class="material-symbols-outlined text-lg">upload_file</span> Ganti File Foto`;
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

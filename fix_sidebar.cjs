const fs = require('fs');
const path = require('path');

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

walkSync('admin', function(filePath) {
    if (!filePath.endsWith('.html')) return;
    if (filePath.includes('auth')) return; // Jangan obrak-abrik halaman login
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Hapus seluruh kode <aside> dan ganti jadi <div id="app-sidebar"></div>
    content = content.replace(/<aside class="sidebar">[\s\S]*?<\/aside>/g, '<div id="app-sidebar"></div>');

    // Suntikkan pemanggil komponen dan API tepat sebelum penutup body
    if (!content.includes('components.js')) {
        content = content.replace('</body>', `
    <!-- Injected Base Scripts -->
    <script src="../../assets/js/auth.js"></script>
    <script src="../../assets/js/api.js"></script>
    <script src="../../assets/js/components.js"></script>
</body>`);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Berhasil mengoperasi:', filePath);
    }
});

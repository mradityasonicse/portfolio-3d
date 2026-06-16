const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const targetDirs = [
  path.join(__dirname, 'admin', 'src'),
  path.join(__dirname, 'server')
];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir, (filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.css') || filePath.endsWith('.html') || filePath.endsWith('.json')) {
        const buffer = fs.readFileSync(filePath);
        // Check for UTF-16LE BOM (FF FE) or if it has null bytes
        const isUtf16Le = (buffer[0] === 0xff && buffer[1] === 0xfe) || buffer.includes(0);
        const isUtf16Be = (buffer[0] === 0xfe && buffer[1] === 0xff);
        
        if (isUtf16Le) {
          console.log(`Converting UTF-16LE -> UTF-8: ${filePath}`);
          const content = buffer.toString('utf16le');
          // Remove BOM if present
          const cleanContent = content.startsWith('\ufeff') ? content.slice(1) : content;
          fs.writeFileSync(filePath, cleanContent, 'utf8');
        } else if (isUtf16Be) {
          console.log(`Converting UTF-16BE -> UTF-8: ${filePath}`);
          // Node.js doesn't have native utf16be, but we can swap bytes and use utf16le
          const swapped = Buffer.alloc(buffer.length);
          for (let i = 0; i < buffer.length; i += 2) {
            if (i + 1 < buffer.length) {
              swapped[i] = buffer[i + 1];
              swapped[i + 1] = buffer[i];
            }
          }
          const content = swapped.toString('utf16le');
          const cleanContent = content.startsWith('\ufeff') ? content.slice(1) : content;
          fs.writeFileSync(filePath, cleanContent, 'utf8');
        }
      }
    });
  }
});

console.log('Encoding conversion check completed.');

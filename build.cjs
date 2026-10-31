const fs = require('fs');
const { execSync } = require('child_process');

console.log('Executing build in:', process.cwd());

if (fs.existsSync('Frontend') && fs.existsSync('Frontend/package.json')) {
  console.log('Detected project root. Building Frontend app...');
  execSync('npm --prefix Frontend install && npm --prefix Frontend run build', { stdio: 'inherit' });
} else {
  console.log('Detected Frontend folder. Running vite build...');
  execSync('npx vite build', { stdio: 'inherit' });
}


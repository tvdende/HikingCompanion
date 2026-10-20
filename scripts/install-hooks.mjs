import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve('scripts/git-hooks/pre-push');
const destination = path.resolve('.git/hooks/pre-push');

if (fs.existsSync(source)) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  try {
    fs.chmodSync(destination, 0o755);
  } catch {
    // Ignore chmod on Windows
  }
  console.log('✓ Git pre-push hook installed successfully in .git/hooks/pre-push');
} else {
  console.error('✗ Source hook not found:', source);
  process.exit(1);
}

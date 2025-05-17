import * as fs from 'fs';
import * as path from 'path';

// searches for the base package directory in a Java project
export function findBasePackageDir(javaSrcPath: string): string | null {
  let foundDir: string | null = null;
  function searchDir(currentPath: string) {
    if (foundDir) {return;}
    if (!fs.existsSync(currentPath)) {return;}
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      const fullPath = path.join(currentPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        searchDir(fullPath);
      } else if (file.endsWith('.java')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('public static void main')) {
          foundDir = path.dirname(fullPath);
          return;
        }
      }
    }
  }
  searchDir(javaSrcPath);
  return foundDir;
}

// returns the package name from a given path
export function getPackageFromPath(targetDir: string): string {
  const match = targetDir.replace(/\\/g, '/').match(/src\/main\/java\/(.+)$/);
  if (!match) {return '';}
  return match[1].replace(/\//g, '.');
}

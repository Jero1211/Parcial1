const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const repoDir = path.resolve(__dirname, '..');

async function initAndCommit() {
  console.log('Iniciando repositorio Git en:', repoDir);
  await git.init({ fs, dir: repoDir, defaultBranch: 'main' });

  // Listar todos los archivos excluyendo node_modules y .git
  async function getAllFiles(dir, baseDir = dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.env') {
        continue;
      }

      if (entry.isDirectory()) {
        files = files.concat(await getAllFiles(fullPath, baseDir));
      } else {
        files.push(relPath);
      }
    }
    return files;
  }

  const filesToAdd = await getAllFiles(repoDir);
  console.log(`Agregando ${filesToAdd.length} archivos al staging...`);

  for (const file of filesToAdd) {
    await git.add({ fs, dir: repoDir, filepath: file });
  }

  const sha = await git.commit({
    fs,
    dir: repoDir,
    message: 'Initial commit: Sistema backend y web CinemaStore - Parcial 1 Desarrollo Web',
    author: {
      name: 'Estudiante Unilasallista',
      email: 'estudiante@unilasallista.edu.co'
    }
  });

  console.log('✅ Commit realizado exitosamente con SHA:', sha);
}

initAndCommit().catch(err => {
  console.error('Error al inicializar/commitear:', err);
});

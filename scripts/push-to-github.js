const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const repoDir = path.resolve(__dirname, '..');

async function pushToGitHub() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (q) => new Promise((resolve) => rl.question(q, resolve));

  try {
    console.log('===========================================================');
    console.log('🚀 SUBIR PROYECTO A GITHUB');
    console.log('===========================================================\n');

    let repoUrl = process.env.GITHUB_REPO_URL;
    let token = process.env.GITHUB_TOKEN;

    if (!repoUrl) {
      repoUrl = await question('Ingresa la URL de tu repositorio de GitHub (ej: https://github.com/usuario/parcial1.git): ');
    }
    if (!token) {
      token = await question('Ingresa tu Token de Acceso Personal de GitHub (Personal Access Token): ');
    }

    rl.close();

    if (!repoUrl.trim()) {
      console.error('❌ Error: La URL del repositorio es requerida.');
      process.exit(1);
    }

    console.log(`\nConfigurando remoto 'origin' hacia: ${repoUrl}`);
    await git.addRemote({
      fs,
      dir: repoDir,
      remote: 'origin',
      url: repoUrl.trim(),
      force: true
    });

    console.log('Enviando rama "main" a GitHub...');
    const pushResult = await git.push({
      fs,
      http,
      dir: repoDir,
      remote: 'origin',
      ref: 'main',
      url: repoUrl.trim(),
      onAuth: () => ({ username: token.trim() })
    });

    console.log('✅ ¡Proyecto subido exitosamente a GitHub!');
    console.log('Resultado del push:', pushResult);
  } catch (err) {
    console.error('\n❌ Error durante el push:', err.message);
  }
}

pushToGitHub();

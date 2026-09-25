#!/usr/bin/env node
// Monta em dist/ só o que o site publicado precisa.
// Documentação, testes, validação e arquivos de projeto ficam fora do deploy:
// o Cloudflare Pages publica apenas o conteúdo de dist/.
//   Build command: node scripts/build-deploy.js
//   Build output directory: dist
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const DESTINO = path.join(RAIZ, 'dist');

// Lista fechada: arquivo novo só é publicado se entrar aqui.
const ARQUIVOS = [
  'index.html',
  'infrequencia.html',
  'conciliadorde-planilha.html',
  '404.html',
  '_headers',
  'robots.txt',
  'site.webmanifest',
  'favicon.svg',
  'ui/neu.css',
  'ui/neu.js',
  'vendor/pdf-lib.min.js',
  'vendor/pdf.min.js',
  'vendor/pdf.worker.min.js',
  'vendor/xlsx.full.min.js',
];
const PASTAS = ['assets'];

function copiar(rel) {
  const origem = path.join(RAIZ, rel);
  if (!fs.existsSync(origem)) throw new Error(`Arquivo do deploy não encontrado: ${rel}`);
  const alvo = path.join(DESTINO, rel);
  fs.mkdirSync(path.dirname(alvo), { recursive: true });
  fs.cpSync(origem, alvo, { recursive: true });
}

fs.rmSync(DESTINO, { recursive: true, force: true });
[...ARQUIVOS, ...PASTAS].forEach(copiar);
console.log(`dist/ pronto: ${ARQUIVOS.length} arquivos + ${PASTAS.join(', ')}/`);

require('dotenv').config({ quiet: true });
const crypto = require('crypto');

const OPCOES_SCRYPT = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const TEXTO_VERIFICADOR = 'cofre-ok';
let chave = null;                           // só existe na memória, depois do desbloqueio

// Senha mestra + salt -> chave de 32 bytes
function derivarChave(senha, salt) {
  return crypto.scryptSync(senha, salt, 32, OPCOES_SCRYPT);
}

function cifrar(texto, k) {
  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv('aes-256-gcm', k, iv);
  const cifrado = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()]);
  const tag = cifra.getAuthTag();
  return [iv, tag, cifrado].map(b => b.toString('base64')).join(':');
}

function decifrar(valor, k) {
  const [iv, tag, cifrado] = valor.split(':').map(p => Buffer.from(p, 'base64'));
  const decifra = crypto.createDecipheriv('aes-256-gcm', k, iv);
  decifra.setAuthTag(tag);
  return Buffer.concat([decifra.update(cifrado), decifra.final()]).toString('utf8');
}

// Usado uma vez só, pelo configurar.js
function gerarConfiguracao(senha) {
  const salt = crypto.randomBytes(16);
  const k = derivarChave(senha, salt);
  return {
    salt: salt.toString('hex'),
    verificador: cifrar(TEXTO_VERIFICADOR, k)
  };
}

// Confere a senha mestra e guarda a chave na memória
function desbloquear(senha) {
  if (!process.env.SALT || !process.env.VERIFICADOR) {
    throw new Error('Cofre não configurado. Rode "node configurar.js" primeiro.');
  }
  const k = derivarChave(senha, Buffer.from(process.env.SALT, 'hex'));
  try {
    if (decifrar(process.env.VERIFICADOR, k) !== TEXTO_VERIFICADOR) throw new Error();
  } catch {
    throw new Error('Senha mestra incorreta.');
  }
  chave = k;
}

// null continua null (campos opcionais)
function criptografar(texto) {
  if (texto === null || texto === undefined) return null;
  if (!chave) throw new Error('Cofre bloqueado.');
  return cifrar(texto, chave);
}

function descriptografar(valor) {
  if (valor === null || valor === undefined) return null;
  if (!chave) throw new Error('Cofre bloqueado.');
  return decifrar(valor, chave);
}

module.exports = { gerarConfiguracao, desbloquear, criptografar, descriptografar };
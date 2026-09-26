
require('dotenv').config();
const crypto = require('crypto');

const CHAVE = Buffer.from(process.env.CHAVE_CRIPTO || '', 'hex');
if (CHAVE.length !== 32) {
  throw new Error('CHAVE_CRIPTO ausente ou inválida no .env');
}

// Embaralha a senha: "senha123" -> "k2Jf...:9sLq...:Xp3a..."
function criptografar(texto) {
  const iv = crypto.randomBytes(12);    // valor aleatório, diferente a cada vez
  const cifra = crypto.createCipheriv('aes-256-gcm', CHAVE, iv);
  const cifrado = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()]);
  const tag = cifra.getAuthTag();       // "lacre" que detecta se alguém mexeu no dado

  return [iv, tag, cifrado].map(b => b.toString('base64')).join(':');
}

// Desembaralha de volta
function descriptografar(valor) {
  const [iv, tag, cifrado] = valor.split(':').map(p => Buffer.from(p, 'base64'));
  const decifra = crypto.createDecipheriv('aes-256-gcm', CHAVE, iv);
  decifra.setAuthTag(tag);

  return Buffer.concat([decifra.update(cifrado), decifra.final()]).toString('utf8');
}

module.exports = { criptografar, descriptografar };
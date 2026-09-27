const { perguntarSenha } = require('./perguntar');
const { gerarConfiguracao } = require('./cripto');

async function main() {
  const senha1 = await perguntarSenha('Crie sua senha mestra: ');
  if (senha1.length < 12) {
    console.log('Use pelo menos 12 caracteres.');
    return;
  }
  const senha2 = await perguntarSenha('Repita a senha mestra: ');
  if (senha1 !== senha2) {
    console.log('As senhas não conferem.');
    return;
  }

  console.log('Gerando configuração...');
  const { salt, verificador } = gerarConfiguracao(senha1);

  console.log('\nCole estas duas linhas no seu .env:\n');
  console.log(`SALT=${salt}`);
  console.log(`VERIFICADOR=${verificador}`);
}

main();
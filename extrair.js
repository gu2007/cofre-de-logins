const fs = require('fs');

// ---------- Tira o nome do serviço do título ----------
// "Email e senha da Steam:" -> "Steam"
function extrairServico(titulo) {
  return titulo
    .replace(/:\s*$/, '')                     // tira o ":" do final
    .replace(/^((email|emal|enail|senha|senna|telefone|e|da|do|de)\s+)+/i, '') // tira "Email e senha da"
    .trim();
}

// ---------- Lê um bloco e monta o objeto ----------
function lerBloco(bloco) {
  // Separa em linhas, tira espaços e ignora linhas vazias ou só com { } "
  const linhas = bloco
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !/^[{}"\s]+$/.test(l));

  if (linhas.length === 0) return null;       // bloco vazio

  const login = {
    servico: extrairServico(linhas[0]),       // 1ª linha = título
    email: null,
    senha: null,
    telefone: null,
    usuario: null
  };
  const problemas = [];

  // Da 2ª linha em diante: "rótulo: valor"
  for (const linha of linhas.slice(1)) {
    const partes = linha.match(/^([^:]+):\s*(.*)$/);
    if (!partes) continue;                    // linha sem ":" -> ignora

    const rotulo = partes[1].trim().toLowerCase();
    const valor  = partes[2].trim();

    if (valor.includes(' ou ')) problemas.push('tem "ou" (mais de um valor)');

    if (rotulo.includes('usuário') || rotulo.includes('usuario') || rotulo.includes('nome da conta')) {
      login.usuario = valor;
    } else if (rotulo.startsWith('em') || rotulo.startsWith('en')) {
      login.email = valor;
    } else if (rotulo.startsWith('senha')) {
      if (login.senha) problemas.push('mais de uma senha');
      login.senha = valor;
    } else if (rotulo.startsWith('tel')) {
      login.telefone = valor.replace(/\D/g, '');   // guarda só os números
    }
  }

  if (!login.senha) problemas.push('sem senha');

  return { login, problemas };
}

// ---------- Função que lê o arquivo inteiro ----------
function extrairLogins(caminho) {
  const texto  = fs.readFileSync(caminho, 'utf-8');
  const blocos = texto.split(/-{10,}/);

  const validos = [];
  const revisar = [];

  for (const bloco of blocos) {
    const resultado = lerBloco(bloco);
    if (!resultado) continue;

    if (resultado.problemas.length === 0) {
      validos.push(resultado.login);
    } else {
      revisar.push(resultado);
    }
  }

  return { validos, revisar };
}

module.exports = { extrairLogins };
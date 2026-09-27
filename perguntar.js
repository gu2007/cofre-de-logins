const readline = require('readline');

function perguntarSenha(texto) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    rl._writeToOutput = (s) => {
      if (s.startsWith(texto)) {
        // O readline redesenhou a linha (ex: você apertou Backspace):
        // escreve a pergunta + um * para cada letra que sobrou
        rl.output.write(texto + '*'.repeat(s.length - texto.length));
      } else if (!/^[\r\n]+$/.test(s)) {
        // Você digitou (ou colou) algo: um * para cada caractere
        rl.output.write('*'.repeat(s.length));
      }
      // O Enter (\r ou \n) não é escrito aqui; a quebra de linha vem no final
    };

    rl.question(texto, resposta => {
      rl.close();
      process.stdout.write('\n');
      resolve(resposta);
    });
  });
}

module.exports = { perguntarSenha };
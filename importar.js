const { sql, config } = require('./conexao');
const { extrairLogins } = require('./extrair');
const { desbloquear, criptografar } = require('./cripto');
const { perguntarSenha } = require('./perguntar');

async function importar() {
  // 1. Desbloqueia ANTES de tocar no banco
  try {
    desbloquear(await perguntarSenha('Senha mestra: '));
  } catch (erro) {
    console.error('❌', erro.message);
    return;
  }

 const arquivo = process.argv[2] || 'logins.txt';
const { validos, revisar } = extrairLogins(arquivo);;

  const pool = await sql.connect(config);
  const transacao = new sql.Transaction(pool);

  try {
    await transacao.begin();

    for (const login of validos) {
      await new sql.Request(transacao)
        .input('servico',  sql.VarChar(100), login.servico)                // fica legível
        .input('email',    sql.VarChar(255), criptografar(login.email))
        .input('senha',    sql.VarChar(255), criptografar(login.senha))
        .input('telefone', sql.VarChar(255), criptografar(login.telefone))
        .input('usuario',  sql.VarChar(255), criptografar(login.usuario))
        .query(`
          INSERT INTO logins (servico, email, senha, telefone, usuario)
          VALUES (@servico, @email, @senha, @telefone, @usuario)
        `);
    }

    await transacao.commit();
    console.log(`✅ ${validos.length} logins importados.`);
  } catch (erro) {
    await transacao.rollback();
    console.error('❌ Erro, nada foi importado:', erro.message);
  } finally {
    await pool.close();
  }

  if (revisar.length > 0) {
    console.log(`\n⚠️ ${revisar.length} blocos para revisar à mão:`);
    revisar.forEach(r => console.log(`- ${r.login.servico}: ${r.problemas.join(', ')}`));
  }
}

importar();
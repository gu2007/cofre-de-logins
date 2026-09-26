const { criptografar } = require('./cripto');
const { sql, config } = require('./conexao');
const { extrairLogins } = require('./extrair');

async function importar() {
  const { validos, revisar } = extrairLogins('logins.txt');

  const pool = await sql.connect(config);
  const transacao = new sql.Transaction(pool);

  try {
    await transacao.begin();                   // começa a transação

    for (const login of validos) {
      await new sql.Request(transacao)
        .input('servico',  sql.VarChar(100), login.servico)
        .input('email',    sql.VarChar(100), login.email)
        .input('senha', sql.VarChar(255), criptografar(login.senha))
        .input('telefone', sql.VarChar(18),  login.telefone)
        .input('usuario',  sql.VarChar(100), login.usuario)
        .query(`
          INSERT INTO logins (servico, email, senha, telefone, usuario)
          VALUES (@servico, @email, @senha, @telefone, @usuario)
        `);
    }

    await transacao.commit();                  // confirma tudo de uma vez
    console.log(`✅ ${validos.length} logins importados.`);
  } catch (erro) {
    await transacao.rollback();                // desfaz tudo
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
const { sql, config } = require('./conexao');
const { desbloquear, descriptografar } = require('./cripto');
const { perguntarSenha } = require('./perguntar');

async function buscar() {
  const termo = process.argv[2];            // o que vem depois de "node buscar.js"
    if (!termo) {
    const pool = await sql.connect(config);
    const resultado = await pool.request()
      .query('SELECT servico FROM logins ORDER BY servico');
    await pool.close();

    console.log('Serviços salvos:');
    resultado.recordset.forEach(l => console.log(`- ${l.servico}`));
    console.log('\nPara ver um login: node buscar.js <serviço>');
    return;
  }

  try {
    desbloquear(await perguntarSenha('Senha mestra: '));
  } catch (erro) {
    console.error('❌', erro.message);
    return;
  }

  const pool = await sql.connect(config);
  const resultado = await pool.request()
    .input('termo', sql.VarChar(100), `%${termo}%`)
    .query('SELECT * FROM logins WHERE servico LIKE @termo');
  await pool.close();

  if (resultado.recordset.length === 0) {
    console.log('Nenhum login encontrado.');
    return;
  }

  const logins = resultado.recordset.map(l => ({
    id:       l.id,
    servico:  l.servico,
    email:    descriptografar(l.email),
    senha:    descriptografar(l.senha),
    telefone: descriptografar(l.telefone),
    usuario:  descriptografar(l.usuario)
  }));

  console.table(logins);
}

buscar();
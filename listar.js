const { sql, config } = require('./conexao');
const { descriptografar } = require('./cripto');

async function listar() {
  const pool = await sql.connect(config);
  const resultado = await pool.request().query('SELECT * FROM logins');
  await pool.close();

  const logins = resultado.recordset.map(l => ({
    ...l,
    senha: descriptografar(l.senha)
  }));

  console.table(logins);
}

listar();
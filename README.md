# Cofre de Logins

Importador de logins em Node.js que lê um arquivo de texto desorganizado (do tipo "bloco de notas"), extrai os dados de cada conta e grava tudo **criptografado** em um banco SQL Server, protegido por uma **senha mestra**.

Projeto de estudo criado para praticar, na prática, o conteúdo de Banco de Dados da faculdade (DDL, DML, restrições e transações) integrado a uma aplicação real.

> Este é um projeto educacional. Para guardar senhas reais no dia a dia, prefira um gerenciador de senhas auditado, como o [Bitwarden](https://bitwarden.com).

---

## Funcionalidades

- **Leitura de texto bagunçado**: entende rótulos escritos de vários jeitos (`EMAIL`, `Email`, `EMAI`, `Emal`...), linhas em branco, separadores de tamanhos diferentes e comentários no telefone
- **Validação antes de gravar**: blocos com problema (sem senha, duas senhas, valores com "ou") não entram no banco e são listados para revisão manual
- **Importação com transação**: ou todos os logins são gravados, ou nenhum é
- **Criptografia AES-256-GCM** de email, senha, telefone e usuário
- **Senha mestra**: a chave de criptografia não fica salva em lugar nenhum; ela é calculada a partir da senha com `scrypt` a cada execução
- **Busca por serviço** direto no terminal, com a senha digitada aparecendo como `****`

## Tecnologias

- [Node.js](https://nodejs.org)
- [SQL Server](https://www.microsoft.com/sql-server) (Express)
- [mssql](https://www.npmjs.com/package/mssql): conexão Node.js ↔ SQL Server
- [dotenv](https://www.npmjs.com/package/dotenv): variáveis de ambiente
- Módulo nativo `crypto` do Node.js (AES-256-GCM + scrypt)

## Decisões de segurança

| Risco | Como o projeto trata |
| --- | --- |
| Credenciais do banco no código | Ficam no `.env`, que não vai para o GitHub (`.gitignore`) |
| Alguém abrir o banco e ler os dados | Email, senha, telefone e usuário são gravados criptografados |
| Alguém com acesso ao PC achar a chave | A chave não é salva: é derivada da senha mestra com `scrypt` |
| Senha mestra errada corromper o banco | Um valor verificador é conferido **antes** de qualquer gravação |
| Dados alterados diretamente no banco | O "lacre" (auth tag) do AES-GCM detecta e recusa o valor |
| SQL Injection | Todas as consultas usam parâmetros (`@nome`) |

O nome do serviço é o único campo **não** criptografado, para permitir buscas com `LIKE` no SQL.

## Estrutura

```
├── conexao.js          # Configuração da conexão com o SQL Server
├── cripto.js           # Criptografia, senha mestra e verificação
├── perguntar.js        # Leitura da senha no terminal com ****
├── configurar.js       # Cria a senha mestra (roda uma vez)
├── extrair.js          # Lê o .txt e transforma cada bloco em um objeto
├── importar.js         # Grava os logins no banco dentro de uma transação
├── buscar.js           # Lista os serviços ou mostra os logins de um serviço
├── exemplo-logins.txt  # Arquivo de teste com dados falsos
└── .env.example        # Modelo das variáveis de ambiente
```

## Como rodar

### 1. Pré-requisitos

- Node.js 18 ou superior
- SQL Server (a versão Express é gratuita) e SSMS
- No SQL Server Configuration Manager: TCP/IP habilitado na porta `1433` e autenticação do SQL Server ativada

### 2. Criar o banco (no SSMS)

```sql
CREATE DATABASE Notes;
GO

CREATE LOGIN notes_app WITH PASSWORD = 'CrieUmaSenhaForte!';
GO

USE Notes;
GO

CREATE USER notes_app FOR LOGIN notes_app;
ALTER ROLE db_owner ADD MEMBER notes_app;
GO

CREATE TABLE logins
(
    id       INT          NOT NULL IDENTITY(1, 1)
  , servico  VARCHAR(100) NOT NULL
  , email    VARCHAR(255)
  , senha    VARCHAR(255) NOT NULL
  , telefone VARCHAR(255)
  , usuario  VARCHAR(255)
  , CONSTRAINT pkLogins PRIMARY KEY (id)
);
```

### 3. Instalar e configurar

```bash
git clone https://github.com/gu2007/cofre-de-logins.git
cd cofre-de-logins
npm install
```

Copie o `.env.example` para `.env` e preencha os dados do banco. Depois, crie sua senha mestra:

```bash
node configurar.js
```

Cole as linhas `SALT=` e `VERIFICADOR=` que aparecerem no `.env`.

> Se você esquecer a senha mestra, os dados **não podem ser recuperados**.

### 4. Usar

```bash
# Importar o arquivo de exemplo
node importar.js exemplo-logins.txt

# Listar os serviços salvos
node buscar.js

# Ver os logins de um serviço
node buscar.js steam
```

## Formato do arquivo de entrada

Cada login fica separado por uma linha de tracinhos. A primeira linha do bloco é o título e as demais seguem o formato `rótulo: valor`:

```
Email e senha da Steam:

Email: fulano@example.com
Senha: MinhaSenha123
Telefone: (11) 90000-0000
---------------------------------------------
Email e senha do Discord:

email: fulano@example.com
nome de usuário: fulano_dev
senha: OutraSenha456
---------------------------------------------
```

## O que pratiquei

- **DDL**: `CREATE TABLE`, `IDENTITY`, `NOT NULL`, `PRIMARY KEY`, `ALTER TABLE ... ALTER COLUMN`
- **DML e DQL**: `INSERT`, `SELECT`, `WHERE`, `LIKE`, `ORDER BY`, `TRUNCATE`
- **Transações**: `BEGIN` / `COMMIT` / `ROLLBACK`
- Integração de banco de dados com uma aplicação Node.js
- Expressões regulares para interpretar texto sem padrão fixo
- Criptografia simétrica, derivação de chave e boas práticas com segredos

## Autor

Gustavo, estudante de Sistemas de Informação na Faculdade Impacta. [GitHub @gu2007](https://github.com/gu2007)

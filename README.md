# API de Controle de Estoque - GranPlus

API RESTful para controle e gestão automatizada de estoque de produtos pet, com suporte a múltiplos lotes, controle de validades (FEFO), auditoria de eventos e geração de relatórios gerenciais.

---

## 🚀 Funcionalidades

*   `✅ Gestão de Usuários e Autenticação`: Controle de acessos por níveis (Admin/User), login seguro por token JWT e redefinição de senha com PIN temporário de 6 dígitos enviado por e-mail.
*   `✅ Controle de Produtos`: Cadastro de produtos contendo códigos únicos, descrições, estoques mínimos de segurança, saldos consolidados e relações com categorias e unidades de medida.
*   `✅ Entrada de Estoque por Lotes`: Registro de notas fiscais de entrada contendo múltiplos itens, com especificação individual de lote, localização e data de validade para cada produto.
*   `✅ Saída de Estoque com Algoritmo FEFO`: Dedução inteligente de saldo físico priorizando lotes mais próximos do vencimento (First Expired, First Out), evitando desperdício de insumos.
*   `✅ Registro Automático de Auditoria`: Logs automáticos para todas as ações de inserção, edição ou exclusão estrutural, armazenando o ID do usuário executor, a tabela afetada e o evento.
*   `✅ Geração de Relatórios Analíticos`: Consultas integradas para produtos abaixo do estoque mínimo, produtos mais movimentados, top fornecedores por investimento e relatório dinâmico de auditoria por período.
*   `✅ Dashboard de Métricas`: Resumos consolidados imediatos do valor financeiro do estoque e alertas para produtos com necessidade de reposição imediata.
*   `✅ Gestão de Entidades de Apoio`: Cadastro e manutenção estruturada de fornecedores (com validação de endereço por CEP), categorias, localizações físicas e unidades de medida.
*   `✅ Integridade Transacional`: Uso rigoroso de transações SQL (Begin, Commit, Rollback) em operações complexas, impedindo inconsistências e dados órfãos.

---

## 🛠️ Tecnologias Utilizadas

*   **Node.js**: Ambiente de execução Javascript assíncrono para o lado do servidor.
*   **Express.js (v5.1.0)**: Framework web minimalista para estruturação de rotas, middlewares de segurança e controle de requisições RESTful.
*   **MySQL2 (v3.6.0)**: Driver de conexão para MySQL com suporte nativo a Promises e Prepared Statements para evitar SQL Injection.
*   **JSON Web Token - JWT (v9.0.3)**: Mecanismo de autenticação stateless baseado em tokens assinados criptograficamente.
*   **Bcrypt (v6.0.0)**: Algoritmo de hashing criptográfico para armazenamento seguro das senhas dos usuários no banco de dados.
*   **Nodemailer (v8.0.6)**: Módulo para envio de e-mails via protocolo SMTP, integrado para envio de PIN de recuperação de senha.
*   **CORS (v2.8.5)**: Middleware para habilitação e controle de políticas de compartilhamento de recursos de origens cruzadas.
*   **Dotenv (v16.6.1)**: Carregamento dinâmico de variáveis de ambiente a partir de arquivos `.env` apartados do código-fonte.
*   **Nodemon (v3.1.11)**: Utilitário de monitoramento em tempo de desenvolvimento para reinicialização automática do processo.

---

## 📁 Estrutura do Projeto

```text
api-tcc-granplus/
├── src/
│   ├── banco-dados/               # Scripts SQL de criação, inserts, triggers e migrações
│   │   ├── MER.jpg                # Modelo Entidade-Relacionamento do banco de dados
│   │   ├── add-indexes.sql        # Criação de índices para melhoria de performance
│   │   ├── alter-entrada-produtos.sql # Script de migração da chave primária
│   │   ├── create.sql             # Estrutura de criação de todas as tabelas
│   │   ├── insert.sql             # Carga inicial de dados para testes
│   │   └── triggers.sql           # Gatilhos automáticos para atualização de estoque
│   ├── config/                    # Arquivos de configuração de infraestrutura
│   │   └── database.js            # Inicialização e pool de conexões MySQL
│   ├── controllers/               # Lógica de negócios e regras de validação
│   │   ├── category.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── database.controller.js
│   │   ├── exit.controller.js
│   │   ├── input.controller.js
│   │   ├── location.controller.js
│   │   ├── product.controller.js
│   │   ├── report.controller.js
│   │   ├── stock.controller.js
│   │   ├── supplier.controller.js
│   │   ├── unitOfMeasurement.controller.js
│   │   └── user.controller.js
│   ├── middlewares/               # Interceptadores de segurança e controle de acesso
│   │   ├── authenticateToken.js   # Validação do token JWT enviado na requisição
│   │   ├── owner.js               # Restrição de acesso ao próprio usuário ou Admin
│   │   └── requireAdmin.js        # Restrição de acesso exclusiva a Administradores
│   ├── routes/                    # Definição dos endpoints da aplicação
│   └── services/                  # Serviços auxiliares e utilitários compartilhados
│       ├── audit.services.js      # Registro automático de eventos no log de auditoria
│       ├── bcrypt.js              # Envelopamento dos métodos de hash e comparação
│       └── updateColunaEstoqueAtual.js # Sincronização do saldo geral de produtos
├── .env                           # Configurações locais de variáveis de ambiente
├── app.js                         # Inicialização e configurações do Express
├── package.json                   # Gerenciador de dependências e scripts do Node
└── server.js                      # Ponto de entrada do servidor HTTP
```

---

## 🚦 Como Executar

### 1. Instalação das Dependências

Instale todos os pacotes definidos no arquivo `package.json` utilizando o gerenciador de pacotes de sua preferência:

```bash
npm install
```

### 2. Configuração das Variáveis de Ambiente

Crie um arquivo chamado `.env` na raiz do projeto contendo as seguintes configurações (ajuste as credenciais conforme as configurações de seu ambiente local):

```env
# Configurações do Banco de Dados
BD_USUARIO = seu_usuario_mysql
BD_SENHA = sua_senha_mysql
BD_SERVIDOR = 127.0.0.1
BD_PORTA = 3306
BD_BANCO = bd_tcc_des_125_estoque

# Configurações de Segurança
JWT_SECRET = sua_chave_secreta_para_geracao_de_tokens_jwt

# Porta da API
PORT = 3333

# Configurações do Serviço de E-mail (Gmail)
GMAIL_USER = seu_email_gmail@gmail.com
GMAIL_PASS = sua_senha_de_aplicativo_do_gmail
```

### 3. Iniciar o Servidor

*   **Modo de Desenvolvimento** (com reinicialização automática em caso de alterações no código):
    ```bash
    npm run dev
    ```

*   **Modo de Produção**:
    ```bash
    npm start
    ```

---

## 📊 Pontos de extremidade da API

### Autenticação & Usuários

| Método | Ponto final | Descrição | Autenticação |
| :--- | :--- | :--- | :--- |
| `POST` | `/usuarios/login` | Realiza autenticação e gera o token JWT de acesso. | ❌ Pública |
| `POST` | `/usuarios/verificar-usuario` | Valida a existência do usuário para iniciar redefinição. | ❌ Pública |
| `POST` | `/usuarios/enviar-pin` | Dispara o PIN de redefinição para o e-mail cadastrado. | ❌ Pública |
| `POST` | `/usuarios/redefinir-senha` | Efetua a alteração da senha mediante envio do PIN válido. | ❌ Pública |
| `GET` | `/usuarios` | Lista todos os usuários cadastrados no sistema. | ✅ Admin |
| `POST` | `/usuarios` | Cadastra um novo usuário no sistema. | ✅ Admin |
| `DELETE` | `/usuarios/:id` | Remove logicamente ou deleta um usuário por ID. | ✅ Admin |
| `GET` | `/usuarios/:id` | Busca detalhes específicos de um usuário por ID. | ✅ Misto / Admin |
| `PUT` | `/usuarios/:id` | Atualiza as informações cadastrais de um usuário. | ✅ Misto / Admin |
| `PUT` | `/usuarios/:id/senha` | Permite que o usuário altere sua própria senha atual. | ✅ Misto / Admin |

### Produtos & Estoque

| Método | Ponto final | Descrição | Autenticação |
| :--- | :--- | :--- | :--- |
| `GET` | `/produtos` | Lista os produtos ativos (ou todos, se `includeInactive=1`). | ✅ Autenticado |
| `POST` | `/produtos` | Cadastra um novo produto. | ✅ Autenticado |
| `PUT` | `/produtos/:id` | Atualiza os dados de um produto existente. | ✅ Autenticado |
| `DELETE` | `/produtos/:id` | Remove um produto (inativação lógica). | ✅ Autenticado |
| `PATCH` | `/produtos/:id/activate` | Reativa um produto inativo no sistema. | ✅ Admin |
| `GET` | `/produtos/historico/:id` | Lista o histórico completo de movimentações de um produto. | ✅ Autenticado |
| `GET` | `/estoque` | Retorna o balanço consolidado de estoque físico atualizado. | ✅ Autenticado |

### Entradas & Saídas (Movimentações)

| Método | Ponto final | Descrição | Autenticação |
| :--- | :--- | :--- | :--- |
| `GET` | `/entradas` | Lista todos os registros de entrada de produtos. | ✅ Autenticado |
| `POST` | `/entradas` | Registra uma nova nota fiscal de entrada de mercadorias. | ✅ Autenticado |
| `PUT` | `/entradas/:id` | Atualiza dados de uma entrada já registrada. | ✅ Autenticado |
| `DELETE` | `/entradas/:id` | Remove uma entrada e estorna os saldos associados. | ✅ Admin |
| `GET` | `/saidas` | Lista todas as saídas de produtos registradas. | ✅ Autenticado |
| `GET` | `/saidas/lotes-disponiveis/:id` | Retorna os lotes ativos e saldos disponíveis para saída. | ✅ Autenticado |
| `POST` | `/saidas` | Registra a saída de produtos, aplicando dedução FEFO. | ✅ Autenticado |

### Categorias, Fornecedores, Unidades & Localizações

| Método | Ponto final | Descrição | Autenticação |
| :--- | :--- | :--- | :--- |
| `GET` | `/categorias` | Lista todas as categorias de produtos. | ✅ Autenticado |
| `GET` | `/categorias/:id` | Busca uma categoria pelo ID. | ✅ Autenticado |
| `POST` | `/categorias` | Cria uma nova categoria de produtos. | ✅ Admin |
| `PUT` | `/categorias/:id` | Altera a descrição de uma categoria existente. | ✅ Admin |
| `DELETE` | `/categorias/:id` | Remove uma categoria de produtos. | ✅ Admin |
| `GET` | `/fornecedores` | Lista todos os fornecedores cadastrados. | ✅ Autenticado |
| `GET` | `/fornecedores/:id` | Busca um fornecedor pelo ID. | ✅ Autenticado |
| `POST` | `/fornecedores` | Cadastra um novo fornecedor. | ✅ Autenticado |
| `PUT` | `/fornecedores/:id` | Atualiza os dados de cadastro de um fornecedor. | ✅ Autenticado |
| `DELETE` | `/fornecedores/:id` | Remove um fornecedor do sistema. | ✅ Autenticado |
| `GET` | `/unidademedidas` | Lista todas as unidades de medida cadastradas. | ✅ Autenticado |
| `GET` | `/unidademedidas/:id` | Busca uma unidade de medida por ID. | ✅ Autenticado |
| `POST` | `/unidademedidas` | Cria uma nova unidade de medida (máx 3 caracteres). | ✅ Admin |
| `PUT` | `/unidademedidas/:id` | Atualiza uma unidade de medida existente. | ✅ Admin |
| `DELETE` | `/unidademedidas/:id` | Remove uma unidade de medida. | ✅ Admin |
| `GET` | `/localizacoes` | Lista todas as localizações físicas ativas do estoque. | ✅ Autenticado |
| `GET` | `/localizacoes/all` | Lista todas as localizações (incluindo as inativas). | ✅ Autenticado |
| `GET` | `/localizacoes/:id` | Busca detalhes de uma localização por ID. | ✅ Autenticado |
| `POST` | `/localizacoes` | Cria uma nova localização física de armazenagem. | ✅ Admin |
| `PUT` | `/localizacoes/:id` | Atualiza os dados de uma localização. | ✅ Admin |
| `DELETE` | `/localizacoes/:id` | Inativa logicamente uma localização física. | ✅ Admin |
| `PATCH` | `/localizacoes/:id/activate` | Reativa uma localização inativa no sistema. | ✅ Admin |

### Dashboard & Relatórios

| Método | Ponto final | Descrição | Autenticação |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/resumo` | Retorna KPIs gerais consolidados do estoque de produtos. | ✅ Misto / Admin |
| `GET` | `/dashboard/resumo/:pdt_id` | Retorna KPIs específicos e evolução de um único produto. | ✅ Misto / Admin |
| `GET` | `/relatorios/produtos-mais-movimentados`| Lista produtos com maior índice de entradas/saídas. | ✅ Autenticado |
| `GET` | `/relatorios/estoque-minimo` | Retorna produtos cujos saldos estão abaixo do mínimo. | ✅ Autenticado |
| `GET` | `/relatorios/fornecedores-top` | Lista fornecedores ordenados pelo total financeiro comprado. | ✅ Autenticado |
| `GET` | `/relatorios/auditoria` | Retorna logs completos de auditoria do sistema. | ✅ Admin |
| `GET` | `/relatorios/dinamico` | Permite a geração customizada de relatórios. | ✅ Autenticado |

### Utilitários do Banco de Dados

| Método | Ponto final | Descrição | Autenticação |
| :--- | :--- | :--- | :--- |
| `GET` | `/database/teste` | Testa a conectividade simples com o banco de dados. | ✅ Autenticado |
| `GET` | `/database/testebanco` | Retorna o status detalhado das variáveis de env do MySQL. | ✅ Admin |

---

## 💡 Exemplos de Uso

### 1. Login de Usuário (Público)

Efetue a autenticação para recuperar o Token JWT requerido para as demais chamadas:

```bash
curl -X POST http://localhost:3333/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "admin@granplus.com",
    "user_senha": "senha_segura_aqui"
  }'
```

*Resposta esperada (Status 200 OK):*
```json
{
  "mensagem": "Login efetuado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "user_id": 1,
    "user_nome": "Administrador",
    "user_email": "admin@granplus.com",
    "user_nivel_acesso": "admin"
  }
}
```

### 2. Listagem de Produtos (Autenticado)

Obtenha a lista completa de produtos cadastrados passando o token obtido no login:

```bash
curl -X GET http://localhost:3333/produtos \
  -H "Authorization: Bearer INSERIR_SEU_TOKEN_JWT_AQUI"
```

### 3. Registrar Entrada de Produto (Autenticado)

Registra a entrada física de mercadorias especificando múltiplos lotes, quantidades e datas de validade:

```bash
curl -X POST http://localhost:3333/entradas \
  -H "Authorization: Bearer INSERIR_SEU_TOKEN_JWT_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "loc_id": 1,
    "fncd_id": 2,
    "ent_data_compra": "2026-06-26T18:00:00Z",
    "ent_valor_compra": 1250.50,
    "produtos": [
      {
        "pdt_id": 5,
        "quantidade": 50,
        "lote": 10024,
        "pdt_validade": "2027-12-31"
      },
      {
        "pdt_id": 5,
        "quantidade": 30,
        "lote": 10025,
        "pdt_validade": "2028-06-30"
      }
    ]
  }'
```

### 4. Registrar Saída de Produto (Autenticado)

Registra a saída manual detalhando quais lotes estão sendo consumidos e as suas respectivas quantidades. O sistema validará se os lotes contêm quantidades físicas suficientes e aplicará a lógica de controle:

```bash
curl -X POST http://localhost:3333/saidas \
  -H "Authorization: Bearer INSERIR_SEU_TOKEN_JWT_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "pdt_id": 5,
    "loc_id": 1,
    "lcl_qtde": 20.00,
    "lcl_destino": "Setor de Embalagem",
    "lcl_tipo": "Consumo Interno",
    "lcl_justificativa": "Retirada para controle de qualidade",
    "lotes_selecionados": [
      {
        "loc_id": 1,
        "lote": "10024",
        "validade": "2027-12-31",
        "quantidade": 20.00
      }
    ]
  }'
```

### 5. Verificar Usuário para Recuperação de Senha (Público)

Inicia o fluxo de redefinição verificando se o e-mail fornecido existe na base de dados:

```bash
curl -X POST http://localhost:3333/usuarios/verificar-usuario \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "usuario@granplus.com"
  }'
```

---

## 🔒 Segurança

*   **Criptografia de Senhas**: Armazenamento seguro de senhas por meio de hash de via biblioteca `bcrypt`, impossibilitando a leitura de dados sensíveis em caso de vazamento da base de dados.
*   **Autenticação JWT (JSON Web Token)**: Controle de acesso stateless nas rotas privadas. O cliente deve enviar o token gerado no login no cabeçalho `Authorization` de cada requisição como `Bearer <Token>`.
*   **Prevenção de SQL Injection**: Uso obrigatório de Prepared Statements (instruções preparadas com placeholders `?`) em todas as queries enviadas ao banco de dados via driver `mysql2/promise`.
*   **Controle de Acesso de Nível de Acesso (RBAC)**: Middlewares específicos controlam as permissões:
    *   `requireAdmin`: Bloqueia o acesso a endpoints críticos de administração (exclusões estruturais, reativações e parametrização do sistema) para usuários do tipo `user`.
    *   `requireOwnerOrAdmin`: Garante que um usuário comum só consiga visualizar ou editar os seus próprios dados cadastrais, enquanto administradores possuem acesso irrestrito.
*   **Validação do Segredo de Assinatura**: O middleware de autenticação verifica se a variável `JWT_SECRET` está configurada no ambiente. Se ausente, as requisições são travadas com erro 500, protegendo o sistema contra chaves padrão fracas ou nulas.
*   **Garantia de Integridade nas Transações**: Operações críticas de escrita multithread (como inserção de entradas de estoque com seus respectivos itens) são envelopadas em transações do banco de dados, efetuando o `rollback` automático das alterações em caso de qualquer erro inesperado.

---

## 📝 Validações

### Usuários (`usuarios`)
*   `user_nome`: Obrigatório, string não vazia (comprimento máximo de 50 caracteres).
*   `user_email`: Obrigatório, string contendo formato válido de e-mail (comprimento máximo de 100 caracteres), único no banco, normalizado automaticamente (espaços removidos e convertido em letras minúsculas).
*   `user_senha`: Obrigatório, string que será criptografada antes da persistência física no banco.
*   `user_nivel_acesso`: Obrigatório, deve corresponder estritamente a `'admin'` ou `'user'`.
*   `user_ativo`: Opcional no cadastro (default `1`), deve ser obrigatoriamente numérico `0` (inativo) ou `1` (ativo) durante alterações cadastrais.

### Produtos (`produto`)
*   `pdt_nome`: Obrigatório, string não vazia (máximo de 100 caracteres), único no banco de dados (validado inclusive contra produtos que foram excluídos logicamente).
*   `pdt_codigo`: Obrigatório, string não vazia (máximo de 50 caracteres), único no banco de dados.
*   `pdt_descricao`: Opcional, string (máximo de 255 caracteres).
*   `pdt_estoque_minimo`: Opcional, numérico inteiro maior ou igual a zero (default `0`).
*   `pdt_ativo`: Opcional (default `1`), aceita exclusivamente `0` ou `1`.
*   `cat_id`: Obrigatório, ID numérico correspondente a uma categoria cadastrada.
*   `unid_med_id`: Obrigatório, ID numérico correspondente a uma unidade de medida cadastrada.

### Fornecedores (`fornecedor`)
*   `fncd_nome`: Obrigatório, string (máximo de 100 caracteres).
*   `fncd_documento`: Obrigatório, string contendo CNPJ/CPF válido (máximo de 14 caracteres).
*   `fncd_cep`: Obrigatório, string representando o CEP (máximo de 9 caracteres).
*   `fncd_logradouro`: Obrigatório, string contendo o endereço (máximo de 150 caracteres).
*   `fncd_numero`: Obrigatório, string contendo o número do endereço (máximo de 20 caracteres).
*   `fncd_complemento`: Opcional, string (máximo de 100 caracteres).
*   `fncd_bairro`: Obrigatório, string (máximo de 100 caracteres).
*   `fncd_cidade`: Obrigatório, string (máximo de 100 caracteres).
*   `fncd_estado`: Obrigatório, string contendo exatamente a sigla do estado com 2 caracteres (ex: 'SP').
*   `fncd_tel`: Obrigatório, string com número de contato telefônico (máximo de 20 caracteres).
*   `fncd_email`: Opcional, string representando o e-mail de contato, convertida para letras minúsculas.
*   `fncd_ativo`: Opcional (default `1`), aceita exclusivamente `0` ou `1`.

### Entradas (`entrada` & `entrada_produtos`)
*   `loc_id`: Obrigatório, ID numérico representativo de localização ativa.
*   `fncd_id`: Obrigatório, ID numérico correspondente a fornecedor cadastrado.
*   `ent_data_compra`: Obrigatório, data válida no formato ISO 8601.
*   `ent_valor_compra`: Obrigatório, decimal numérico representativo do valor total da nota de entrada.
*   `produtos`: Obrigatório, array contendo pelo menos um item. Cada item deve conter:
    *   `pdt_id`: Obrigatório, ID do produto cadastrado.
    *   `quantidade`: Obrigatório, quantidade numérica positiva.
    *   `lote`: Opcional, deve ser estritamente numérico (tipo `INT` no banco).
    *   `pdt_validade`: Opcional, data em formato válido `YYYY-MM-DD`.

### Saídas (`saida_produtos`)
*   `pdt_id`: Obrigatório, ID do produto cadastrado.
*   `loc_id`: Opcional, ID da localização física (se não informado, será extraído dos lotes).
*   `lcl_qtde`: Obrigatório, quantidade numérica positiva.
*   `lcl_destino`: Obrigatório, string de destino (máximo de 100 caracteres).
*   `lcl_tipo`: Obrigatório, tipo de movimentação (máximo de 100 caracteres).
*   `lcl_justificativa`: Obrigatório, justificativa da saída (máximo de 255 caracteres).
*   `lotes_selecionados`: Obrigatório, array contendo a discriminação dos lotes e validades de onde a mercadoria será fisicamente retirada.

### Categorias (`categorias`)
*   `cat_nome`: Obrigatório, string não vazia (máximo de 50 caracteres), única no banco de dados (validação case-insensitive e sem espaços duplicados).

### Unidades de Medida (`unidade_medida`)
*   `unid_med_sigla`: Obrigatório, string representando a sigla da unidade (máximo de 3 caracteres), única no banco (validação case-insensitive).

### Localizações (`localizacao`)
*   `loc_nome`: Obrigatório, nome único identificador do setor físico (máximo de 30 caracteres).
*   `loc_desc`: Opcional, descrição detalhada da área (máximo de 255 caracteres).
*   `loc_ativo`: Opcional (default `1`), aceita exclusivamente `0` ou `1`.

---

## 🚨 Tratamento de Erros

A API responde de forma consistente em caso de inconsistência de dados ou falhas operacionais. A chave principal de erro pode variar ligeiramente entre `erro` e `error` de acordo com a entidade da rota, conforme detalhado abaixo:

*Exemplo de Erro Geral (Padrão 1):*
```json
{
  "erro": "Token de acesso requerido"
}
```

*Exemplo de Erro de Validação de Payload (Padrão 2):*
```json
{
  "error": "Nome, código, categoria e unidade de medida são obrigatórios"
}
```

### Códigos de Status HTTP Utilizados

*   `200 OK`: Requisição de leitura, edição simples ou exclusão lógica executada com êxito.
*   `201 Created`: Novo registro cadastrado com sucesso no banco de dados.
*   `400 Bad Request`: Parâmetros obrigatórios ausentes, mal formatados ou inconsistentes.
*   `401 Unauthorized`: Token JWT ausente ou cabeçalho de autorização em formato inválido.
*   `403 Forbidden`: Token JWT expirado ou nível de acesso do usuário logado insuficiente para a operação.
*   `404 Not Found`: Registro consultado não pôde ser localizado nos bancos de dados ativos.
*   `409 Conflict`: Violação de unicidade (registro duplicado de e-mails, códigos, categorias ou nomes).
*   `500 Internal Server Error`: Falha crítica ou erro de comunicação inesperado na infraestrutura do servidor.

---

## 🧪 Testando a API

Para realizar testes interativos rápidos nos endpoints da API, siga o procedimento abaixo:

1.  **Certifique-se de que a API está em execução**: Execute o comando `npm run dev` na raiz do projeto.
2.  **Abra o seu Cliente HTTP favorito**: Utilize ferramentas de teste de requisições como o **Insomnia** ou **Postman**.
3.  **Importe o ambiente pronto de testes**: O projeto fornece um arquivo empacotado chamado `Arquivos Insomnia.zip` localizado na raiz do diretório. Descompacte-o e efetue a importação do arquivo JSON resultante diretamente no seu cliente HTTP.
4.  **Execute o Login para Autenticação**: Realize uma chamada `POST` para `/usuarios/login` utilizando credenciais padrão do arquivo de carga inicial (`insert.sql`).
5.  **Configure o Token nas Requisições**: Copie o hash retornado na chave `token` e configure-o como `Bearer Token` nas abas de autorização do seu cliente HTTP para as rotas autenticadas.
6.  **Valide as Respostas**: Faça chamadas nos métodos `GET /produtos` ou `GET /categorias` para verificar se as rotas respondem adequadamente com os payloads de dados populados.

---

## 🎯 Próximos Passos

*   **Padronização Geral de Respostas de Erro**: Refatorar os controladores para unificar as chaves de erro retornadas pela API, consolidando todas sob o nome único de `erro` ou `error` para facilitar o tratamento pelo front-end.
*   **Testes Automatizados de Integração**: Implementar suites de testes de ponta a ponta utilizando Jest e Supertest para certificar a estabilidade das lógicas complexas de FEFO e transações do banco.
*   **Renderização Dinâmica com Swagger**: Estruturar e servir a documentação interativa das rotas integrando a biblioteca `swagger-ui-express` que já consta no arquivo `package.json`.
*   **Paginação nas Consultas**: Adicionar limitadores de dados (Pagination por offset/limit) nas rotas de listagens de produtos e movimentações, garantindo alta performance mesmo sob grandes bases de dados.
*   **Validações com Bibliotecas Declarativas**: Integrar ferramentas como Yup ou Joi para automatizar as validações de payloads de entrada de forma elegante e centralizada.

---

## 📄 Licença

Este projeto está licenciado sob a licença **ISC** - consulte o arquivo [LICENSE](file:///z:/TCC/api-tcc-granplus/LICENSE) para mais detalhes.

---
Desenvolvido para o Sistema de Controle de Estoque (Projeto de Conclusão de Curso - TCC GranPlus) por:
*   *Gabriel Andrade*
*   *Alex Zanini*
*   *Guilherme Felipe*
*   *Davi Dutrelo*
*   *Iago Calado*
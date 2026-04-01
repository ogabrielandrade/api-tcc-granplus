const jwt = require("jsonwebtoken");

// Middleware para verificar se o usuário está autenticado
const authenticateToken = (req, res, next) => {
  // Pegar o token do cabeçalho Authorization
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extrai apenas o TOKEN após "Bearer"



  // Se não tem token, negar acesso
  if (!token) {
    return res.status(401).json({
      erro: "Token de acesso requerido",
    });
  }
  // 1. Busca a chave do .env 
  const jwtSecret = process.env.JWT_SECRET;

  // 2. Trava de segurança: impede o login se a chave não existir 
  if (!jwtSecret) {
    console.error("ERRO CRÌTICO no Middleware: Variável JWT_SECRET não configurada no env !");
    return res.status(500).json({
      erro: "Erro interno de configuração do servidor",
    });
  }
  //3. Verificar se o token é válido
  jwt.verify(
    token,
    jwtSecret,
    (err, user) => {
      if (err) {
        return res.status(403).json({
          erro: "Token inválido ou expirado",
        });
      }

      // Se válido, adicionar dados do usuário na requisição
      req.user = user;
      next(); // Continuar para o próximo middleware
    },
  );
};

module.exports = authenticateToken;

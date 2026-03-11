const jwt = require("jsonwebtoken");

// Middleware para verificar se o usuário está autenticado
const authenticateToken = (req, res, next) => {
  // Pegar o token do cabeçalho Authorization
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN



  // Se não tem token, negar acesso
  if (!token) {
    return res.status(401).json({
      erro: "Token de acesso requerido",
    });
  }

  // Verificar se o token é válido
  jwt.verify(
    token,
    process.env.JWT_SECRET || "granplus_fallback_secret",
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

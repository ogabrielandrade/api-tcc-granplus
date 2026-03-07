const jwt = require("jsonwebtoken");

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ erro: "Token de acesso requerido" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "sua_chave_secreta_aqui", (err, user) => {
    if (err) {
      return res.status(403).json({ erro: "Token inválido" });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar se é admin
exports.requireAdmin = (req, res, next) => {
  if (req.user.user_nivel_acesso !== 'admin') {
    return res.status(403).json({ erro: "Acesso negado - Apenas administradores" });
  }
  next();
};
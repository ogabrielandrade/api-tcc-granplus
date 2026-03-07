// Middleware para verificar se o usuário é administrador
const requireAdmin = (req, res, next) => {
  // Este middleware deve vir DEPOIS do authenticateToken
  if (!req.user) {
    return res.status(401).json({ 
      erro: "Usuário não autenticado" 
    });
  }

  if (req.user.user_nivel_acesso !== 'admin') {
    return res.status(403).json({ 
      erro: "Acesso negado - Apenas administradores" 
    });
  }

  next(); // Usuário é admin, pode continuar
};

module.exports = requireAdmin;
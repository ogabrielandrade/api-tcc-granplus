// Middleware para verificar se é o próprio usuário ou administrador
const requireOwnerOrAdmin = (req, res, next) => {
  // Este middleware deve vir DEPOIS do authenticateToken
  if (!req.user) {
    return res.status(401).json({ 
      erro: "Usuário não autenticado" 
    });
  }

  const userId = parseInt(req.params.id);
  const loggedUserId = req.user.user_id;
  const userLevel = req.user.user_nivel_acesso;

  // Permitir se for admin OU se for o próprio usuário
  if (userLevel === 'admin' || userId === loggedUserId) {
    return next();
  }

  res.status(403).json({ 
    erro: "Você só pode acessar seus próprios dados" 
  });
};

module.exports = requireOwnerOrAdmin;
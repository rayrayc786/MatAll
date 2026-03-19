const jwt = require('jsonwebtoken');

const socketAuth = (allowedRoles) => {
  return (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
    
    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }

    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    try {
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || 'supersecretkey_builditquick');
      
      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return next(new Error('Authentication error: Unauthorized role'));
      }
      
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  };
};

module.exports = socketAuth;
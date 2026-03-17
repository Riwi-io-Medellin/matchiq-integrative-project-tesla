import { verifyAccessToken } from '../utils/jwt.js';

export function authenticate(req, res, next) {
  // 1. Intentar leer token de cookie primero
  const tokenFromCookie = req.cookies?.token;
  
  // 2. Si no hay cookie, intentar de Authorization header (compatibilidad)
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : null;

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return res.status(401).json({ 
      code: 'NOT_AUTHENTICATED',
      message: 'Token no proporcionado' 
    });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload; // { id, role }
    next();
  } catch (error) {
    return res.status(401).json({ 
      code: 'INVALID_TOKEN',
      message: 'Token inválido o expirado' 
    });
  }
}
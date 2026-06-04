import jwt from 'jsonwebtoken';

export function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token requis' });
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

export function admin(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Accès refusé' });
    next();
  });
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header) {
    try {
      req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    } catch {}
  }
  next();
}

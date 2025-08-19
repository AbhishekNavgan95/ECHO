import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_COOKIE = process.env.JWT_COOKIE || 'echo_token';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

export function signUserToken(user) {
  const payload = { id: user._id, email: user.email, name: user.name };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function setAuthCookie(res, token) {
  const secure = (process.env.NODE_ENV === 'production');
  res.cookie(JWT_COOKIE, token, {
    httpOnly: true,
    sameSite: secure ? 'none' : 'lax',
    secure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res) {
  const secure = (process.env.NODE_ENV === 'production');
  res.clearCookie(JWT_COOKIE, {
    httpOnly: true,
    sameSite: secure ? 'none' : 'lax',
    secure,
    path: '/',
  });
}

export async function attachUserIfPresent(req, _res, next) {
  try {
    const token = req.cookies?.[JWT_COOKIE] || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
    if (!token) return next();
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
  } catch {}
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  next();
}

export async function verifyGoogleIdToken(idToken) {
  if (!googleClient) throw new Error('Google Sign-In not configured');
  const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  return payload; // contains email, name, picture, sub
}



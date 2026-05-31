import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Extended Request interface to include the decoded user token.
 */
export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

/**
 * Middleware to require a valid Firebase ID Token in the Authorization header.
 * Expected format: Authorization: Bearer <ID_TOKEN>
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized: Missing or malformed authentication token' 
    });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized: Invalid or expired token' 
    });
  }
};

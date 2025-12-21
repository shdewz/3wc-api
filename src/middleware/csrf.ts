import { NextFunction, Request, Response } from 'express';

export const verifyCsrf = (req: Request, res: Response, next: NextFunction) => {
  const header = req.get('X-CSRF-Token');
  const cookie = req.cookies?.csrf_token;
  if (!header || !cookie || header !== cookie) {
    return res.status(403).send('Invalid CSRF token');
  }
  next();
};

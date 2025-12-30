import { NextFunction, Request, Response } from 'express';

export const verifyCsrf = (req: Request, res: Response, next: NextFunction) => {
  console.log(
    'csrf cookie:',
    req.cookies?.csrf_token,
    'header:',
    req.get('X-CSRF-Token'),
    'body:',
    req.body?.csrf_token
  );

  const header = req.get('X-CSRF-Token') || req.get('x-csrf-token');
  const cookie = req.cookies?.csrf_token;
  const bodyToken =
    (req.body && (req.body.csrf_token as string)) ||
    (req.query && (req.query.csrf_token as string));

  const presented = header || bodyToken;

  if (!cookie || !presented || cookie !== presented) {
    return res.status(403).send('Invalid CSRF token');
  }

  next();
};

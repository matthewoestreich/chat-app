import { Request, Response, NextFunction } from "express";

export default function <T>(dbpool: DatabasePool<T>) {
  return function (req: Request<T>, _res: Response, next: NextFunction) {
    try {
      req.databasePool = dbpool;
      next();
    } catch (e) {
      next(e);
    }
  };
}

import { Request, Response, NextFunction } from "express";

// Last line of defense against throwing a raw error back to the client.
export default function (error: Error, _req: Request, res: Response, _next: NextFunction) {
  console.log(error);
  res.render("error", { error: error.message || ":(" });
}

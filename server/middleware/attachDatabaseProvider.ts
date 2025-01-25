import { Express, Request, Response, NextFunction } from "express";

export default function attachDatabaseProvider(app: Express) {
  let databaseProvider: DatabaseProvider | null = null;

  function setDatabaseProvider(provider: DatabaseProvider): void {
    databaseProvider = provider;
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!databaseProvider) {
      console.log("no databaseProvider!");
      res.status(500).send("Database provider is not configured");
      return;
    }
    req.databaseProvider = databaseProvider;
    next();
  });

  return setDatabaseProvider;
}

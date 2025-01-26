/**
 * TLDR; This is a hacky way to dynamically set our DatabaseProvider middleware due to runtime
 * decisions and being unable to add middleware after routes are processed
 *
 *
 * Let me preface this by saying; this is very hacky.
 *
 * Our websocket implementation needs an http server passed to it. So we export our Express, app as well
 * as our websocket impl, into our main entry point file.
 *
 * We attach a DatabaseProvider (database abstraction) to each `req` as `req.databaseProvider`. Selecting
 * said provider happens at runtime based upon env variables.
 *
 * Due to the fact we are importing our Express (~/server/index.ts) app into entry point (~/index.ts),
 * all of our Express middleware and routes are "processed" before we can set the DatabaseProvider.
 *
 * Essentially, we can't set our middleware after routes are processed.
 *
 * This is a hacky way to dynamically set that DatabaseProvider middleware.
 *
 * TODO come up with a better solution.
 *
 * @param app
 * @returns {(provider: DatabaseProvider) => void}
 */

import { Express, Request, Response, NextFunction } from "express";

export type SetDatabaseProviderSignature = (provider: DatabaseProvider) => void;

export default function attachDatabaseProvider(app: Express): SetDatabaseProviderSignature {
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

/*

  V1 Router

*/
import express from "express";
import userRouter from "./user/index.js";
import authRouter from "./auth/index.js";
import { useDatabase } from "./middleware/index.js";

const v1Router = express.Router();

// Attach db to v1Router so any child route has access.
v1Router.use(useDatabase);

// Attach routers
v1Router.use("/auth", authRouter);
v1Router.use("/user", userRouter);

export default v1Router;

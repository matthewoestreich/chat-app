/*
  V1 Router
*/
import express from "express";
import userRouter from "./user/index.js";
import authRouter from "./auth/index.js";

const v1Router = express.Router();

// Attach routers
v1Router.use("/auth", authRouter);
v1Router.use("/user", userRouter);

export default v1Router;

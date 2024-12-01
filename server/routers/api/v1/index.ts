/*
  V1 Router
*/
import express from "express";
import authRouter from "./auth";

const v1Router = express.Router();

// Attach routers
v1Router.use("/auth", authRouter);

export default v1Router;

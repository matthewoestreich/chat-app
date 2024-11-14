/*
  V1 Router
*/
import express from "express";
import userRouter from "./user/index.js";
import authRouter from "./auth/index.js";
import { useJwt } from "#@/server/middleware/index.js";

const v1Router = express.Router();

const jwtMiddleware = useJwt({
  onError: (_req, res) => {
    return res.status(401).send({ ok: false });
  },
});

// Attach routers
v1Router.use("/auth", authRouter);
v1Router.use("/user", [jwtMiddleware], userRouter);

export default v1Router;

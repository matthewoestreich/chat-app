import express from "express";
import userRouter from "./user/userRouter.js";
import { useDatabase } from "./middleware/index.js";

const v1Router = express.Router();

v1Router.use(useDatabase);
v1Router.use("/user", userRouter);

export default v1Router;
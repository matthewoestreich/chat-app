import express from "express";

const router = express.Router();

/**
 * "GET" ROUTES
 */

router.get("/", (req, res) => {
  res.render("v2/index");
});

export default router;
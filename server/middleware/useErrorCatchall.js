// Last line of defense against throwing a raw error back to the client.
export default function (error, req, res, next) {
  console.log(error);
  res.render("error", { error: error.message || ":(" });
}

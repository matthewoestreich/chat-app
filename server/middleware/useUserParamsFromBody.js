/**
 * Pulls the user params from body of request..
 * `const { u, p, ui, e } = req.body`
 * u = username, p = password, ui = userId, e = email
 * @param {string} as : field name where params will be attached. Default is `"user"`.
 * If `as = "userBody"` then you would access these params as `req.userBody.<foo>`.
 * Available fields: (if `as = "userBody"`)
 *   `const { username, password, userId, email } = req.userBody;`
 *
 * @returns {{ username: string, password: string, userId: string, email: string }} : while nothing is
 * technically returned, this is the shape of the object.
 */
export default function (as = "user") {
  return function (req, res, next) {
    const { u, p, e, ui } = req.body;
    if (!p || !e) {
      console.log(`[MIDDLEWARE][useUserParamsFromBody] missing either password (as 'p') or email (as 'e') from body!`, { "req.body": req.body });
      res.status(400).send({ ok: false });
      return;
    }
    req[as] = { username: u, password: p, userId: ui, email: e };
    next();
  };
}

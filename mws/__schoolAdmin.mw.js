module.exports = ({ meta, config, managers }) => {
  return async ({ req, res, next }) => {
    const { role } = req.decoded;

    //check if user exists in db
    const foundUser = await managers.user.getUser({
      username: req.decoded.username,
    });

    if (
      !foundUser ||
      managers.utils.isEmpty(foundUser) ||
      !["school_admin", "super_admin"].includes(role)
    ) {
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        errors: "unauthorized",
      });
    }
    next();
  };
};

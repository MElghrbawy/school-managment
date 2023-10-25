module.exports = ({ meta, config, managers }) => {
  return async ({ req, res, next }) => {
    const { role, username } = req.decoded;

    //check if user exists in db
    const foundUser = await managers.user.findUser({
      username: username,
    });

    if (
      foundUser &&
      !(Object.keys(foundUser).length === 0) &&
      ["school_admin", "super_admin"].includes(role)
    ) {
      return next();
    }

    return managers.responseDispatcher.dispatch(res, {
      ok: false,
      code: 401,
      errors: "unauthorized",
    });
  };
};

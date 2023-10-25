module.exports = ({ meta, config, managers }) => {
  return ({ req, res, next }) => {
    const { role } = req.decoded;
    if (!["school_admin", "super_admin"].includes(role)) {
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        errors: "unauthorized",
      });
    }
    next();
  };
};

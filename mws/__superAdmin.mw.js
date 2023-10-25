module.exports = ({ meta, config, managers }) => {
  return ({ req, res, next }) => {
    const { role } = req.decoded;
    if (role !== "super_admin") {
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        errors: "unauthorized",
      });
    }
    next();
  };
};

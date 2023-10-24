module.exports = ({ meta, config, managers }) => {
  return ({ req, res, next }) => {
    console.log(req.decoded);
    const { role } = req.decoded;
    if (role !== "school_admin") {
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        errors: "unauthorized",
      });
    }
    next();
  };
};

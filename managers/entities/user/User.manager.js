module.exports = class Student {
  constructor({
    utils,
    cache,
    config,
    cortex,
    oyster,
    managers,
    validators,
  } = {}) {
    this.config = config;
    this.cortex = cortex;
    this.validators = validators;
    this.oyster = oyster;
    this.utils = utils;
    this.tokenManager = managers.token;
    this.collection = "user";
    this.httpExposed = [
      "createUser",
      "get=getUser",
      "put=updateUser",
      "delete=removeUser",
    ];
  }

  async createUser(user) {
    // const user = { username, email, password };

    // Data validation
    const validationError = await this.validators.user.createUser(user);

    if (validationError) return validationError;

    // Creation Logic
    const userId = Math.random().toString(36).substr(2);
    const role = "school_admin";
    const newUser = {
      _id: "userId",
      role,
      username,
      email,
      password,
    };

    const savedUser = await this.oyster.call("add_block", {
      // relation: this.collection,
      _label: this.collection,
      ...newUser,
    });

    const longToken = this.tokenManager.genLongToken({
      userId: savedUser._id,
      role: savedUser.role,
    });

    // Response
    return {
      user: savedUser,
      longToken,
    };
  }
  // ----------------------------------------------------------------------------------------------
  async getUser({ userId }) {
    const user = await this.oyster.call("get_block", `user:userId`);
    if (!user || this.utils.isEmpty(user)) return { error: "user not found" };
    return user;
  }
  // ----------------------------------------------------------------------------------------------
  async updateUser({ userId, username, email, password }) {
    const validationError = await this.validators.user.createUser(user);

    if (validationError) return validationError;
    const user = await this.oyster.call("update_block", {
      _id: `${this.collection}:${userId}`,
      username,
    });

    return user;
  }

  // ----------------------------------------------------------------------------------------------

  async removeUser() {
    const user = await this.oyster.call(
      "delete_block",
      `${this.collection}:userId`
    );
    return user;
  }
};

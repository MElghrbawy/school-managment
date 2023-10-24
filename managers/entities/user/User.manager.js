module.exports = class User {
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

  async createUser({ username, email }) {
    const user = { username, email };

    // Data validation
    const validationError = await this.validators.user.createUser(user);

    if (validationError) return validationError;
    // const { username, email } = user;
    // Creation Logic
    const userId = Math.random().toString(36).substr(2);
    const role = "school_admin";
    const newUser = {
      _id: userId,
      role,
      username,
      email,
    };

    const savedUser = await this.oyster.call("add_block", {
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
  async getUser({ __longToken, __schoolAdmin, __query }) {
    const { id } = __query;
    return this.__findUser(id);
  }
  // ----------------------------------------------------------------------------------------------
  async __findUser(id) {
    const user = await this.oyster.call(
      "get_block",
      `${this.collection}:${id}`
    );
    if (!user || this.utils.isEmpty(user)) return { error: "user not found" };
    return user;
  }
  // ----------------------------------------------------------------------------------------------
  async updateUser({ __query, username, email }) {
    //TODO: add validation
    const { id } = __query;
    const user = { username, email };
    // const validationError = await this.validators.user.createUser(user);
    // if (validationError) return validationError;
    // const { userId, ...userData } = user;
    const foundUser = await this.__findUser(id);
    if (foundUser.error) return foundUser;

    const updatedUser = await this.oyster.call("update_block", {
      _id: `${this.collection}:${id}`,
      username: username || foundUser.username,
      email: email || foundUser.email,
    });

    return updatedUser;
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

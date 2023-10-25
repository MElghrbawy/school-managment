module.exports = class School {
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
    this.collection = "school";
    this.httpExposed = [
      "createSchool",
      "get=getSchool",
      "put=updateSchool",
      "delete=removeSchool",
    ];
  }

  async createSchool({ __longToken, __superAdmin, name }) {
    const school = { name };

    // Data validation
    const validationError = await this.validators.school.createSchool(school);

    if (validationError) return validationError;
    // Creation Logic
    const schoolId = Math.random().toString(36).substr(2);
    const newSchool = {
      _id: schoolId,
      name,
    };

    const savedSchool = await this.oyster.call("add_block", {
      _label: this.collection,
      ...newSchool,
    });

    // Response
    return {
      school: savedSchool,
    };
  }
  // ----------------------------------------------------------------------------------------------
  async getSchool({ __longToken, __superAdmin, __query }) {
    const { id } = __query;
    return this._findSchool(id);
  }
  // ----------------------------------------------------------------------------------------------
  async _findSchool(id) {
    const school = await this.oyster.call(
      "get_block",
      `${this.collection}:${id}`
    );
    if (!school || this.utils.isEmpty(school))
      return { error: "school not found" };
    return school;
  }
  // ----------------------------------------------------------------------------------------------
  async updateSchool({ __longToken, __superAdmin, __query, name }) {
    const { id } = __query;
    const school = { name };
    const validationError = await this.validators.school.updateSchool(school);
    if (validationError) return validationError;

    const foundSchool = await this._findSchool(id);
    if (foundSchool.error) return foundSchool;

    const updatedSchool = await this.oyster.call("update_block", {
      _id: `${this.collection}:${id}`,
      name: name || foundSchool.name,
    });

    return updatedSchool;
  }

  // ----------------------------------------------------------------------------------------------

  async removeSchool({ __longToken, __superAdmin, __query }) {
    const { id } = __query;
    const school = await this.oyster.call(
      "delete_block",
      `${this.collection}:${id}`
    );
    if (!school) return { error: "deleting failed" };
    return `school deleted successfully`;
  }
};

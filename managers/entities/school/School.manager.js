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

  async createSchool({ __longToken, __superAdmin, name, schoolAdminId }) {
    const school = { name, schoolAdminId };

    // Data validation
    const validationError = await this.validators.school.createSchool(school);

    if (validationError) return validationError;
    // Creation Logic
    const schoolId = Math.random().toString(36).substr(2);
    const role = "school_admin";
    const newSchool = {
      _id: schoolId,
      schoolAdminId,
      name,
    };

    const savedSchool = await this.oyster.call("add_block", {
      _label: this.collection,
      ...newSchool,
    });

    const longToken = this.tokenManager.genLongToken({
      schoolId: savedSchool._id,
      role: savedSchool.role,
    });

    // Response
    return {
      school: savedSchool,
      longToken,
    };
  }
  // ----------------------------------------------------------------------------------------------
  async getSchool({ __longToken, __superAdmin, __query }) {
    const { id } = __query;
    return this.__findSchool(id);
  }
  // ----------------------------------------------------------------------------------------------
  async __findSchool(id) {
    const school = await this.oyster.call(
      "get_block",
      `${this.collection}:${id}`
    );
    if (!school || this.utils.isEmpty(school))
      return { error: "school not found" };
    return school;
  }
  // ----------------------------------------------------------------------------------------------
  async updateSchool({
    __longToken,
    __superAdmin,
    __query,
    name,
    schoolAdminId,
  }) {
    //TODO: add validation
    const { id } = __query;
    const school = { name, email };
    // const validationError = await this.validators.school.createSchool(school);
    // if (validationError) return validationError;
    // const { schoolId, ...schoolData } = school;
    const foundSchool = await this.__findSchool(id);
    if (foundSchool.error) return foundSchool;

    const updatedSchool = await this.oyster.call("update_block", {
      _id: `${this.collection}:${id}`,
      name: name || foundSchool.name,
      schoolAdminId: schoolAdminId || foundSchool.schoolAdminId,
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
    return school;
  }
};

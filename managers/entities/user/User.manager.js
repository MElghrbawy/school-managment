const { schoolId } = require("../../_common/schema.models");

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
    this.schoolManager = managers.school;
    this.classroomManager = managers.classroom;
    this.collection = "user";
    this.httpExposed = [
      "createSchoolAdmin",
      "createStudent",
      "get=getUser",
      "put=updateUser",
      "delete=removeUser",
    ];
  }

  // ----------------------------------------------------------------------------------------------
  // POST
  async createSchoolAdmin({ __longToken, __superAdmin, username, schoolId }) {
    const user = { username, schoolId };
    const validationError = await this.validators.user.createSchoolAdmin(user);
    if (validationError) return validationError;

    const school = await this.schoolManager.findSchool(schoolId);
    if (school?.error) return school;

    const newUser = {
      role: "school_admin",
      username,
      schoolId,
    };

    //Save user into DB
    const savedUser = await this._createUser(newUser);
    if (!savedUser || this.utils.isEmpty(savedUser))
      return { error: "school admin creation failed" };

    //Generate Token
    const longToken = await this.tokenManager.genLongToken({
      userId: savedUser._id,
      role: savedUser.role,
      schoolId: savedUser.schoolId,
    });

    // Response
    return {
      user: savedUser,
      longToken,
    };
  }
  // POST
  async createStudent({
    __longToken,
    __schoolAdmin,
    username,
    classroomId,
    schoolId,
  }) {
    const user = { username, classroomId };
    const admin = __longToken;
    //if user is a school admin, schoolId is taken from the token payload
    schoolId = admin.schoolId || schoolId;

    // SchoolId is required from superAdmin
    if (!schoolId) return { error: "schoolId is required" };

    const validationError = await this.validators.user.createStudent(user);
    if (validationError) return validationError;

    //check if classRoom exists
    const classRoom = await this.classroomManager.findClassroom(classroomId);
    if (classRoom?.error) return classRoom;
    //check if classRoom belongs to school
    //if it's a school admin, schoolId must match classroom schoolId
    if (schoolId !== classRoom.schoolId)
      return { error: "classroom not found" };

    const newUser = {
      role: "student",
      username,
      classroomId,
      schoolId,
    };

    //Save user into DB
    const savedUser = await this._createUser(newUser);
    if (!savedUser || this.utils.isEmpty(savedUser))
      return { error: "student creation failed" };

    //Generate Token
    const longToken = await this.tokenManager.genLongToken({
      userId: savedUser._id,
      role: savedUser.role,
      classroomId: savedUser.classroomId,
    });

    // Response
    return {
      user: savedUser,
      longToken,
    };
  }

  async _createUser(newUser) {
    const userId = Math.random().toString(36).substring(2);
    const savedUser = await this.oyster.call("add_block", {
      _label: this.collection,
      _id: userId,
      ...newUser,
    });

    return savedUser;
  }

  // ----------------------------------------------------------------------------------------------
  // GET
  async getUser({ __longToken, __schoolAdmin, __query }) {
    const { id } = __query;
    return this._findUser(id);
  }

  async _findUser(id) {
    const user = await this.oyster.call(
      "get_block",
      `${this.collection}:${id}`
    );
    if (!user || this.utils.isEmpty(user)) return { error: "user not found" };
    return user;
  }
  // ----------------------------------------------------------------------------------------------
  // PUT
  async updateUser({ __query, username }) {
    const { id } = __query;
    const user = { username };
    // const validationError = await this.validators.user.createUser(user);
    // if (validationError) return validationError;
    // const { userId, ...userData } = user;
    const foundUser = await this._findUser(id);
    if (foundUser.error) return foundUser;

    const updatedUser = await this.oyster.call("update_block", {
      _id: `${this.collection}:${id}`,
      username: username || foundUser.username,
      email: email || foundUser.email,
    });

    return updatedUser;
  }

  // ----------------------------------------------------------------------------------------------
  // DELETE
  async removeUser() {
    const user = await this.oyster.call(
      "delete_block",
      `${this.collection}:userId`
    );
    return user;
  }
};

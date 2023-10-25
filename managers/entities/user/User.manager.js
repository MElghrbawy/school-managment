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
      "get=getSchoolAdmin",
      "put=updateSchoolAdmin",
      "put=updateStudent",
      "delete=removeSchoolAdmin",
      "delete=removeStudent",
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

  async getSchoolAdmin({ __longToken, __superAdmin, __query }) {
    const { id } = __query;
    const user = await this._getUser(id);
    if (user?.role !== "school_admin") return { error: "user not found" };
    return user;
  }

  async getStudent({ __longToken, __schoolAdmin, __query }) {
    const { id } = __query;
    const user = await this._getUser(id);
    if (user?.role !== "student") return { error: "user not found" };
    return user;
  }

  async _getUser(id) {
    const user = await this.oyster.call(
      "get_block",
      `${this.collection}:${id}`
    );
    if (!user || this.utils.isEmpty(user)) return { error: "user not found" };
    return user;
  }
  // ----------------------------------------------------------------------------------------------
  // PUT
  async updateSchoolAdmin({
    __longToken,
    __superAdmin,
    __query,
    username,
    schoolId,
  }) {
    const { id } = __query;
    const user = { username, schoolId };
    const validationError = await this.validators.user.updateSchoolAdmin(user);
    if (validationError) return validationError;

    const foundUser = await this._getUser(id);
    if (foundUser.error) return foundUser;
    if (foundUser.role !== "school_admin") return { error: "user not found" };

    const updatedUser = await this.oyster.call("update_block", {
      _id: `${this.collection}:${id}`,
      username: username || foundUser.username,
      schoolId: schoolId || foundUser.schoolId,
    });

    return foundUser;
  }

  // PUT
  async updateStudent({
    __longToken,
    __schoolAdmin,
    __query,
    username,
    classroomId,
    schoolId,
  }) {
    const { id } = __query;
    const user = { username, classroomId, schoolId };
    const admin = __longToken;
    const validationError = await this.validators.user.updateStudent(user);
    if (validationError) return validationError;

    const foundUser = await this._getUser(id);
    if (foundUser.error) return foundUser;
    if (foundUser.role !== "student") return { error: "user not found" };

    // if schoolId is provided in body take the id from token in case of school admin, otherwise take from body
    schoolId = admin.schoolId || schoolId;

    if (classroomId) {
      const classRoom = await this.classroomManager.findClassroom(classroomId);
      if (classRoom?.error) return classRoom;

      if (!schoolId && classRoom.schoolId !== foundUser.schoolId)
        return { error: "classroom not in school" };
      if (schoolId && classRoom.schoolId !== schoolId)
        return { error: "classroom not in school" };
    }

    const updatedUser = await this.oyster.call("update_block", {
      _id: `${this.collection}:${id}`,
      username: username || foundUser.username,
      classroomId: classroomId || foundUser.classroomId,
      schoolId: schoolId || foundUser.schoolId,
    });

    return updatedUser;
  }

  // ----------------------------------------------------------------------------------------------
  // DELETE
  async removeSchoolAdmin({ __longToken, __superAdmin, __query }) {
    const { id } = __query;
    const user = await this._getUser(id);
    if (user?.role !== "school_admin") return { error: "user not found" };
    return await this.removeUser(id);
  }

  async removeStudent({ __longToken, __schoolAdmin, __query }) {
    const admin = __longToken;
    const { id } = __query;
    const user = await this._getUser(id);
    if (user?.role !== "student" || admin.schoolId !== user.schoolId)
      return { error: "user not found" };
    return await this.removeUser(id);
  }

  async removeUser() {
    const user = await this.oyster.call(
      "delete_block",
      `${this.collection}:userId`
    );
    return user;
  }
};

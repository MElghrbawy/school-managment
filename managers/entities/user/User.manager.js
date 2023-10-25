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
      "login",
      "get=getSchoolAdmin",
      "get=getStudent",
      "put=updateSchoolAdmin",
      "put=updateStudent",
      "delete=removeSchoolAdmin",
      "delete=removeStudent",
    ];
  }

  //POST

  async login({ username, password }) {
    const user = { username, password };
    const validationError = await this.validators.user.login(user);
    if (validationError) return validationError;

    const foundUser = await this.oyster.call(
      "get_block",
      `${this.collection}:${username}`
    );

    if (!foundUser || this.utils.isEmpty(foundUser))
      return { error: "user not found" };

    if (foundUser.password !== password) return { error: "wrong password" };

    const longToken = await this.tokenManager.genLongToken({
      username: foundUser.username,
      role: foundUser.role,
      schoolId: foundUser.schoolId,
      classroomId: foundUser.classroomId,
    });

    return {
      token: longToken,
    };
  }

  // ----------------------------------------------------------------------------------------------
  // POST
  async createSchoolAdmin({
    __longToken,
    __superAdmin,
    username,
    name,
    password,
    schoolId,
  }) {
    const user = { username, name, password, schoolId };
    const validationError = await this.validators.user.createSchoolAdmin(user);
    if (validationError) return validationError;

    const school = await this.schoolManager.findSchool(schoolId);
    if (school?.error) return school;

    const newUser = {
      role: "school_admin",
      username,
      name,
      password,
      schoolId,
    };

    //Save user into DB
    const savedUser = await this._createUser(newUser);
    if (!savedUser || this.utils.isEmpty(savedUser))
      return { error: "school admin creation failed" };

    //Generate Token
    const longToken = await this.tokenManager.genLongToken({
      username: savedUser.username,
      role: savedUser.role,
      schoolId: savedUser.schoolId,
    });

    // Response
    delete savedUser.password;
    return {
      user: savedUser,
    };
  }
  // POST
  async createStudent({
    __longToken,
    __schoolAdmin,
    username,
    name,
    password,
    classroomId,
    schoolId,
  }) {
    const user = { username, name, password, classroomId };
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
      name,
      password,
      classroomId,
      schoolId,
    };

    //Save user into DB
    const savedUser = await this._createUser(newUser);
    if (!savedUser || this.utils.isEmpty(savedUser))
      return { error: "student creation failed" };

    //Generate Token
    const longToken = await this.tokenManager.genLongToken({
      username: savedUser.username,
      role: savedUser.role,
      classroomId: savedUser.classroomId,
    });

    // Response
    delete savedUser.password;
    return {
      user: savedUser,
    };
  }

  async _createUser(newUser) {
    const savedUser = await this.oyster.call("add_block", {
      _label: this.collection,
      _id: newUser.username,
      ...newUser,
    });

    return savedUser;
  }

  // ----------------------------------------------------------------------------------------------
  // GET

  async getSchoolAdmin({ __longToken, __superAdmin, __query }) {
    const { username } = __query;
    const user = await this.findUser(username);
    if (user?.role !== "school_admin") return { error: "user not found" };

    delete user.password;
    return user;
  }

  async getStudent({ __longToken, __schoolAdmin, __query }) {
    const { username } = __query;
    const user = await this.findUser(username);
    if (user?.role !== "student") return { error: "user not found" };

    delete user.password;
    return user;
  }

  async findUser(id) {
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
    name,
    password,
    schoolId,
  }) {
    const { username } = __query;
    const user = { username, schoolId };
    const validationError = await this.validators.user.updateSchoolAdmin(user);
    if (validationError) return validationError;

    const foundUser = await this.findUser(username);
    if (foundUser.error) return foundUser;
    if (foundUser.role !== "school_admin") return { error: "user not found" };

    const updatedUser = await this.oyster.call("update_block", {
      _id: `${this.collection}:${username}`,
      name: name || foundUser.name,
      password: password || foundUser.password,
      schoolId: schoolId || foundUser.schoolId,
    });

    delete updatedUser.password;
    return updatedUser;
  }

  // PUT
  async updateStudent({
    __longToken,
    __schoolAdmin,
    __query,
    name,
    password,
    classroomId,
    schoolId,
  }) {
    const { username } = __query;
    const user = { username, classroomId, schoolId };
    const admin = __longToken;
    const validationError = await this.validators.user.updateStudent(user);
    if (validationError) return validationError;

    const foundUser = await this.findUser(username);
    if (foundUser.error) return foundUser;
    if (foundUser.role !== "student") return { error: "user not found" };

    // if schoolId is provided in body take the username from token in case of school admin, otherwise take from body
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
      _id: `${this.collection}:${username}`,
      name: name || foundUser.name,
      password: password || foundUser.password,
      classroomId: classroomId || foundUser.classroomId,
      schoolId: schoolId || foundUser.schoolId,
    });

    delete updatedUser.password;
    return updatedUser;
  }

  // ----------------------------------------------------------------------------------------------
  // DELETE
  async removeSchoolAdmin({ __longToken, __superAdmin, __query }) {
    const { username } = __query;
    const user = await this.findUser(username);
    if (user?.role !== "school_admin") return { error: "user not found" };
    return await this._removeUser(username);
  }

  async removeStudent({ __longToken, __schoolAdmin, __query }) {
    const admin = __longToken;
    const { username } = __query;
    const notSuperAdmin = admin.role !== "super_admin";
    const user = await this.findUser(username);
    if (
      user?.role !== "student" ||
      (notSuperAdmin && user.schoolId !== admin.schoolId)
    )
      return { error: "user not found" };
    return await this._removeUser(username);
  }

  async removeUser(username) {
    const user = await this.oyster.call(
      "delete_block",
      `${this.collection}:${username}`
    );
    return "user deleted successfully";
  }
};

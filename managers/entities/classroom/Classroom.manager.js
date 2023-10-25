module.exports = class ClassRoom {
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
    this.schoolManager = managers.school;
    this.tokenManager = managers.token;
    this.collection = "classroom";
    this.httpExposed = [
      "createClassroom",
      "get=getClassroom",
      "put=updateClassroom",
      "delete=removeClassroom",
    ];
  }
  //Post
  async createClassroom({ __longToken, __schoolAdmin, name, schoolId }) {
    const classroom = { name };

    const admin = __longToken;

    //if user is a school admin, schoolId is taken from the token payload
    //if user is a super admin, schoolId is taken from the request body
    schoolId = admin.schoolId || schoolId;

    //check if school exists if superAdmin
    const school = await this.schoolManager.findSchool(schoolId);
    if (school?.error) return school;

    // Data validation
    const validationError = await this.validators.classroom.createClassroom(
      classroom
    );

    if (validationError) return validationError;
    // Creation Logic
    const classroomId = Math.random().toString(36).substring(2);
    const newClassroom = {
      _id: classroomId,
      name,
      schoolId,
    };

    const savedClassroom = await this.oyster.call("add_block", {
      _label: this.collection,
      ...newClassroom,
    });

    // Response
    return {
      classroom: savedClassroom,
    };
  }
  // ----------------------------------------------------------------------------------------------
  // GET
  async getClassroom({ __longToken, __schoolAdmin, __query }) {
    const admin = __longToken;

    const { id } = __query;
    const classRoom = this.findClassroom(id, admin.schoolId);

    return classRoom;
  }
  // ----------------------------------------------------------------------------------------------
  async findClassroom(id, schoolId) {
    const classroom = await this.oyster.call(
      "get_block",
      `${this.collection}:${id}`
    );

    //authorize
    const emptyClassroom = !classroom || this.utils.isEmpty(classroom);
    //if user is a school admin, check if the classroom belongs to the school
    //if user is a super admin, skip this check when schoolId is not provided
    const classroomSchoolAdmin = !schoolId || classroom.schoolId === schoolId;

    if (emptyClassroom || !classroomSchoolAdmin)
      return { error: "classroom not found" };
    return classroom;
  }
  // ----------------------------------------------------------------------------------------------
  async updateClassroom({
    __longToken,
    __schoolAdmin,
    __query,
    name,
    schoolId,
  }) {
    const { id } = __query;
    const classroom = { name };
    const admin = __longToken;
    //Validation
    const validationError = await this.validators.classroom.updateClassroom(
      classroom
    );
    if (validationError) return validationError;

    const foundClassroom = await this.findClassroom(id, admin.schoolId);
    if (foundClassroom.error) return foundClassroom;

    const updatedClassroom = await this.oyster.call("update_block", {
      _id: `${this.collection}:${id}`,
      name: name || foundClassroom.name,
      //schoolAdmin cant change the schoolId
      //superAdmin can change the schoolId (optionally)
      schoolId: admin.schoolId || schoolId || foundClassroom.schoolId,
    });

    return updatedClassroom;
  }

  // ----------------------------------------------------------------------------------------------

  async removeClassroom({ __longToken, __schoolAdmin, __query }) {
    const { id } = __query;

    const admin = __longToken;

    const foundClassroom = await this.findClassroom(id, admin.schoolId);
    if (foundClassroom.error) return foundClassroom;

    const classroom = await this.oyster.call(
      "delete_block",
      `${this.collection}:${id}`
    );
    return classroom;
  }
};

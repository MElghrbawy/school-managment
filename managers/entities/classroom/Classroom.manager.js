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
    this.tokenManager = managers.token;
    this.collection = "classroom";
    this.httpExposed = [
      "createClassroom",
      "get=getClassroom",
      "put=updateClassroom",
      "delete=removeClassroom",
    ];
  }

  async createClassroom({
    __longToken,
    __schoolAdmin,
    name,
    classroomAdminId,
  }) {
    const classroom = { name, classroomAdminId };

    // Data validation
    const validationError = await this.validators.classroom.createClassroom(
      classroom
    );

    if (validationError) return validationError;
    // Creation Logic
    const classroomId = Math.random().toString(36).substring(2);
    const role = "classroom_admin";
    const newClassroom = {
      _id: classroomId,
      classroomAdminId,
      name,
    };

    const savedClassroom = await this.oyster.call("add_block", {
      _label: this.collection,
      ...newClassroom,
    });

    const longToken = this.tokenManager.genLongToken({
      classroomId: savedClassroom._id,
      role: savedClassroom.role,
    });

    // Response
    return {
      classroom: savedClassroom,
      longToken,
    };
  }
  // ----------------------------------------------------------------------------------------------
  async getClassroom({ __longToken, __schoolAdmin, __query }) {
    const { id } = __query;
    return this.__findClassroom(id);
  }
  // ----------------------------------------------------------------------------------------------
  async __findClassroom(id) {
    const classroom = await this.oyster.call(
      "get_block",
      `${this.collection}:${id}`
    );
    if (!classroom || this.utils.isEmpty(classroom))
      return { error: "classroom not found" };
    return classroom;
  }
  // ----------------------------------------------------------------------------------------------
  async updateClassroom({
    __longToken,
    __schoolAdmin,
    __query,
    name,
    classroomAdminId,
  }) {
    //TODO: add validation
    const { id } = __query;
    const classroom = { name, email };
    // const validationError = await this.validators.classroom.createClassroom(classroom);
    // if (validationError) return validationError;
    // const { classroomId, ...classroomData } = classroom;
    const foundClassroom = await this.__findClassroom(id);
    if (foundClassroom.error) return foundClassroom;

    const updatedClassroom = await this.oyster.call("update_block", {
      _id: `${this.collection}:${id}`,
      name: name || foundClassroom.name,
      classroomAdminId: classroomAdminId || foundClassroom.classroomAdminId,
    });

    return updatedClassroom;
  }

  // ----------------------------------------------------------------------------------------------

  async removeClassroom({ __longToken, __schoolAdmin, __query }) {
    const { id } = __query;
    const classroom = await this.oyster.call(
      "delete_block",
      `${this.collection}:${id}`
    );
    return classroom;
  }
};

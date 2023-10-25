module.exports = {
  login: [
    {
      model: "username",
      required: true,
    },
    {
      model: "password",
      required: true,
    },
  ],
  createSchoolAdmin: [
    {
      model: "username",
      required: true,
    },
    {
      model: "password",
      required: true,
    },
    {
      model: "name",
      required: true,
    },
    {
      model: "schoolId",
      required: true,
    },
  ],

  createStudent: [
    {
      model: "username",
      required: true,
    },
    {
      model: "password",
      required: true,
    },
    {
      model: "name",
      required: true,
    },
    {
      model: "classroomId",
      required: true,
    },
    {
      model: "schoolId",
    },
  ],
  updateSchoolAdmin: [
    {
      model: "username",
    },
    {
      model: "password",
    },
    {
      model: "name",
    },

    {
      model: "schoolId",
    },
  ],

  updateStudent: [
    {
      model: "username",
    },
    {
      model: "password",
    },
    {
      model: "name",
    },
    {
      model: "classroomId",
    },
    {
      model: "schoolId",
    },
  ],
};

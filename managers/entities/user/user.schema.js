module.exports = {
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
      model: "fullName",
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
      model: "fullName",
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
      model: "fullName",
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
      model: "fullName",
    },
    {
      model: "classroomId",
    },
    {
      model: "schoolId",
    },
  ],
};

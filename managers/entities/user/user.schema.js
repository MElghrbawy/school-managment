module.exports = {
  createSchoolAdmin: [
    {
      model: "username",
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
      model: "schoolId",
    },
  ],

  updateStudent: [
    {
      model: "username",
    },
    {
      model: "classroomId",
    },
    {
      model: "schoolId",
    },
  ],
};

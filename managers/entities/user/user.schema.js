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
      model: "classRoomId",
      required: true,
    },
  ],
};

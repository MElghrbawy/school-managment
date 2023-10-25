module.exports = {
  createClassroom: [
    {
      model: "name",
      required: true,
    },
    {
      model: "schoolId",
    },
  ],
  updateClassroom: [
    {
      model: "name",
    },
    {
      model: "schoolId",
    },
  ],
};

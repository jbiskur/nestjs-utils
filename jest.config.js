const { getJestProjects } = require("@nrwl/jest");

module.exports = {
  projects: [...getJestProjects(), "<rootDir>/packages/nest-js-test-utilities"],
};

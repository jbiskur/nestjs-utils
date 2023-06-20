const { getJestProjects } = require("@nx/jest");

export default {
  projects: [...getJestProjects(), "<rootDir>/packages/nest-js-test-utilities"],
};

"use strict";

import dotenv from "dotenv";

dotenv.config();

const shared = {
  dialect: process.env.MYSQL_DIALECT || "mysql",
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
};

export default {
  development: {
    ...shared,
    database: process.env.MYSQL_DATABASE || "fitness_tracker",
    username: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
  },
  test: {
    ...shared,
    database: process.env.MYSQL_TEST_DATABASE || "fitness_tracker_test",
    username: process.env.MYSQL_TEST_USER || process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_TEST_PASSWORD || process.env.MYSQL_PASSWORD || "",
  },
  production: {
    use_env_variable: "DATABASE_URL",
    dialect: process.env.MYSQL_DIALECT || "mysql",
    dialectOptions:
      process.env.MYSQL_SSL === "true" ? { ssl: { require: true } } : {},
  },
};

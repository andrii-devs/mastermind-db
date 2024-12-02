import { Dialect } from "sequelize";

/*
interface IMySqlEngine {
  engine: string;
  charset: string;
  collate: string;
}
*/

/*
  export const engine:IMySqlEngine ={
    engine: 'InnoDB',
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  }
*/

interface ISequelizeConfig {
  [key: string]: {
    dialect: Dialect;
    host: string;
    username: string;
    password: string;
    database: string;
    port: number;
  };
}

const config: ISequelizeConfig = {
  development: {
    dialect: "mysql"",
    host: process.env.DB_HOST",
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
  },
  test: {
    dialect: "mysql",
    host: process.env.DB_HOST || "127.0.0.1",
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "vdashboard_test",
    port: Number(process.env.DB_PORT) || 3306,
  },
  production: {
    dialect: "mysql",
    host: process.env.DB_HOST || "127.0.0.1",
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "vdashboard",
    port: Number(process.env.DB_PORT) || 3306,
  },
};

export = config;

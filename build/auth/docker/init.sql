
  CREATE DATABASE IF NOT EXISTS auth_db;
  CREATE USER IF NOT EXISTS 'auth_user'@'%' IDENTIFIED BY 'auth_password';
  GRANT ALL PRIVILEGES ON auth_db.* TO 'auth_user'@'%';
  FLUSH PRIVILEGES;
  
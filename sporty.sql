DROP DATABASE IF EXISTS sporty;
CREATE DATABASE sporty;
\connect sporty

\i sporty-schema.sql
\i sporty-seed.sql
CREATE EXTENSION pg_trgm;

DROP DATABASE IF EXISTS sporty_test;
CREATE DATABASE sporty_test;
\connect sporty_test

\i sporty-schema.sql
CREATE EXTENSION pg_trgm;
const { Knex } = require("knex");

exports.up = async function (knex) {
  await knex.schema.createTable("postmark", (table) => {
    table.uuid("uid").primary();
    table.text("friend");
    table.text("content");
  });
};

exports.down = async function (knex) {
  return knex.schema.dropTable("postmark");
};

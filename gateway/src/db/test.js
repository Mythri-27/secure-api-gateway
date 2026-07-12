const { db } = require("./index.js");
const { users } = require("./schema.js");

async function test() {
    const result = await db.select().from(users);
    console.log(result);
    process.exit();
}

test();
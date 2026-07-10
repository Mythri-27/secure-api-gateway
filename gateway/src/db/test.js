import { db } from "./index.js";
import { users } from "./schema.js";

async function test() {
    const result = await db.select().from(users);

    console.log(result);

    process.exit();
}

test();
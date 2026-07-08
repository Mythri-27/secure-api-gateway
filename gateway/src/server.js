const app = require("./app");
const redisClient=require("./config/redis.js")
const {PORT} =require("./config/env.js") ;


async function startServer(){
    await redisClient.connect();
    app.listen(PORT,()=>{
        console.log(`Gateway running on http://localhost:${PORT}`);
    });
}

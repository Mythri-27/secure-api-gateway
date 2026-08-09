import "dotenv/config";

import app from "./app.js";
const PORT=process.env.PORT||5002;

app.listen(PORT,()=>{
    console.log(`Product Service running on http://localhost:${PORT}`);
});
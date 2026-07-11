import app from "./app.js";

const PORT=5002;

app.listen(PORT,()=>{
    console.log(`Product Service running on http://localhost:${PORT}`);
});
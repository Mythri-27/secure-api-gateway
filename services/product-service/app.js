import express from "express";
import cors from "cors";
import productRoutes from "./routes/product.routes.js";
import { verifyGateway } from "./middleware/verifyGateway.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());
app.use(verifyGateway);

app.use("/products", productRoutes);

export default app;
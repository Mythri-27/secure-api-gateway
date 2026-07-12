import express from "express";
import cors from "cors";
import productRoutes from "./routes/product.routes.js";
import {verifyGateway} from "./middleware/verifyGateway.js";

const app=express();

app.use(cors());
app.use(express.json());
app.use(verifyGateway);

app.use("/products",productRoutes);

export default app;
import { Router } from "express";
import products from "../data/products.js";

const router = Router();

router.get("/", (req, res) => {
    console.log(req.headers["x-user-id"]);
    console.log(req.headers["x-user-role"]);
    res.json(products);
});

router.get("/:id", (req, res) => {

    const product = products.find(
        p => p.id === Number(req.params.id)
    );

    if (!product) {
        return res.status(404).json({
            message: "Product not found"
        });
    }

    res.json(product);
});

export default router;
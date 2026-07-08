const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

dotenv.config();

const app = express();

// Built-in middleware
app.use(express.json());

// Third-party middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Test Route
app.get("/", (req, res) => {
    res.json({
        message: "Secure API Gateway is running 🚀"
    });
});

module.exports = app;
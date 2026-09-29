require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api/auth", authRouter);

module.exports = app;

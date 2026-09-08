import express from "express";
import { authLogin, authRegister } from "./auth.controller.js";

const authRoute = express.Router();

authRoute.post("/register", authRegister);
authRoute.post("/login", authLogin);

export default authRoute;

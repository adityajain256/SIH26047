import express from "express";
import dotenv from "dotenv";
import authRoute from "./authentication/auth.route.js";
import dbConnection from "./db/db.connection.js";
import patientRoute from "./patient/patient.route.js";
dotenv.config();
dbConnection();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/app/users", authRoute);
app.use("/app/patients", patientRoute);

export default app;

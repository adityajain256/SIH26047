import express from "express";
import {
  getAllPatients,
  getPatientById,
  getPatientsByDoctorId,
  registerPatient,
} from "./patient.controller.js";

const patientRoute = express.Router();

patientRoute.get("/", getAllPatients);

patientRoute.get("/:doctorId", getPatientsByDoctorId);

patientRoute.get("/:id", getPatientById);

patientRoute.post("/", registerPatient);

export default patientRoute;

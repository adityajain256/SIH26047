import express from "express";
import crypto from "node:crypto";
import prisma from "../../lib/prisma.js";

export const getAllPatients = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const patients = await prisma.patient.findMany();
    return res.status(200).json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    return res.status(500).json({ message: "Server issue." });
  }
};

export const getPatientsByDoctorId = async (
  req: express.Request,
  res: express.Response,
) => {
  try {
    const doctorId = Number(req.params.doctorId);
    if (!Number.isInteger(doctorId) || doctorId < 1) return res.status(400).json({ message: "A valid doctor ID is required." });
    const patients = await prisma.patient.findMany({ where: { userId: doctorId } });
    return res.status(200).json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    return res.status(500).json({ message: "Server issue." });
  }
};

export const getPatientById = async (
  req: express.Request,
  res: express.Response,
) => {
  const patientId = Number(req.params.id);
  if (!Number.isInteger(patientId) || patientId < 1) return res.status(400).json({ message: "A valid patient ID is required." });
  try {
    const patient = await prisma.patient.findUnique({
      where: {
        id: patientId,
      },
    });
    if (!patient) return res.status(404).json({ message: "Patient not found." });
    return res.status(200).json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    return res.status(500).json({ message: "Server issue." });
  }
};

export const registerPatient = async (
  req: express.Request,
  res: express.Response,
) => {
  const {
    name,
    email,
    phone,
    doctorId,
    DOB,
    adhaarNumber,
    abhaId,
    gender,
    preferredLanguage,
  } = req.body;

  try {
    if (!name || !email || !phone || !DOB || !adhaarNumber || !gender || !preferredLanguage) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const birthDate = new Date(DOB);
    if (Number.isNaN(birthDate.getTime())) return res.status(400).json({ message: "A valid date of birth is required." });
    const assignedDoctorId = doctorId === undefined || doctorId === null || doctorId === "" ? undefined : Number(doctorId);
    if (assignedDoctorId !== undefined && (!Number.isInteger(assignedDoctorId) || assignedDoctorId < 1)) return res.status(400).json({ message: "A valid doctor ID is required." });

    const existingPatient = await prisma.patient.findUnique({ where: { adhaarNumber } });

    if (existingPatient) {
      return res.status(409).json({ message: "Patient already exists." });
    }

    if (assignedDoctorId !== undefined) {
      const doctor = await prisma.user.findUnique({ where: { id: assignedDoctorId } });
      if (!doctor || doctor.role !== "DOCTOR") return res.status(400).json({ message: "The assigned doctor was not found." });
    }

    const newPatient = await prisma.patient.create({
      data: {
        medikioskId: `PT-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phone.trim(),
        DOB: birthDate,
        adhaarNumber,
        ...(abhaId ? { abhaId } : {}),
        gender,
        preferredLanguage,
        ...(assignedDoctorId !== undefined ? { user: { connect: { id: assignedDoctorId } } } : {}),
      },
    });

    return res.status(201).json({
      message: "Patient registered successfully.",
      patient: newPatient,
    });
  } catch (error) {
    console.error("Error registering patient:", error);
    return res.status(500).json({ message: "Server issue." });
  }
};

import express from "express";
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
    const patients = await prisma.patient.findUnique({
      where: {
        userId: doctorId,
      },
    });
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
  try {
    const patient = await prisma.patient.findUnique({
      where: {
        id: patientId,
      },
    });
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
    if (!name || !phone || !doctorId) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingPatient = await prisma.patient.findFirst({
      where: { adhaarNumber: adhaarNumber },
    });

    if (existingPatient) {
      return res.status(409).json({ message: "Patient already exists." });
    }

    const newPatient = await prisma.patient.create({
      data: {
        name,
        email,
        phoneNumber: phone,
        DOB,
        adhaarNumber,
        abhaId,
        gender,
        preferredLanguage,
        user: {
          connect: { id: Number(doctorId) },
        },
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

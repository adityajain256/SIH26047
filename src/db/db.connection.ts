import prisma from "../../lib/prisma.js";

const dbConnection = async () => {
  try {
    await prisma.$connect();
    console.log("Database connection established successfully.");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    throw error;
  }
};

export default dbConnection;

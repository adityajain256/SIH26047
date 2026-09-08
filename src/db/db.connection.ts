import prisma from "../../lib/prisma.js";

const dbConnection = () => {
  try {
    prisma.$connect();
    console.log("Database connection established successfully.");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1); // Exit the process with an error code
  }
};

export default dbConnection;

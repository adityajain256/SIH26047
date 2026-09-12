import app from "./src/app.js";
import dbConnection from "./src/db/db.connection.js";

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const PORT = process.env.PORT || 3000;

async function start() {
  await dbConnection();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

void start().catch(() => {
  process.exitCode = 1;
});

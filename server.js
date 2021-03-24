const dotenv = require("dotenv");

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED EXCEPTION SHUTDOWN..");
  process.exit(1);
});

dotenv.config({ path: "./config.env" });
require("./middleware/middleware");
const app = require("./app");

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`App is running ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION SHUTDOWN..");
  server.close(() => {
    process.exit(1);
  });
});

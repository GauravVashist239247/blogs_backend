const app = require("./app");
const connectDB = require("./database");

require("dotenv").config({
  path: "./env",
});

const port = process.env.PORT || 9000;

connectDB()
  .then(() => {
    app.on("error", () => {
      console.log("DEBUG : ", error);
      throw error;
    });

    app.listen(port, "0.0.0.0", () => {
      console.log("Server is running at port:9000");
    });
  })
  .catch((error) => {
    console.log("DEBUG : Error connecting at Database", error);
  });

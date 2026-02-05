const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const logger = require("./logger");
const { readdirSync } = require("fs");
const passport = require("passport");

dotenv.config();
const app = express();

const PORT = process.env.PORT

app.use(
  morgan("tiny", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

app.use(express.json());
app.use(
  cors({
    origin: true, // หรือจะใช้ "*" ถ้าไม่ใช้ credentials
    credentials: true,
  })
);
app.use(passport.initialize());

readdirSync("./routes").map((item) =>
  app.use("/api", require("./routes/" + item))
);

app.get("/", (req, res) => {
  console.log("Hello backend");
  res.send("<a href='/api/auth/google'>Login with Google</a>");
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

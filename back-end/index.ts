import { config } from "dotenv";
import cors from "cors";
import express from "express";
import eventHandlers from "./eventHandlers/eventsHandlers";
import { wakeUpServer } from "./wakeUpServer";
const initializeServer = require("socket.io");

config();
const app = express();
app.use(cors({ origin: "*" }));

const baseURL = process.env.BASE_URL;
if (!baseURL) throw new Error("BASE_URL is not defined in .env file");
wakeUpServer(baseURL);

const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});

const io = initializeServer(server, {
  cors: {
    origin: "*",
  },
});

eventHandlers(io);

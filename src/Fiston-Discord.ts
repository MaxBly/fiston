import dotenv from "dotenv";
dotenv.config();

import FistonDjs from "./lib/djs/Main"
const discordbot = new FistonDjs(process.env.DJS_TOKEN);

process.on("unhandledRejection", error => {
    console.error("Unhandled promise rejection:", error);
});



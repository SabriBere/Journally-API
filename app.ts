import express from "express";
import apiApp from "./src/app";

const app = express();

app.use(apiApp);

export default app;

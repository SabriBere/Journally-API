import express from "express";
import apiApp from "./api/app";

const app = express();

app.use(apiApp);

export default app;

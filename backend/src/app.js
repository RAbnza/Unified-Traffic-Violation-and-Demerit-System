import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
import testRoute from "./routes/test.route.js";
app.use("/api/test", testRoute);

export default app;

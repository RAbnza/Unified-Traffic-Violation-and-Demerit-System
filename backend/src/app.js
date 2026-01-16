import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
import testRoute from "./routes/test.route.js";
app.use("/api/test", testRoute);

// New routes for core resources
import usersRoute from "./routes/users.route.js";
import rolesRoute from "./routes/roles.route.js";
import lguRoute from "./routes/lgu.route.js";
import ticketsRoute from "./routes/tickets.route.js";
import paymentsRoute from "./routes/payments.route.js";
import violationsRoute from "./routes/violations.route.js";
import auditRoute from "./routes/audit.route.js";
import systemRoute from "./routes/system.route.js";
import authRoute from "./routes/auth.route.js";
import officerAssignmentsRoute from "./routes/officerAssignments.route.js";
import reportsRoute from "./routes/reports.route.js";
import backupRoute from "./routes/backup.route.js";
import driversRoute from "./routes/drivers.route.js";
import vehiclesRoute from "./routes/vehicles.route.js";

app.use("/api/users", usersRoute);
app.use("/api/roles", rolesRoute);
app.use("/api/lgu", lguRoute);
app.use("/api/tickets", ticketsRoute);
app.use("/api/payments", paymentsRoute);
app.use("/api/violations", violationsRoute);
app.use("/api/audit", auditRoute);
app.use("/api/system", systemRoute);
app.use("/api/auth", authRoute);
app.use("/api/assignments", officerAssignmentsRoute);
app.use("/api/reports", reportsRoute);
app.use("/api/backup", backupRoute);
app.use("/api/drivers", driversRoute);
app.use("/api/vehicles", vehiclesRoute);

// Duplicate import removed

export default app;

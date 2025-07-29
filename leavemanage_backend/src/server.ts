import express from "express";
import authRoutes from "./routes/authRoutes";
import superAdminRoutes from "./routes/superAdminRoutes"
import formRoutes from "./routes/formLeaveRoutes"
import dashBoardRoutes from "./routes/dashBoardRoutes"

const app = express();
const port = process.env.PORT;

var cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/form", formRoutes);
app.use("/api/dashboard",dashBoardRoutes );

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

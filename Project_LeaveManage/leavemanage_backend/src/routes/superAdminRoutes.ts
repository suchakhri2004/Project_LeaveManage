import { Router } from "express";
import { createUserAndAdmin,updateStatusMaster } from "../controllers/superAdminController";
import { AllRoles,RoleEmployee,RoleApprove, RoleSuperAdmin } from "../authen/authMiddleware";

const router = Router();

router.post("/createUserAndAdmin",RoleSuperAdmin,createUserAndAdmin);
router.put("/updateStatusMaster/:id",RoleSuperAdmin,updateStatusMaster);

export default router;

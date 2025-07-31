import { Router } from "express";
import { createUserAndAdmin,updateStatusMaster,countusers,searchUsers,getValueAffiliation,getValuePosition,editUser,editLeaveDay,leaveBalanceByID } from "../controllers/superAdminController";
import { AllRoles,RoleEmployee,RoleApprove, RoleSuperAdmin } from "../authen/authMiddleware";

const router = Router();

router.post("/createUserAndAdmin",RoleSuperAdmin,createUserAndAdmin);
router.put("/updateStatusMaster/:id",RoleSuperAdmin,updateStatusMaster);
router.get("/countusers",RoleSuperAdmin,countusers);
router.get("/searchUsers", RoleSuperAdmin, searchUsers);
router.get("/getValueAffiliation", RoleSuperAdmin, getValueAffiliation);
router.get("/getValuePosition", RoleSuperAdmin, getValuePosition);
router.post("/editUser/:id",RoleSuperAdmin,editUser);
router.get("/leaveBalanceByID/:id",RoleSuperAdmin,leaveBalanceByID);
router.put("/editLeaveDay/:id",RoleSuperAdmin,editLeaveDay);


export default router;

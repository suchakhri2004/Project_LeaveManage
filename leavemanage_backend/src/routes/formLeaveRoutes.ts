import { Router } from "express";
import { leaveRequest,acceptHr,opinionsOnly,approveLeaveRequest,getValueLeaveType,getAllUsers } from '../controllers/formLeaveController'
import { AllRoles,RoleEmployee,RoleApprove, RoleSuperAdmin } from "../authen/authMiddleware";


const router = Router();

router.post("/leaveRequest", AllRoles, leaveRequest);
router.put("/acceptHr/:id",RoleApprove,acceptHr);
router.post("/opinionsOnly/:id",RoleApprove,opinionsOnly);
router.post("/approveLeaveRequest/:id",RoleApprove,approveLeaveRequest);
router.get("/getValueLeaveType",AllRoles,getValueLeaveType);
router.get("/getAllUsers",AllRoles,getAllUsers);

export default router;

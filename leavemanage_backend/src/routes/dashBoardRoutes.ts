import { Router } from "express";
import { leaveBalance,getProfile,leaveHistory,leaveData,viewLeaveRequest,viewLeaveRequestById,getProfileById,leaveBalanceById,getIndividualLeaveStats,getWeeklyLeaveStats,getMonthlyLeaveStats,getYearlyLeaveStats } from "../controllers/dashBoardController";
import { AllRoles,RoleEmployee,RoleApprove, RoleSuperAdmin } from "../authen/authMiddleware";

const router = Router();

router.get("/leaveBalance",AllRoles,leaveBalance);
router.get("/leaveBalanceById/:id",AllRoles,leaveBalanceById);
router.get("/getProfile",AllRoles,getProfile);
router.get("/getProfileById/:id",AllRoles,getProfileById);
router.get("/leaveHistory",AllRoles,leaveHistory);
router.get("/leaveData/:id",AllRoles,leaveData);
router.get("/viewLeaveRequest",RoleApprove,viewLeaveRequest);
router.get("/viewLeaveRequestById/:id",RoleApprove,viewLeaveRequestById);
router.get('/individual/:id', getIndividualLeaveStats);
router.get('/weekly', getWeeklyLeaveStats);
router.post('/monthly', getMonthlyLeaveStats);
router.get('/yearly', getYearlyLeaveStats);

export default router;

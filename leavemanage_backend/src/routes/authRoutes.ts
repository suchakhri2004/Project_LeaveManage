import { Router } from "express";
import { forgot_password, login , verifyOtp ,resetPassword } from "../controllers/authController";

const router = Router();

router.post("/login",login);
router.post("/forgot_password", forgot_password)
router.post("/verifyOtp", verifyOtp)
router.post("/resetPassword", resetPassword)

export default router;

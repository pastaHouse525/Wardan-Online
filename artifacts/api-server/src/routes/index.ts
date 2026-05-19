import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import listingsRouter from "./listings";
import appointmentsRouter from "./appointments";
import searchRouter from "./search";
import adminRouter from "./admin";
import authRouter from "./auth";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(categoriesRouter);
router.use(listingsRouter);
router.use(appointmentsRouter);
router.use(searchRouter);
router.use(adminRouter);
router.use(uploadRouter);

export default router;

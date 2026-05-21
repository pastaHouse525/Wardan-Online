import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import listingsRouter from "./listings";
import appointmentsRouter from "./appointments";
import searchRouter from "./search";
import adminRouter from "./admin";
import authRouter from "./auth";
import uploadRouter from "./upload";
import storageRouter from "./storage";
import sitemapRouter from "./sitemap";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(categoriesRouter);
router.use(listingsRouter);
router.use(appointmentsRouter);
router.use(searchRouter);
router.use(adminRouter);
router.use(uploadRouter);
router.use(storageRouter);
router.use(sitemapRouter);

export default router;

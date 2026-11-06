import { Router, type IRouter } from "express";
import healthRouter from "./health";
import memberProfilesRouter from "./member-profiles";

const router: IRouter = Router();

router.use(healthRouter);
router.use(memberProfilesRouter);

export default router;

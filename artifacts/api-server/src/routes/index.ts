import { Router, type IRouter } from "express";
import healthRouter from "./health";
import memberProfilesRouter from "./member-profiles";
import membersRouter from "./members";

const router: IRouter = Router();

router.use(healthRouter);
router.use(memberProfilesRouter);
router.use(membersRouter);

export default router;

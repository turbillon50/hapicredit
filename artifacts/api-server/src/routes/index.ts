import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import clientsRouter from "./clients";
import creditsRouter from "./credits";
import paymentsRouter from "./payments";
import commitmentsRouter from "./commitments";
import notesRouter from "./notes";
import cajaRouter from "./caja";
import alertsRouter from "./alerts";
import dashboardRouter from "./dashboard";
import publicRouter from "./public";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(clientsRouter);
router.use(creditsRouter);
router.use(paymentsRouter);
router.use(commitmentsRouter);
router.use(notesRouter);
router.use(cajaRouter);
router.use(alertsRouter);
router.use(dashboardRouter);
router.use(publicRouter);

export default router;

import { Router, type IRouter } from "express";
import { isDemoModeEnabled, DEMO_USERS } from "../middlewares/auth";

const router: IRouter = Router();

// Demo-mode session bootstrap. Disabled by default; only mounted/responsive
// when DEMO_MODE_ENABLED=true so production deployments never hand out these
// tokens. The endpoint exists so the frontend's "Probar como [rol]" buttons
// have a legitimate place to ask the server for a demo session token
// instead of forging tokens on the client side.
router.get("/demo/status", (_req, res) => {
  res.json({ enabled: isDemoModeEnabled() });
});

router.post("/demo/login", (req, res) => {
  if (!isDemoModeEnabled()) {
    res.status(404).json({ error: "Demo mode is disabled in this environment" });
    return;
  }
  const role = String(req.body?.role ?? "client");
  const token = `demo-token-${role}`;
  const user = DEMO_USERS[token];
  if (!user) {
    res.status(400).json({ error: "Unknown demo role. Use 'admin' | 'executive' | 'client'." });
    return;
  }
  res.json({
    token,
    user: {
      id: user.id,
      username: `demo_${role}`,
      fullName: user.fullName,
      email: `${role}@demo.crede-ti.info`,
      role: user.role,
      treeId: user.treeId,
    },
  });
});

export default router;

import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export default function UpdatePrompt() {
  const { updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Fuerza chequeo inmediato y cada 20 segundos
        r.update();
        setInterval(() => r.update(), 20_000);
      }
    },
    onNeedRefresh() {
      // Auto-actualiza sin preguntar
      updateServiceWorker(true);
    },
  });

  useEffect(() => {
    // Recarga la página cuando el nuevo SW toma control
    const reload = () => window.location.reload();
    navigator.serviceWorker?.addEventListener("controllerchange", reload);
    return () => navigator.serviceWorker?.removeEventListener("controllerchange", reload);
  }, []);

  return null;
}

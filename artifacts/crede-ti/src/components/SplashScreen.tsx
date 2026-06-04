import { useEffect, useState } from "react";
import logoImg from "@assets/logo-credeti-square.jpeg";

const CSS = `
@keyframes splashScale {
  from { opacity: 0; transform: scale(0.5) translateY(10px); }
  to   { opacity: 1; transform: scale(1)   translateY(0); }
}
@keyframes splashUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes splashDot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
  40%            { transform: scale(1);   opacity: 1; }
}
@keyframes splashGlow {
  0%, 100% { transform: scale(1);   opacity: 0.5; }
  50%       { transform: scale(1.15); opacity: 0.8; }
}
`;

interface Props { onDone: () => void }

export function SplashScreen({ onDone }: Props) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1900);
    const t2 = setTimeout(onDone, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <>
      <style>{CSS}</style>
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "linear-gradient(150deg, #06143B 0%, #215DFF 55%, #19D7D7 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 0,
          opacity: fading ? 0 : 1,
          transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {/* Glow orbs */}
        <div style={{
          position: "absolute", top: "8%", right: "-8%",
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(25,215,215,0.28) 0%, transparent 70%)",
          animation: "splashGlow 4s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "12%", left: "-10%",
          width: 250, height: 250, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(58,0,200,0.4) 0%, transparent 70%)",
          animation: "splashGlow 4s 1.5s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", top: "45%", left: "60%",
          width: 140, height: 140, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(33,93,255,0.3) 0%, transparent 70%)",
          animation: "splashGlow 3s 0.5s ease-in-out infinite",
        }} />

        {/* Logo */}
        <div style={{
          animation: "splashScale 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          opacity: 0,
        }}>
          <div style={{
            width: 96, height: 96, borderRadius: 28,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1.5px rgba(255,255,255,0.15), 0 0 40px rgba(25,215,215,0.3)",
            background: "rgba(255,255,255,0.06)",
          }}>
            <img
              src={logoImg}
              alt="credeti"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          </div>
        </div>

        {/* Brand name */}
        <div style={{
          animation: "splashUp 0.65s 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards",
          opacity: 0, marginTop: 28, textAlign: "center",
        }}>
          <div style={{
            fontSize: 40, fontWeight: 900, color: "#fff",
            letterSpacing: "-0.07em",
            fontFamily: "Montserrat, sans-serif",
            lineHeight: 1,
          }}>
            crede<span style={{ color: "#19D7D7" }}>ti</span>
          </div>
          <div style={{
            fontSize: 12, color: "rgba(255,255,255,0.4)",
            marginTop: 8, letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontFamily: "Inter, sans-serif", fontWeight: 500,
          }}>
            Crédito para ti
          </div>
        </div>

        {/* Dots loader */}
        <div style={{
          animation: "splashUp 0.5s 0.55s ease forwards",
          opacity: 0, marginTop: 56,
          display: "flex", gap: 9, alignItems: "center",
        }}>
          {[0, 0.18, 0.36].map((d, i) => (
            <div
              key={i}
              style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "rgba(255,255,255,0.55)",
                animation: `splashDot 1.3s ${d}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

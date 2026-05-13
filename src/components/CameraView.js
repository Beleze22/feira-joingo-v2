import React, { useState } from "react";
import { useFaceCamera } from "../hooks/useFaceCamera";

export function CameraView({ onCapture, onError }) {
  const {
    videoRef,
    canvasRef,
    captureRef,
    faceDetected,
    streamReady,
    modelsReady,
    modelStatus,
    cameraError,
    capture,
  } = useFaceCamera();
  const [capturing, setCapturing] = useState(false);

  async function handleCapture() {
    setCapturing(true);
    try {
      const result = await capture();
      onCapture(result);
    } catch (err) {
      onError(err.message);
    } finally {
      setCapturing(false);
    }
  }

  if (cameraError) {
    return (
      <div
        className="status-box status-error"
        style={{ padding: "24px 16px", textAlign: "center", lineHeight: 1.7 }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>📷</div>
        <strong style={{ display: "block", marginBottom: 8 }}>
          Câmera não disponível
        </strong>
        <span style={{ fontSize: 13 }}>{cameraError}</span>
        {/Ajustes/.test(cameraError) && (
          <p style={{ fontSize: 12, marginTop: 12, opacity: 0.7 }}>
            No iPad: Ajustes → Safari → Câmera → Permitir
          </p>
        )}
      </div>
    );
  }

  const ready = streamReady && faceDetected && !capturing;

  return (
    <>
      <div className="camera-wrap">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ WebkitPlaysinline: true }} /* workaround iOS antigo */
        />
        <canvas ref={canvasRef} />
        <canvas ref={captureRef} style={{ display: "none" }} />
        <div className="face-badge">
          <div className={`face-dot${faceDetected ? " on" : ""}`} />
          {faceDetected ? "Rosto detectado" : "Aguardando rosto"}
        </div>
      </div>

      <div
        className={`status-box ${faceDetected ? "status-ready" : modelsReady ? "status-idle" : "status-loading"}`}
      >
        {!modelsReady
          ? `⏳ ${modelStatus}`
          : faceDetected
            ? "✅ Rosto detectado! Clique para verificar."
            : "🔍 Centralize seu rosto na câmera..."}
      </div>

      <button
        className="btn btn-primary"
        disabled={!ready}
        onClick={handleCapture}
      >
        {capturing ? "⏳ Processando..." : "📸 Tirar Foto e Verificar"}
      </button>
    </>
  );
}

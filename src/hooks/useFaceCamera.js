import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";
const DETECTION_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 224,
  scoreThreshold: 0.5,
});

let modelsLoaded = false;

const IS_IOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

async function ensureModels(onStatus) {
  if (modelsLoaded) return;
  onStatus("Carregando detector facial...");
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  onStatus("Carregando marcos faciais...");
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
  onStatus("Carregando reconhecimento...");
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  modelsLoaded = true;
}

// Fallback progressivo para Safari/iOS
async function requestCamera() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "user" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  } catch (_) {}
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
  } catch (_) {}
  return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
}

export function useFaceCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureRef = useRef(null);
  const intervalRef = useRef(null);

  const [modelStatus, setModelStatus] = useState("Iniciando...");
  const [modelsReady, setModelsReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await ensureModels(setModelStatus);
        if (cancelled) return;
        setModelsReady(true);
        setModelStatus("Iniciando câmera...");

        const stream = await requestCamera();
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const video = videoRef.current;
        video.srcObject = stream;
        // iOS Safari exige atributos via JS além do JSX
        video.setAttribute("autoplay", "");
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");
        video.muted = true;

        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
          setTimeout(resolve, 3000); // timeout de segurança para iOS
        });
        if (cancelled) return;

        try {
          await video.play();
        } catch (_) {}

        setStreamReady(true);
        setModelStatus("Pronto");
        startLoop();
      } catch (err) {
        const msg =
          err.name === "NotAllowedError"
            ? "Permissão de câmera negada. No iPad: Ajustes → Safari → Câmera → Permitir."
            : err.name === "NotFoundError"
              ? "Nenhuma câmera encontrada."
              : "Erro ao iniciar câmera: " + err.message;
        setModelStatus(msg);
        setCameraError(msg);
      }
    }

    function startLoop() {
      intervalRef.current = setInterval(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !video.videoWidth) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const det = await faceapi.detectSingleFace(video, DETECTION_OPTIONS);
        if (cancelled) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (det) {
          setFaceDetected(true);
          const { x, y, width, height } = det.box;
          // const mx = canvas.width - x - width; // espelha o box
          // Retângulo principal
          ctx.strokeStyle = "#7c3aed";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
          // Cantos decorativos
          const len = 18;
          ctx.strokeStyle = "#a78bfa";
          ctx.lineWidth = 3;
          [
            [x, y, 1, 1],
            [x + width, y, -1, 1],
            [x, y + height, 1, -1],
            [x + width, y + height, -1, -1],
          ].forEach(([cx, cy, dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(cx + dx * len, cy);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx, cy + dy * len);
            ctx.stroke();
          });
        } else {
          setFaceDetected(false);
        }
      }, 350);
    }

    init();
    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) throw new Error("Câmera não pronta");

    // Canvas em resolução original para extração precisa do descritor
    const canvas = captureRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -video.videoWidth, 0);
    ctx.restore();

    const det = await faceapi
      .detectSingleFace(canvas, DETECTION_OPTIONS)
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!det) throw new Error("Nenhum rosto detectado. Tente novamente.");

    // Redimensiona para ~40KB antes de salvar no Storage
    const MAX = 400;
    const scale = Math.min(MAX / canvas.width, MAX / canvas.height, 1);
    const resized = document.createElement("canvas");
    resized.width = Math.round(canvas.width * scale);
    resized.height = Math.round(canvas.height * scale);
    resized
      .getContext("2d")
      .drawImage(canvas, 0, 0, resized.width, resized.height);
    const photoDataUrl = resized.toDataURL("image/jpeg", 0.75);

    return { descriptor: det.descriptor, photoDataUrl };
  }, []);

  return {
    videoRef,
    canvasRef,
    captureRef,
    modelStatus,
    modelsReady,
    faceDetected,
    streamReady,
    cameraError,
    capture,
  };
}

import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "/models";
const DETECTION_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 224,
  scoreThreshold: 0.4,
});

let modelsLoaded = false;

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

export function useFaceCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureRef = useRef(null);
  const intervalRef = useRef(null);

  // Passo 1: Criamos uma nova referência para guardar a conexão da câmera
  const streamRef = useRef(null);

  const [modelStatus, setModelStatus] = useState("Iniciando...");
  const [modelsReady, setModelsReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [streamReady, setStreamReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await ensureModels(setModelStatus);
        if (cancelled) return;
        setModelsReady(true);
        setModelStatus("Iniciando câmera...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // Passo 2: Guardamos a conexão da câmera recém-criada na nossa variável segura
        streamRef.current = stream;

        const video = videoRef.current;
        video.srcObject = stream;
        await new Promise((r) => {
          video.onloadedmetadata = r;
        });
        if (cancelled) return;
        await video.play();
        setStreamReady(true);
        setModelStatus("Pronto");
        startLoop();
      } catch (err) {
        setModelStatus("Erro: " + err.message);
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
          // const mx = canvas.width - x - width;
          ctx.strokeStyle = "#7c3aed";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.rect(x, y, width, height);
          ctx.stroke();

          const len = 16;
          ctx.strokeStyle = "#a78bfa";
          ctx.lineWidth = 3;
          [
            [x, y],
            [x + width, y],
            [x, y + height],
            [x + width, y + height],
          ].forEach(([cx, cy], i) => {
            ctx.beginPath();
            ctx.moveTo(cx + (i % 2 === 0 ? len : -len), cy);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx, cy + (i < 2 ? len : -len));
            ctx.stroke();
          });
        } else {
          setFaceDetected(false);
        }
      }, 200);
    }

    init();

    // Este bloco é executado sempre que o componente CameraView é desmontado/escondido
    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);

      // Passo 3: Usamos nossa variável segura para parar a câmera, caso ela exista
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) throw new Error("Câmera não pronta");

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

    if (!det)
      throw new Error("Nenhum rosto detectado na foto. Tente novamente.");

    const MAX_WIDTH = 400;
    const MAX_HEIGHT = 400;
    const scale = Math.min(
      MAX_WIDTH / canvas.width,
      MAX_HEIGHT / canvas.height,
      1,
    );
    const resized = document.createElement("canvas");
    resized.width = Math.round(canvas.width * scale);
    resized.height = Math.round(canvas.height * scale);
    resized
      .getContext("2d")
      .drawImage(canvas, 0, 0, resized.width, resized.height);

    const photoDataUrl = resized.toDataURL("image/jpeg", 0.75);

    return { descriptor: det.descriptor, photoDataUrl };
  }, []);

  const compareDescriptors = useCallback((a, b) => {
    return faceapi.euclideanDistance(a, b);
  }, []);

  return {
    videoRef,
    canvasRef,
    captureRef,
    modelStatus,
    modelsReady,
    faceDetected,
    streamReady,
    capture,
    compareDescriptors,
  };
}

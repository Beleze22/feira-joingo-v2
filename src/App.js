import React, { useState, useCallback } from "react";
import "./styles.css";
import { CameraView } from "./components/CameraView";
import { DuplicateScreen } from "./components/DuplicateScreen";
import { RegisterForm } from "./components/RegisterForm";
import { ParticipantsTab } from "./components/ParticipantsTab";
import {
  checkDescriptor,
  registerParticipant,
  addParticipation,
} from "./services/db";
import logoEmpresa from "./assets/joingo-principal-01.png";

const S = {
  CAMERA: "camera",
  CHECKING: "checking",
  DUPLICATE: "duplicate",
  FORM: "form",
  SUCCESS: "success",
  ALREADY: "already",
};

export default function App() {
  const [tab, setTab] = useState("camera");
  const [screen, setScreen] = useState(S.CAMERA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [lastRegistered, setLastRegistered] = useState(null);

  const handleCapture = useCallback(async ({ descriptor, photoDataUrl }) => {
    setCapturedPhoto(photoDataUrl);
    setCapturedDescriptor(descriptor);
    setScreen(S.CHECKING);
    setError(null);
    try {
      const result = await checkDescriptor(descriptor);
      result.match
        ? (setMatchData(result), setScreen(S.DUPLICATE))
        : setScreen(S.FORM);
    } catch (err) {
      setError("Erro ao verificar participante: " + err.message);
      setScreen(S.CAMERA);
    }
  }, []);

  const handleConfirmDuplicate = useCallback(async () => {
    if (matchData?.participant?.id) {
      try {
        await addParticipation(matchData.participant.id);
      } catch (_) {}
    }
    setScreen(S.ALREADY);
  }, [matchData]);

  const handleFalsePositive = useCallback(() => {
    setMatchData(null);
    setScreen(S.FORM);
  }, []);

  const handleFormSubmit = useCallback(
    async (formValues) => {
      setLoading(true);
      try {
        const data = await registerParticipant({
          formValues,
          photoDataUrl: capturedPhoto,
          descriptor: capturedDescriptor,
        });
        setLastRegistered(data);
        setScreen(S.SUCCESS);
      } catch (err) {
        alert("Erro ao cadastrar: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [capturedPhoto, capturedDescriptor],
  );

  function reset() {
    setCapturedPhoto(null);
    setCapturedDescriptor(null);
    setMatchData(null);
    setLastRegistered(null);
    setError(null);
    setScreen(S.CAMERA);
  }

  return (
    <div className="app-wrapper">
      <div className="app-header">
        <img src={logoEmpresa} className="logo"></img>
        <p className="subtitle">
          Brincadeira da Feira · Sistema de Participação
        </p>
      </div>

      <div className="tab-bar">
        <button
          className={`tab-btn${tab === "camera" ? " active" : ""}`}
          onClick={() => setTab("camera")}
        >
          📷 Verificar
        </button>
        <button
          className={`tab-btn${tab === "participants" ? " active" : ""}`}
          onClick={() => setTab("participants")}
        >
          👥 Participantes
        </button>
      </div>

      {tab === "camera" && (
        <>
          {error && <div className="status-box status-error">❌ {error}</div>}

          {screen === S.CAMERA && (
            <CameraView onCapture={handleCapture} onError={setError} />
          )}

          {screen === S.CHECKING && (
            <div className="inline-loading">
              <div className="spinner" />
              <p>Verificando participação...</p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 6,
                }}
              >
                Comparando com participantes cadastrados
              </p>
            </div>
          )}

          {screen === S.DUPLICATE && matchData && (
            <DuplicateScreen
              match={matchData}
              newPhotoUrl={capturedPhoto}
              onConfirm={handleConfirmDuplicate}
              onFalsePositive={handleFalsePositive}
            />
          )}

          {screen === S.FORM && (
            <RegisterForm
              photoUrl={capturedPhoto}
              onSubmit={handleFormSubmit}
              onBack={reset}
              loading={loading}
            />
          )}

          {screen === S.SUCCESS && (
            <>
              <div
                className="alert alert-success"
                style={{ textAlign: "center", padding: "32px 20px" }}
              >
                <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
                <div className="alert-title" style={{ fontSize: 22 }}>
                  Cadastrado com sucesso!
                </div>
                <p style={{ marginTop: 8 }}>
                  Olá, <strong>{lastRegistered?.nome}</strong>!<br />
                  Você está participando da brincadeira.
                  <br />
                  <strong>Boa sorte com o brinde! 🎁</strong>
                </p>
              </div>
              <button className="btn btn-primary" onClick={reset}>
                Próximo participante
              </button>
            </>
          )}

          {screen === S.ALREADY && (
            <>
              <div
                className="alert alert-warning"
                style={{ textAlign: "center", padding: "32px 20px" }}
              >
                <div style={{ fontSize: 52, marginBottom: 12 }}>🚫</div>
                <div className="alert-title" style={{ fontSize: 22 }}>
                  Já participou!
                </div>
                <p style={{ marginTop: 8 }}>
                  <strong>
                    {matchData?.participant?.nome || "Esta pessoa"}
                  </strong>{" "}
                  já recebeu o brinde na primeira participação.
                  <br />
                  <br />
                  Pode jogar novamente, mas o brinde não se repete!
                </p>
              </div>
              <button className="btn btn-primary" onClick={reset}>
                Próximo participante
              </button>
            </>
          )}
        </>
      )}

      {tab === "participants" && <ParticipantsTab />}
    </div>
  );
}

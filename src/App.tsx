import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  HelpCircle,
  Info,
  RotateCcw,
  Share2,
  UserRound,
} from "lucide-react";
import "./styles.css";
import {
  metricColors,
  metricLabels,
  scenarios,
  type Choice,
  type MetricKey,
  type Metrics,
  type Outcome,
} from "./data/scenarios";
import { applyChoice, rankTitle, resetMetrics, scoreFromChoices } from "./lib/score";
import {
  createRoom,
  isRealtimeConfigured,
  loadRoom,
  saveRoom,
  subscribeToRoom,
  type GameSnapshot,
} from "./lib/roomService";

type Screen = "start" | "avatar" | "mode" | "verify" | "profile" | "howto" | "game" | "result";
type Mode = "individual" | "leadership";

const avatars = [
  { id: "designer", label: "Design lead", hue: "#f15add" },
  { id: "creator", label: "Campus creator", hue: "#4bd2db" },
  { id: "analyst", label: "Careful analyst", hue: "#ffd000" },
  { id: "builder", label: "Team builder", hue: "#ed1b2f" },
  { id: "planner", label: "Project planner", hue: "#ffffff" },
  { id: "speaker", label: "Confident speaker", hue: "#ff9a57" },
  { id: "mentor", label: "Peer mentor", hue: "#f8a6d9" },
  { id: "maker", label: "Blue maker", hue: "#145be8" },
];

const outcomeClass: Record<Outcome, string> = {
  good: "good",
  partial: "partial",
  risky: "risky",
};

const outcomeLabel: Record<Outcome, string> = {
  good: "Good call",
  partial: "Partially right",
  risky: "Risky choice",
};

function buildSnapshot(state: {
  screen: Screen;
  mode: Mode | null;
  avatarId: string | null;
  studentId: string;
  profile: { year: string; program: string; accessCode: string };
  scenarioIndex: number;
  selectedChoiceId: string | null;
  choices: string[];
}): GameSnapshot {
  return {
    ...state,
    updatedAt: new Date().toISOString(),
  };
}

function StickerLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "logo sticker-logo compact" : "logo sticker-logo"}>
      <span className="logo-top">Choose</span>
      <span className="logo-bottom">Your Action</span>
      <span className="logo-pencil">▰</span>
      <span className="logo-check">
        <Check size={compact ? 18 : 26} strokeWidth={4} />
      </span>
    </div>
  );
}

function Header({
  avatarId,
  onBack,
  onHelp,
}: {
  avatarId: string | null;
  onBack?: () => void;
  onHelp?: () => void;
}) {
  const avatar = avatars.find((item) => item.id === avatarId) ?? avatars[0];
  return (
    <header className="game-header">
      <div className="pixel-mark" aria-hidden="true" />
      <div className="avatar-chip" style={{ "--avatar": avatar.hue } as React.CSSProperties}>
        <UserRound size={28} />
      </div>
      {onBack ? (
        <button className="back-button" type="button" onClick={onBack}>
          &lt; Back
        </button>
      ) : null}
      {onHelp ? (
        <button className="help-button" type="button" aria-label="How to play" onClick={onHelp}>
          <HelpCircle size={30} />
        </button>
      ) : null}
    </header>
  );
}

function StickerButton({
  children,
  tone = "yellow",
  onClick,
  disabled,
  icon,
  buttonType = "button",
}: {
  children: React.ReactNode;
  tone?: "yellow" | "red" | "white" | "cyan";
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  buttonType?: "button" | "submit";
}) {
  return (
    <button className={`sticker-button ${tone}`} type={buttonType} onClick={onClick} disabled={disabled}>
      <span>{children}</span>
      {icon ?? <ArrowRight size={26} strokeWidth={3} />}
    </button>
  );
}

function MetricCard({ metric, value }: { metric: MetricKey; value: number }) {
  return (
    <button className="metric-card" type="button" title={metricLabels[metric]}>
      <span>
        {metricLabels[metric]}
        <Info size={16} />
      </span>
      <span className="meter">
        <i style={{ width: `${value}%`, background: metricColors[metric] }} />
      </span>
    </button>
  );
}

function RoomControls({
  roomCode,
  roomMessage,
  onCreateRoom,
  onJoinRoom,
}: {
  roomCode: string | null;
  roomMessage: string;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
}) {
  const [joinCode, setJoinCode] = useState("");

  return (
    <section className="room-panel" aria-label="Room controls">
      <div>
        <h2>Room</h2>
        <p>{isRealtimeConfigured ? "Supabase realtime is ready." : "Local room preview. Add Supabase env to sync."}</p>
      </div>
      <div className="room-actions">
        <button type="button" onClick={onCreateRoom}>
          <Share2 size={18} />
          Create room
        </button>
        <label>
          <span>Join code</span>
          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            maxLength={6}
            placeholder="CXVED"
          />
        </label>
        <button type="button" onClick={() => onJoinRoom(joinCode)} disabled={!joinCode.trim()}>
          Join
        </button>
      </div>
      {roomCode ? <strong>Code: {roomCode}</strong> : null}
      {roomMessage ? <p className="room-message">{roomMessage}</p> : null}
    </section>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [avatarId, setAvatarId] = useState<string | null>("designer");
  const [mode, setMode] = useState<Mode | null>(null);
  const [studentId, setStudentId] = useState("");
  const [profile, setProfile] = useState({ year: "", program: "", accessCode: "" });
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [choiceHistory, setChoiceHistory] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(resetMetrics);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomMessage, setRoomMessage] = useState("");
  const [howtoReturnScreen, setHowtoReturnScreen] = useState<Screen | null>(null);

  const scenario = scenarios[scenarioIndex];
  const selectedChoice = scenario?.choices.find((choice) => choice.id === selectedChoiceId) ?? null;
  const selectedChoices = useMemo(
    () =>
      choiceHistory
        .map((id, index) => scenarios[index]?.choices.find((choice) => choice.id === id))
        .filter(Boolean) as Choice[],
    [choiceHistory],
  );
  const score = scoreFromChoices(selectedChoices);

  useEffect(() => {
    const stage = document.querySelector(".phone-stage");
    stage?.scrollTo({ top: 0, behavior: "instant" });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [screen]);

  const snapshot = buildSnapshot({
    screen,
    mode,
    avatarId,
    studentId,
    profile,
    scenarioIndex,
    selectedChoiceId,
    choices: choiceHistory,
  });

  useEffect(() => {
    if (!roomCode || !isRealtimeConfigured) return;
    void saveRoom(roomCode, snapshot).catch(() => setRoomMessage("Room sync failed. Check Supabase rules."));
  }, [roomCode, screen, mode, avatarId, studentId, profile, scenarioIndex, selectedChoiceId, choiceHistory]);

  useEffect(() => {
    if (!roomCode) return undefined;
    return subscribeToRoom(roomCode, (next) => {
      setScreen(next.screen as Screen);
      setMode(next.mode as Mode | null);
      setAvatarId(next.avatarId);
      setStudentId(next.studentId);
      setProfile(next.profile);
      setScenarioIndex(next.scenarioIndex);
      setSelectedChoiceId(next.selectedChoiceId);
      setChoiceHistory(next.choices);
    });
  }, [roomCode]);

  useEffect(() => {
    let next = resetMetrics();
    selectedChoices.forEach((choice) => {
      next = applyChoice(next, choice);
    });
    setMetrics(next);
  }, [selectedChoices]);

  const goBack = () => {
    if (screen === "game" && selectedChoiceId) {
      setSelectedChoiceId(null);
      return;
    }
    if (screen === "game" && scenarioIndex > 0) {
      setScenarioIndex((value) => value - 1);
      setChoiceHistory((items) => items.slice(0, -1));
      return;
    }
    if (screen === "howto" && howtoReturnScreen) {
      setScreen(howtoReturnScreen);
      setHowtoReturnScreen(null);
      return;
    }
    const order: Screen[] = ["start", "verify", "profile", "mode", "howto", "game", "result"];
    const current = order.indexOf(screen);
    setScreen(order[Math.max(0, current - 1)]);
  };

  const openHowto = (from: Screen = screen) => {
    setHowtoReturnScreen(from);
    setScreen("howto");
  };

  const handleChoice = (choice: Choice) => {
    setSelectedChoiceId(choice.id);
    setChoiceHistory((items) => {
      const next = [...items];
      next[scenarioIndex] = choice.id;
      return next;
    });
  };

  const nextScenario = () => {
    if (scenarioIndex >= scenarios.length - 1) {
      setSelectedChoiceId(null);
      setScreen("result");
      return;
    }
    setScenarioIndex((value) => value + 1);
    setSelectedChoiceId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const restart = () => {
    setScreen("start");
    setAvatarId("designer");
    setMode(null);
    setStudentId("");
    setProfile({ year: "", program: "", accessCode: "" });
    setScenarioIndex(0);
    setSelectedChoiceId(null);
    setChoiceHistory([]);
    setMetrics(resetMetrics());
    setHowtoReturnScreen(null);
  };

  const handleCreateRoom = async () => {
    try {
      const result = await createRoom(snapshot);
      setRoomCode(result.code);
      setRoomMessage(result.remote ? "Room created and synced." : "Room code created locally.");
    } catch {
      setRoomMessage("Could not create room. Check Supabase table/policies.");
    }
  };

  const handleJoinRoom = async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    try {
      const next = await loadRoom(normalized);
      if (!next) {
        setRoomCode(normalized);
        setRoomMessage("Room not found remotely. Using local preview code.");
        return;
      }
      setRoomCode(normalized);
      setRoomMessage("Joined synced room.");
      setScreen(next.screen as Screen);
      setMode(next.mode as Mode | null);
      setAvatarId(next.avatarId);
      setStudentId(next.studentId);
      setProfile(next.profile);
      setScenarioIndex(next.scenarioIndex);
      setSelectedChoiceId(next.selectedChoiceId);
      setChoiceHistory(next.choices);
    } catch {
      setRoomMessage("Could not join room. Check Supabase configuration.");
    }
  };

  return (
    <main className="app-shell">
      <section className="phone-stage">
        {screen !== "start" ? (
          <Header avatarId={avatarId} onBack={goBack} onHelp={screen === "howto" ? undefined : () => openHowto()} />
        ) : null}

        {screen === "start" ? (
          <section className="start-screen">
            <div className="pixel-mark" aria-hidden="true" />
            <img className="start-logo" src="/assets/choose-logo.png" alt="Choose Your Action" />
            <img className="start-bubble" src="/assets/start-bubble-real.png" alt="Choose your action. Think before you act." />
            <img className="start-character" src="/assets/start-character.png" alt="" />
            <button className="image-start-button" type="button" onClick={() => setScreen("verify")}>
              <img src="/assets/start-button.png" alt="Start" />
            </button>
          </section>
        ) : null}

        {screen === "avatar" ? (
          <section className="avatar-screen">
            <div className="pixel-mark" aria-hidden="true" />
            <img className="asset-logo avatar-logo" src="/assets/choose-logo.png" alt="Choose Your Action" />
            <h1>
              But first, let's choose your <span>avatar</span>
            </h1>
            <div className="avatar-grid">
              {avatars.map((avatar) => (
                <button
                  key={avatar.id}
                  className={avatarId === avatar.id ? "avatar-option selected" : "avatar-option"}
                  type="button"
                  onClick={() => setAvatarId(avatar.id)}
                  style={{ "--avatar": avatar.hue } as React.CSSProperties}
                  aria-label={avatar.label}
                >
                  <UserRound size={48} />
                </button>
              ))}
            </div>
            <StickerButton tone="yellow" disabled={!avatarId} onClick={() => openHowto("avatar")}>
              Next
            </StickerButton>
          </section>
        ) : null}

        {screen === "mode" ? (
          <section className="mode-screen">
            <img className="asset-logo mode-logo" src="/assets/choose-logo.png" alt="Choose Your Action" />
            <p className="ribbon red">First, choose the mode you want to challenge</p>
            <div className="mode-options">
              <button
                type="button"
                className={mode === "individual" ? "mode-card selected" : "mode-card"}
                onClick={() => setMode("individual")}
              >
                <span className="mode-illustration person-icon" aria-hidden="true" />
                <span>
                  <strong>Individual Challenge</strong>
                  Self-paced. Choose your responses and earn speed + accuracy points.
                </span>
                <i>{mode === "individual" ? <Check size={22} /> : null}</i>
              </button>
              <button
                type="button"
                className={mode === "leadership" ? "mode-card selected" : "mode-card"}
                onClick={() => setMode("leadership")}
              >
                <span className="mode-illustration crown-icon" aria-hidden="true" />
                <span>
                  <strong>Leadership Role</strong>
                  You're the team lead. Your decisions affect the whole team's outcomes.
                </span>
                <i>{mode === "leadership" ? <Check size={22} /> : null}</i>
              </button>
            </div>
            <StickerButton tone="yellow" disabled={!mode} onClick={() => openHowto("mode")}>
              Next
            </StickerButton>
          </section>
        ) : null}

        {screen === "verify" ? (
          <section className="verify-screen">
            <img className="asset-logo verify-logo" src="/assets/choose-logo.png" alt="Choose Your Action" />
            <form
              className="white-poster verify-card"
              onSubmit={(event) => {
                event.preventDefault();
                setScreen("profile");
              }}
            >
              <p>This is exclusively for</p>
              <h2>RMIT Students</h2>
              <label>
                <span>Enter your Student ID</span>
                <input
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  placeholder="s1234567"
                  required
                />
              </label>
              <small>Please enter your SID to verify!</small>
              <StickerButton tone="yellow" disabled={!studentId.trim()} buttonType="submit">
                Next
              </StickerButton>
            </form>
            <img className="verify-character" src="/assets/start-character.png" alt="" />
          </section>
        ) : null}

        {screen === "profile" ? (
          <section className="profile-screen">
            <div className="city-logo">
              <span>The</span>
              Career City
            </div>
            <img className="collect-guide" src="/assets/collect-guide.png" alt="" />
            <form
              className="profile-form"
              onSubmit={(event) => {
                event.preventDefault();
                setScreen("mode");
              }}
            >
              <label>
                <span className="ribbon yellow">What year of study are you in?</span>
                <input
                  value={profile.year}
                  onChange={(event) => setProfile((item) => ({ ...item, year: event.target.value }))}
                  placeholder="e.g. Year 3"
                  required
                />
              </label>
              <label>
                <span className="ribbon yellow">What is your current program?</span>
                <input
                  value={profile.program}
                  onChange={(event) => setProfile((item) => ({ ...item, program: event.target.value }))}
                  placeholder="e.g. Digital Marketing"
                  required
                />
              </label>
              <label>
                <span className="ribbon yellow">
                  Access code <em>(Optional)</em>
                </span>
                <input
                  value={profile.accessCode}
                  onChange={(event) => setProfile((item) => ({ ...item, accessCode: event.target.value }))}
                  placeholder="e.g. CXVED"
                />
              </label>
              <StickerButton tone="yellow" buttonType="submit">
                Next
              </StickerButton>
            </form>
          </section>
        ) : null}

        {screen === "howto" ? (
          <section className="howto-screen">
            <div className="notebook-card">
              <h1>How to play</h1>
              <ul>
                <li>You will be placed inside a real workplace scenario that interns and entry-level employees commonly face.</li>
                <li>Read carefully and choose one of three responses.</li>
                <li>Learn from the consequences and reflect on your choices.</li>
              </ul>
              <div className="badges">
                <span>11 scenarios</span>
                <span>No time limit</span>
              </div>
            </div>
            <img className="howto-character" src="/assets/start-character.png" alt="" />
            <StickerButton
              tone="red"
              onClick={() => {
                setHowtoReturnScreen(null);
                setScreen("game");
              }}
            >
              Start
            </StickerButton>
          </section>
        ) : null}

        {screen === "game" && scenario ? (
          <section className="game-screen">
            <div className="progress-line">
              <span style={{ width: `${((scenarioIndex + 1) / scenarios.length) * 100}%` }} />
            </div>
            <article className={`scenario-card ${scenario.cardTone}`}>
              <div className="tab-strip" aria-hidden="true">
                {["#ed1b2f", "#ffd000", "#fff", "#05004b", "#f15add", "#fff", "#4bd2db", "#05004b"].map(
                  (color, index) => (
                    <i key={`${color}-${index}`} style={{ background: color }} />
                  ),
                )}
              </div>
              <p>
                Scene · {scenario.title} · {scenario.category}
              </p>
              <h1>{scenario.body}</h1>
            </article>
            <div className="metrics-grid">
              {(Object.keys(metricLabels) as MetricKey[]).map((metric) => (
                <MetricCard key={metric} metric={metric} value={selectedChoice ? metrics[metric] : scenario.startingMetrics[metric]} />
              ))}
            </div>
            <h2 className="question-title">What do you do?</h2>
            <div className="choices">
              {scenario.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className={
                    selectedChoiceId === choice.id ? `choice selected ${outcomeClass[choice.outcome]}` : "choice"
                  }
                  onClick={() => handleChoice(choice)}
                >
                  {choice.label}
                </button>
              ))}
            </div>
            {selectedChoice ? (
              <aside className={`feedback ${outcomeClass[selectedChoice.outcome]}`}>
                <strong>{outcomeLabel[selectedChoice.outcome]}</strong>
                <p>{selectedChoice.feedback.replace(`${outcomeLabel[selectedChoice.outcome]}. `, "")}</p>
                <StickerButton tone={selectedChoice.outcome === "risky" ? "red" : "yellow"} onClick={nextScenario}>
                  {scenarioIndex >= scenarios.length - 1 ? "See result" : "Next"}
                </StickerButton>
              </aside>
            ) : null}
          </section>
        ) : null}

        {screen === "result" ? (
          <section className="result-screen">
            <img className="asset-logo result-logo" src="/assets/choose-logo.png" alt="Choose Your Action" />
            <article className="white-poster score-card">
              <div className="trophy" aria-hidden="true" />
              <div>
                <h1>Your score</h1>
                <strong>{score}</strong>
                <p>You're {rankTitle(score)}</p>
              </div>
              <div className="score-breakdown">
                <span>Labour Rights <b>{selectedChoices.slice(0, 6).reduce((sum, choice) => sum + choice.score, 0)}</b></span>
                <span>Workplace Ethics <b>{selectedChoices.slice(6).reduce((sum, choice) => sum + choice.score, 0)}</b></span>
              </div>
            </article>
            <details className="reflection">
              <summary>
                Tap here to see reflection questions <ChevronDown size={28} />
              </summary>
              <ol>
                <li>Which decision felt most difficult, and why?</li>
                <li>What information would you ask for before making a workplace decision?</li>
                <li>Who could you contact at RMIT or work if you felt unsure?</li>
              </ol>
            </details>
            <p className="speech result-speech">Would you like to challenge again?</p>
            <img className="result-character" src="/assets/result-character.png" alt="" />
            <div className="result-actions">
              <StickerButton tone="red" onClick={restart} icon={<RotateCcw size={24} />}>
                Of course, LET'S GO!
              </StickerButton>
              <StickerButton tone="white" onClick={() => setScreen("mode")} icon={<ArrowRight size={24} />}>
                Back to mode
              </StickerButton>
            </div>
          </section>
        ) : null}
      </section>

      <aside className="desktop-side">
        <RoomControls
          roomCode={roomCode}
          roomMessage={roomMessage}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
        <section className="side-card">
          <h2>Session</h2>
          <p>{mode ? `${mode === "individual" ? "Individual" : "Leadership"} challenge` : "Choose a mode to start."}</p>
          <p>{studentId ? `SID ${studentId}` : "Student ID not verified yet."}</p>
          <p>
            Scenario {Math.min(scenarioIndex + 1, scenarios.length)} / {scenarios.length}
          </p>
        </section>
      </aside>
    </main>
  );
}

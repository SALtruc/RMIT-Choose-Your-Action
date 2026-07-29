import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Info,
  ListChecks,
  RotateCcw,
  Share2,
} from "lucide-react";
import "./styles.css";
import {
  metricColors,
  metricDescriptions,
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
  { id: "designer", label: "Design lead", hue: "#f15add", img: "/assets/avatars/designer.png" },
  { id: "creator", label: "Campus creator", hue: "#4bd2db", img: "/assets/avatars/creator.png" },
  { id: "analyst", label: "Careful analyst", hue: "#ffd000", img: "/assets/avatars/analyst.png" },
  { id: "builder", label: "Team builder", hue: "#ed1b2f", img: "/assets/avatars/builder.png" },
  { id: "planner", label: "Project planner", hue: "#ffffff", img: "/assets/avatars/planner.png" },
  { id: "speaker", label: "Confident speaker", hue: "#ff9a57", img: "/assets/avatars/speaker.png" },
  { id: "mentor", label: "Peer mentor", hue: "#f8a6d9", img: "/assets/avatars/mentor.png" },
  { id: "maker", label: "Blue maker", hue: "#145be8", img: "/assets/avatars/maker.png" },
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

const reflectionQuestions = [
  {
    question: "Which choices felt difficult?",
    detail: "What made them hard, the relationship at stake, the uncertainty, or not knowing your rights?",
  },
  {
    question: "What rights do employees have in these situations?",
    detail: "Think about labour law, your contract, and the right to a safe workplace.",
  },
  {
    question: "How could communication improve the outcome?",
    detail: "Could any of these situations have been avoided with clearer conversations earlier?",
  },
];

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
      <span className="logo-pencil" aria-hidden="true" />
      <span className="logo-check">
        <Check size={compact ? 18 : 26} strokeWidth={4} />
      </span>
    </div>
  );
}

const shouldReduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Header({
  avatarId,
  onBack,
  onHelp,
  showAvatar = true,
}: {
  avatarId: string | null;
  onBack?: () => void;
  onHelp?: () => void;
  showAvatar?: boolean;
}) {
  const avatar = avatars.find((item) => item.id === avatarId) ?? avatars[0];
  return (
    <header className="game-header">
      <div className="pixel-mark" aria-hidden="true" />
      {showAvatar ? (
        <div className="header-avatar">
          <img src={avatar.img} alt={avatar.label} />
        </div>
      ) : (
        <span aria-hidden="true" />
      )}
      {onBack ? (
        <button className="back-button" type="button" onClick={onBack}>
          &lt; Back
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
      {onHelp ? (
        <button className="help-button" type="button" aria-label="How to play" onClick={onHelp}>
          ?
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
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

function MetricCard({
  metric,
  value,
  open,
  onToggle,
}: {
  metric: MetricKey;
  value: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="metric-card">
      <button
        className="metric-card-head"
        type="button"
        onClick={onToggle}
        aria-expanded={open}
      >
        {metricLabels[metric]}
        <i className="info-dot" aria-hidden="true">
          i
        </i>
      </button>
      <span className="meter">
        <i style={{ width: `${value}%`, background: metricColors[metric] }} />
      </span>
      {open ? <p className="metric-tooltip">{metricDescriptions[metric]}</p> : null}
    </div>
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
  const stageRef = useRef<HTMLElement | null>(null);
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
  const [openMetric, setOpenMetric] = useState<MetricKey | null>(null);
  const [revealSuggested, setRevealSuggested] = useState(false);
  const [reflectionOpen, setReflectionOpen] = useState(false);

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

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || shouldReduceMotion()) return undefined;

    const ctx = gsap.context(() => {
      const activeSection = stage.querySelector(":scope > section");
      if (!activeSection) return;

      gsap.fromTo(
        activeSection,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.42, ease: "back.out(1.25)" },
      );

      gsap.fromTo(
        activeSection.querySelectorAll(".asset-logo, .start-logo"),
        { scale: 0.94, rotate: -1 },
        { scale: 1, rotate: 0, duration: 0.58, ease: "elastic.out(1, 0.72)" },
      );

      gsap.fromTo(
        activeSection.querySelectorAll(".avatar-option, .mode-card, .choice, .metric-card, .badges span"),
        { autoAlpha: 0, y: 18, scale: 0.96 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.36,
          ease: "back.out(1.5)",
          stagger: 0.045,
          delay: 0.06,
        },
      );

      gsap.fromTo(
        activeSection.querySelectorAll(".start-character, .verify-character, .howto-character, .result-character"),
        { autoAlpha: 0, y: 26, rotate: -2 },
        { autoAlpha: 1, y: 0, rotate: 0, duration: 0.62, ease: "back.out(1.2)", delay: 0.12 },
      );

      gsap.to(
        activeSection.querySelectorAll(".start-bubble, .start-character, .verify-character, .howto-character, .result-character"),
        {
          y: "-=8",
          duration: 1.8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: 0.14,
        },
      );
    }, stage);

    return () => ctx.revert();
  }, [screen, scenarioIndex]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || shouldReduceMotion()) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".progress-line span, .meter i",
        { scaleX: 0.4, transformOrigin: "left center" },
        { scaleX: 1, duration: 0.72, ease: "power3.out", stagger: 0.04 },
      );

      if (selectedChoiceId) {
        gsap.fromTo(
          ".choice.selected",
          { scale: 0.96, rotate: -0.5 },
          { scale: 1, rotate: 0, duration: 0.42, ease: "elastic.out(1, 0.62)" },
        );
        gsap.fromTo(
          ".feedback, .feedback-card",
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.38, ease: "back.out(1.35)", stagger: 0.06 },
        );
      }

      if (revealSuggested) {
        gsap.fromTo(
          ".feedback-suggested",
          { autoAlpha: 0, y: 12, scale: 0.98 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.32, ease: "back.out(1.3)" },
        );
      }
    }, stage);

    return () => ctx.revert();
  }, [screen, scenarioIndex, selectedChoiceId, revealSuggested]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || shouldReduceMotion()) return undefined;

    const press = (event: PointerEvent) => {
      const button = (event.target as Element).closest("button:not(:disabled)");
      if (!button || !stage.contains(button)) return;

      gsap.fromTo(
        button,
        { y: 2 },
        { y: 0, duration: 0.28, ease: "elastic.out(1, 0.55)", clearProps: "transform" },
      );
    };

    stage.addEventListener("pointerdown", press);
    return () => stage.removeEventListener("pointerdown", press);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
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
    const order: Screen[] = ["start", "avatar", "verify", "profile", "mode", "howto", "game", "result"];
    const current = order.indexOf(screen);
    setScreen(order[Math.max(0, current - 1)]);
  };

  const openHowto = (from: Screen = screen) => {
    setHowtoReturnScreen(from);
    setScreen("howto");
  };

  const handleChoice = (choice: Choice) => {
    setSelectedChoiceId(choice.id);
    setRevealSuggested(false);
    setChoiceHistory((items) => {
      const next = [...items];
      next[scenarioIndex] = choice.id;
      return next;
    });
  };

  const nextScenario = () => {
    setRevealSuggested(false);
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

  const showTopHeader = screen !== "start" && screen !== "avatar";
  const showHeaderAvatar = screen !== "avatar" && screen !== "verify";
  const showHeaderBack = screen === "game" || screen === "howto";
  const showHeaderHelp = screen === "game";

  return (
    <main className="app-shell">
      <section className="phone-stage" ref={stageRef}>
        {showTopHeader ? (
          <Header
            avatarId={avatarId}
            showAvatar={showHeaderAvatar}
            onBack={showHeaderBack ? goBack : undefined}
            onHelp={showHeaderHelp ? () => openHowto() : undefined}
          />
        ) : null}

        {screen === "start" ? (
          <section className="start-screen">
            <div className="pixel-mark" aria-hidden="true" />
            <img className="start-logo" src="/assets/choose-logo.png" alt="Choose Your Action" />
            <img className="start-bubble" src="/assets/start-bubble-real.png" alt="Choose your action. Think before you act." />
            <button className="image-start-button" type="button" onClick={() => setScreen("avatar")}>
              <img src="/assets/start-button.png" alt="Start" />
            </button>
            <img className="start-character" src="/assets/start-character.png" alt="" />
          </section>
        ) : null}

        {screen === "avatar" ? (
          <section className="avatar-screen">
            <div className="pixel-mark setup-mark" aria-hidden="true" />
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
                  aria-label={avatar.label}
                >
                  <img src={avatar.img} alt="" />
                </button>
              ))}
            </div>
            <StickerButton tone="yellow" disabled={!avatarId} onClick={() => setScreen("verify")}>
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
                <img className="mode-illustration" src="/assets/mode-person.png" alt="" aria-hidden="true" />
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
                <img className="mode-illustration" src="/assets/mode-crown.png" alt="" aria-hidden="true" />
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
              <span className="card-sparkle" aria-hidden="true" />
              <span className="card-dot" aria-hidden="true" />
              <span className="card-diamond" aria-hidden="true" />
              <StickerButton tone="yellow" disabled={!studentId.trim()} buttonType="submit">
                Next
              </StickerButton>
            </form>
            <p className="verify-note">Please enter your SID to verify!</p>
            <img className="verify-character" src="/assets/start-character.png" alt="" />
          </section>
        ) : null}

        {screen === "profile" ? (
          <section className="profile-screen">
            <img className="asset-logo profile-logo" src="/assets/choose-logo.png" alt="Choose Your Action" />
            <img className="collect-guide" src="/assets/collect-guide.png" alt="" />
            <form
              className="profile-form"
              onSubmit={(event) => {
                event.preventDefault();
                setScreen("mode");
              }}
            >
              <label>
                <span className="ribbon red flag">What year of study are you in?</span>
                <input
                  value={profile.year}
                  onChange={(event) => setProfile((item) => ({ ...item, year: event.target.value }))}
                  placeholder="e.g. Year 3"
                  required
                />
              </label>
              <label>
                <span className="ribbon red flag">What is your current program?</span>
                <input
                  value={profile.program}
                  onChange={(event) => setProfile((item) => ({ ...item, program: event.target.value }))}
                  placeholder="e.g. Digital Marketing"
                  required
                />
              </label>
              <label>
                <span className="ribbon red flag access-ribbon">
                  Access code <em>(Optional)</em>
                  <Info size={18} />
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
              <div className="tab-strip" aria-hidden="true">
                {["#ed1b2f", "#ffd000", "#fff", "#05004b", "#f15add", "#fff", "#4bd2db", "#05004b"].map(
                  (color, index) => (
                    <i key={`${color}-${index}`} style={{ background: color }} />
                  ),
                )}
              </div>
              <img className="scene-badge" src="/assets/scene-badge.png" alt="" aria-hidden="true" />
              <h1>How to play</h1>
              <ul>
                <li>You will be placed inside a real workplace scenario that interns and entry-level employees commonly face.</li>
                <li>Read carefully and choose one of three responses.</li>
                <li>Learn from the consequences and reflect on your choices.</li>
              </ul>
              <div className="badges">
                <span>
                  <i className="badge-icon">
                    <ListChecks size={18} />
                  </i>
                  11 scenarios
                </span>
                <span>
                  <i className="badge-icon">
                    <Clock size={18} />
                  </i>
                  No time limit
                </span>
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
              <img className="scene-badge" src="/assets/scene-badge.png" alt="" aria-hidden="true" />
              <p>
                Scene {"\u00b7"} {scenario.title} {"\u00b7"} {scenario.category}
              </p>
              <h1>{scenario.body}</h1>
            </article>
            <div className="metrics-grid">
              {(Object.keys(metricLabels) as MetricKey[]).map((metric) => (
                <MetricCard
                  key={metric}
                  metric={metric}
                  value={selectedChoice ? metrics[metric] : scenario.startingMetrics[metric]}
                  open={openMetric === metric}
                  onToggle={() => setOpenMetric((current) => (current === metric ? null : metric))}
                />
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
              <aside className="feedback">
                <h3 className="feedback-heading">Here's what this costs you</h3>
                <div className="feedback-card">
                  <div className="feedback-head">
                    <i className={`feedback-dot ${outcomeClass[selectedChoice.outcome]}`} aria-hidden="true" />
                    <strong>{outcomeLabel[selectedChoice.outcome]}</strong>
                  </div>
                  <p>{selectedChoice.feedback.replace(`${outcomeLabel[selectedChoice.outcome]}. `, "")}</p>
                  <span className="feedback-points">Accuracy: +{selectedChoice.score} pts</span>
                  {selectedChoice.outcome !== "good" ? (
                    <button
                      className="feedback-reveal"
                      type="button"
                      onClick={() => setRevealSuggested((value) => !value)}
                    >
                      {revealSuggested ? "Hide the suggested response" : "Tap to see the suggested response"}
                    </button>
                  ) : null}
                  {revealSuggested && selectedChoice.outcome !== "good" ? (
                    <p className="feedback-suggested">
                      {scenario.choices.find((choice) => choice.outcome === "good")?.label}
                    </p>
                  ) : null}
                </div>
                <StickerButton tone="yellow" onClick={nextScenario}>
                  {scenarioIndex >= scenarios.length - 1 ? "See result" : "Next scene"}
                </StickerButton>
              </aside>
            ) : null}
          </section>
        ) : null}

        {screen === "result" ? (
          <section className="result-screen">
            <img className="asset-logo result-logo" src="/assets/choose-logo.png" alt="Choose Your Action" />
            <article className="white-poster score-card">
              <img className="trophy" src="/assets/trophy.png" alt="" aria-hidden="true" />
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
            <details
              className="reflection"
              open={reflectionOpen}
              onToggle={(event) => setReflectionOpen(event.currentTarget.open)}
            >
              <summary>
                {reflectionOpen ? "Reflection questions" : "Tap here to see reflection questions"}
                <ChevronDown size={28} className={reflectionOpen ? "flip" : ""} />
              </summary>
              <div className="reflection-list">
                {reflectionQuestions.map((item) => (
                  <div className="reflection-item" key={item.question}>
                    <strong>{item.question}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </details>
            <p className="speech result-speech">Would you like to challenge again?</p>
            <img className="result-character" src="/assets/result-character.png" alt="" />
            <div className="result-actions">
              <StickerButton tone="red" onClick={restart} icon={<RotateCcw size={24} />}>
                Of course, LET'S GO!
              </StickerButton>
              <StickerButton tone="white" onClick={() => setScreen("mode")} icon={<ArrowRight size={24} />}>
                No, let's go back to homepage
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

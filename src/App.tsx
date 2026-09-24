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
  X,
} from "lucide-react";
import "./styles.css";
import { scenarios, type Choice, type Outcome } from "./data/scenarios";
import { rankTitle, scoreFromChoices } from "./lib/score";

type Screen = "start" | "avatar" | "verify" | "profile" | "howto" | "game" | "result";

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

function LogoBadge({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={className ? `pixel-mark ${className}` : "pixel-mark"}
      type="button"
      onClick={onClick}
      aria-label="Return to the start screen"
    >
      <img src="/assets/logo-badge.png" alt="" aria-hidden="true" />
    </button>
  );
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
  onLogoClick,
  showAvatar = true,
}: {
  avatarId: string | null;
  onBack?: () => void;
  onHelp?: () => void;
  onLogoClick: () => void;
  showAvatar?: boolean;
}) {
  const avatar = avatars.find((item) => item.id === avatarId) ?? avatars[0];
  return (
    <header className={onBack || onHelp ? "game-header" : "game-header compact"}>
      <LogoBadge onClick={onLogoClick} />
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
      ) : null}
      {onHelp ? (
        <button className="help-button" type="button" aria-label="How to play" onClick={onHelp}>
          ?
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

export default function App() {
  const stageRef = useRef<HTMLElement | null>(null);
  const feedbackRef = useRef<HTMLElement | null>(null);
  const [screen, setScreen] = useState<Screen>("start");
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  const [profile, setProfile] = useState({ year: "", program: "", accessCode: "" });
  const [showAccessInfo, setShowAccessInfo] = useState(false);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [choiceHistory, setChoiceHistory] = useState<string[]>([]);
  const [howtoReturnScreen, setHowtoReturnScreen] = useState<Screen | null>(null);
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
        activeSection.querySelectorAll(".avatar-option, .choice, .badges span"),
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
        ".progress-line span",
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

  // Score reaction runs only when a choice is picked, so it doesn't replay when
  // the suggested response is toggled. Risky choices get a heavier "penalty" feel.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const outcome = selectedChoice?.outcome;
    if (!stage || !outcome) return undefined;

    if (outcome === "risky") navigator.vibrate?.([60, 40, 90]);
    if (shouldReduceMotion()) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".score-pop",
        { autoAlpha: 0, scale: 0.2, rotate: -24 },
        { autoAlpha: 1, scale: 1, rotate: 6, duration: 0.55, ease: "back.out(2.4)", delay: 0.12 },
      );

      if (outcome === "risky") {
        gsap.to(".choice.selected", {
          keyframes: { x: [0, -12, 11, -9, 7, -4, 0] },
          duration: 0.5,
          ease: "none",
        });
        gsap.fromTo(".risk-flash", { autoAlpha: 0.42 }, { autoAlpha: 0, duration: 0.7, ease: "power2.out" });
        gsap.fromTo(
          ".feedback-points.risky",
          { scale: 1.25, rotate: -4 },
          { scale: 1, rotate: 0, duration: 0.6, ease: "elastic.out(1, 0.4)", delay: 0.25 },
        );
      }
    }, stage);

    return () => ctx.revert();
  }, [selectedChoiceId, scenarioIndex]);

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

  useEffect(() => {
    if (!selectedChoiceId) return;
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [selectedChoiceId, revealSuggested]);

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
    const order: Screen[] = ["start", "avatar", "verify", "profile", "howto", "game", "result"];
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
    setAvatarId(null);
    setStudentId("");
    setProfile({ year: "", program: "", accessCode: "" });
    setScenarioIndex(0);
    setSelectedChoiceId(null);
    setChoiceHistory([]);
    setHowtoReturnScreen(null);
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
            onLogoClick={restart}
          />
        ) : null}

        {screen === "start" ? (
          <section className="start-screen">
            <LogoBadge onClick={restart} />
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
            <LogoBadge onClick={restart} className="setup-mark" />
            <div className="avatar-scroll">
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
                    aria-pressed={avatarId === avatar.id}
                  >
                    <img src={avatar.img} alt="" />
                    {avatarId === avatar.id ? (
                      <span className="avatar-check" aria-hidden="true">
                        <Check size={20} strokeWidth={4} />
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
            {avatarId ? (
              <div className="avatar-next">
                <StickerButton tone="yellow" onClick={() => setScreen("verify")}>
                  Next
                </StickerButton>
              </div>
            ) : null}
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
                <input
                  value={studentId ? `S${studentId}` : ""}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "").slice(0, 7);
                    setStudentId(digits);
                  }}
                  placeholder="Enter your Student ID"
                  aria-label="Student ID"
                  inputMode="numeric"
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
            <div className="verify-footer">
              <img className="verify-character" src="/assets/start-character.png" alt="" />
              <p className="verify-note">Please enter your SID to verify!</p>
            </div>
          </section>
        ) : null}

        {screen === "profile" ? (
          <section className="profile-screen">
            <div className="profile-scroll">
              <img className="asset-logo profile-logo" src="/assets/choose-logo.png" alt="Choose Your Action" />
              <img className="collect-guide" src="/assets/collect-guide.png" alt="" />
              <form
                className="profile-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  openHowto("profile");
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
                    <button
                      type="button"
                      className="info-toggle"
                      aria-label="What is an access code?"
                      aria-expanded={showAccessInfo}
                      onClick={(event) => {
                        event.preventDefault();
                        setShowAccessInfo(true);
                      }}
                    >
                      <Info size={22} />
                    </button>
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
            </div>
            {showAccessInfo ? (
              <div
                className="metric-modal-backdrop"
                role="presentation"
                onClick={() => setShowAccessInfo(false)}
              >
                <div
                  className="metric-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-label="What is an access code?"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    className="metric-modal-close"
                    type="button"
                    onClick={() => setShowAccessInfo(false)}
                    aria-label="Close"
                  >
                    <X size={18} strokeWidth={3} />
                  </button>
                  <h3>Access code</h3>
                  <p>
                    Optional — enter the code your facilitator shared so your results can be grouped with your class
                    or event.
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {screen === "howto" ? (
          <section className="howto-screen">
            <div className="howto-scroll">
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
                  <li>You'll step into a workplace situation that many interns and early-career professionals experience.</li>
                  <li>Read carefully and choose one of three responses.</li>
                  <li>Learn from the outcomes of your decisions and reflect on the choices you made.</li>
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
            </div>
            <div className="howto-footer">
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
            </div>
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
                  disabled={selectedChoiceId !== null && selectedChoiceId !== choice.id}
                >
                  {choice.label}
                  {selectedChoiceId === choice.id ? (
                    <span className={`score-pop ${outcomeClass[choice.outcome]}`} aria-hidden="true">
                      +{choice.score} pts
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            {selectedChoice ? (
              <aside className="feedback" ref={feedbackRef}>
                <h3 className="feedback-heading">Here's how you did</h3>
                <div className="feedback-card">
                  <div className="feedback-head">
                    <i className={`feedback-dot ${outcomeClass[selectedChoice.outcome]}`} aria-hidden="true" />
                    <strong>{outcomeLabel[selectedChoice.outcome]}</strong>
                  </div>
                  <p>{selectedChoice.feedback.replace(`${outcomeLabel[selectedChoice.outcome]}. `, "")}</p>
                  <span className={`feedback-points ${outcomeClass[selectedChoice.outcome]}`}>
                    Accuracy: +{selectedChoice.score} pts
                  </span>
                  <button
                    className="feedback-reveal"
                    type="button"
                    onClick={() => setRevealSuggested((value) => !value)}
                  >
                    {revealSuggested ? "Hide the suggested response" : "Tap to see the suggested response"}
                  </button>
                  {revealSuggested ? (
                    <div className="feedback-suggested">
                      <p className="feedback-suggested-context">Say to: {scenario.suggestedResponse.sayTo}</p>
                      <p className="feedback-suggested-quote">&ldquo;{scenario.suggestedResponse.message}&rdquo;</p>
                    </div>
                  ) : null}
                </div>
                <StickerButton tone="yellow" onClick={nextScenario}>
                  {scenarioIndex >= scenarios.length - 1 ? "See result" : "Next scene"}
                </StickerButton>
              </aside>
            ) : null}
            {selectedChoice?.outcome === "risky" ? <div className="risk-flash" aria-hidden="true" /> : null}
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
              <StickerButton tone="red" onClick={restart} icon={<RotateCcw size={20} />}>
                Of course, LET'S GO!
              </StickerButton>
              <StickerButton tone="white" onClick={restart} icon={<ArrowRight size={20} />}>
                No, let's go back to homepage
              </StickerButton>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

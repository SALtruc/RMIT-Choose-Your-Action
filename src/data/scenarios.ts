export type MetricKey = "teamTrust" | "stress" | "reputation" | "career";
export type Outcome = "good" | "partial" | "risky";

export type Metrics = Record<MetricKey, number>;

export type Choice = {
  id: string;
  label: string;
  outcome: Outcome;
  score: number;
  delta: Metrics;
  feedback: string;
};

export type SuggestedResponse = {
  sayTo: string;
  message: string;
};

export type Scenario = {
  id: number;
  title: string;
  category: "Labour rights" | "Workplace ethics";
  body: string;
  cardTone: "navy" | "pink";
  startingMetrics: Metrics;
  choices: Choice[];
  suggestedResponse: SuggestedResponse;
};

export const metricLabels: Record<MetricKey, string> = {
  teamTrust: "Team trust",
  stress: "Stress",
  reputation: "Reputation",
  career: "Career",
};

export const metricColors: Record<MetricKey, string> = {
  teamTrust: "#4dd6dd",
  stress: "#ed1b2f",
  reputation: "#f365d9",
  career: "#ffd000",
};

export const metricDescriptions: Record<MetricKey, string> = {
  teamTrust: "How much your colleagues and manager trust and respect you based on how you handle situations at work.",
  stress: "Your current stress level. High stress affects your performance, wellbeing, and decision-making over time.",
  reputation: "How you are perceived professionally: by your team, your manager, and the broader workplace.",
  career: "The long-term impact of your decisions on your career growth, opportunities, and professional development.",
};

const neutral: Metrics = {
  teamTrust: 56,
  stress: 72,
  reputation: 56,
  career: 36,
};

export const scenarios: Scenario[] = [
  {
    id: 1,
    title: "Blank Contract",
    category: "Labour rights",
    cardTone: "navy",
    body:
      'You are offered a full-time entry-level job. On your first day, HR gives you a labour contract but several sections are blank, including salary, working hours, and job responsibilities. HR says "Just sign first, we\'ll fill it in later."',
    startingMetrics: { teamTrust: 56, stress: 72, reputation: 38, career: 18 },
    choices: [
      {
        id: "sign",
        label: "Sign the contract immediately because you do not want to look difficult.",
        outcome: "risky",
        score: 20,
        delta: { teamTrust: -14, stress: 18, reputation: -10, career: -18 },
        feedback: "Risky choice. Blank contracts can expose you to unfair conditions.",
      },
      {
        id: "complete",
        label: "Politely ask HR to complete all missing details before you sign.",
        outcome: "good",
        score: 100,
        delta: { teamTrust: 12, stress: -16, reputation: 18, career: 22 },
        feedback: "Good call. Asking for a complete contract protects both you and the employer.",
      },
      {
        id: "leave",
        label: "Refuse the job immediately and leave without asking any questions.",
        outcome: "partial",
        score: 60,
        delta: { teamTrust: -8, stress: -6, reputation: 4, career: 4 },
        feedback: "Partially right. Your concern is valid, but asking for clarification first is stronger.",
      },
    ],
    suggestedResponse: {
      sayTo: "HR representative, on your first day before signing",
      message:
        "I appreciate the offer and I'm excited to get started. Before I sign, could we take a few minutes to complete the missing sections, particularly the salary, working hours, and job responsibilities? I want to make sure we're both clear on the terms before I commit.",
    },
  },
  {
    id: 2,
    title: "No Contract Copy",
    category: "Labour rights",
    cardTone: "navy",
    body:
      'You have signed your labour contract, but HR says they will keep all copies and there is no need for you to have one. You are told: "Just trust us, everything is stored internally."',
    startingMetrics: { teamTrust: 56, stress: 78, reputation: 56, career: 60 },
    choices: [
      {
        id: "request",
        label: "Politely request a signed digital or printed copy for your own records.",
        outcome: "good",
        score: 100,
        delta: { teamTrust: 10, stress: -14, reputation: 16, career: 18 },
        feedback: "Good call. Keeping your own copy helps prevent confusion later.",
      },
      {
        id: "accept",
        label: "Accept it and continue working without keeping any record.",
        outcome: "partial",
        score: 45,
        delta: { teamTrust: -5, stress: 8, reputation: -4, career: -10 },
        feedback: "Partially right. Staying calm helps, but you still need documentation.",
      },
      {
        id: "photos",
        label: "Take photos of confidential HR documents without permission.",
        outcome: "risky",
        score: 15,
        delta: { teamTrust: -18, stress: 16, reputation: -22, career: -20 },
        feedback: "Risky choice. Protect your records without mishandling confidential documents.",
      },
    ],
    suggestedResponse: {
      sayTo: "HR representative, immediately after signing the contract",
      message:
        "Thank you for walking me through the contract. It's standard practice for both parties to keep a signed copy. Could I receive mine digitally or as a printout today? I just want to make sure I have it for my own records.",
    },
  },
  {
    id: 3,
    title: "Unpaid Overtime",
    category: "Labour rights",
    cardTone: "navy",
    body:
      'You are an intern and your supervisor regularly asks you to stay late until 8 PM. When you ask about overtime pay or time off in lieu, they say: "You\'re a student, this is part of learning."',
    startingMetrics: neutral,
    choices: [
      {
        id: "keep-staying",
        label: "Keep staying late every day without asking again.",
        outcome: "partial",
        score: 45,
        delta: { teamTrust: -4, stress: 18, reputation: 0, career: -8 },
        feedback: "Partially right. Being helpful is good, but boundaries and clear records matter.",
      },
      {
        id: "stop",
        label: "Stop coming to work without informing.",
        outcome: "risky",
        score: 10,
        delta: { teamTrust: -20, stress: -8, reputation: -18, career: -22 },
        feedback: "Risky choice. Disappearing damages trust and avoids the real issue.",
      },
      {
        id: "clarify",
        label: "Ask for clarification on working hours, overtime, and whether time off or payment applies.",
        outcome: "good",
        score: 100,
        delta: { teamTrust: 8, stress: -14, reputation: 14, career: 20 },
        feedback: "Good call. Clarifying expectations keeps the conversation professional.",
      },
    ],
    suggestedResponse: {
      sayTo: "Your direct supervisor, privately after being asked to stay late again",
      message:
        "I'm happy to support the team and I want to do a good job. Could we clarify what the expected working hours are for my internship, and whether overtime arrangements such as pay or time off in lieu apply when I stay late? I just want to make sure I understand what's expected.",
    },
  },
  {
    id: 4,
    title: "Weekend Work Pressure",
    category: "Labour rights",
    cardTone: "navy",
    body:
      'Your manager asks you to work on Sunday to finish an urgent task. They say there is no additional pay because "everyone needs to support the team during busy periods."',
    startingMetrics: neutral,
    choices: [
      {
        id: "agree",
        label: "Agree immediately and say nothing about compensation.",
        outcome: "partial",
        score: 45,
        delta: { teamTrust: 8, stress: 20, reputation: 0, career: -6 },
        feedback: "Partially right. Helping can be positive, but unpaid weekend work needs clarity.",
      },
      {
        id: "ask",
        label: "Ask whether Sunday work is required, how it is recorded, and whether overtime or time off applies.",
        outcome: "good",
        score: 100,
        delta: { teamTrust: 12, stress: -12, reputation: 16, career: 20 },
        feedback: "Good call. You addressed the business need while protecting your rights.",
      },
      {
        id: "refuse",
        label: "Refuse angrily in the team chat.",
        outcome: "risky",
        score: 15,
        delta: { teamTrust: -22, stress: 8, reputation: -20, career: -18 },
        feedback: "Risky choice. The concern is valid, but the channel and tone matter.",
      },
    ],
    suggestedResponse: {
      sayTo: "Your manager, privately and directly, not in the group chat",
      message:
        "I'm willing to come in on Sunday to help with this. I just want to confirm how it will be recorded. Does this apply to overtime pay or compensatory time off? I want to make sure I understand the arrangement before I commit.",
    },
  },
  {
    id: 5,
    title: "Very Low Pay Offer",
    category: "Labour rights",
    cardTone: "navy",
    body:
      'You receive a full-time job offer but the salary seems unusually low. When you ask how it was calculated, HR says: "This is normal for fresh graduates. Don\'t compare too much."',
    startingMetrics: neutral,
    choices: [
      {
        id: "accept",
        label: "Accept immediately because you feel lucky to have an offer.",
        outcome: "partial",
        score: 45,
        delta: { teamTrust: 0, stress: 8, reputation: -4, career: -12 },
        feedback: "Partially right. Gratitude is fine, but you can still ask for fair information.",
      },
      {
        id: "complain",
        label: "Post the offer online and complain publicly about the company.",
        outcome: "risky",
        score: 10,
        delta: { teamTrust: -20, stress: 10, reputation: -24, career: -18 },
        feedback: "Risky choice. Public complaints may close doors before you understand the facts.",
      },
      {
        id: "breakdown",
        label: "Politely ask for a salary breakdown and confirm it meets the regional minimum wage.",
        outcome: "good",
        score: 100,
        delta: { teamTrust: 8, stress: -12, reputation: 18, career: 24 },
        feedback: "Good call. A professional salary question is reasonable and evidence-based.",
      },
    ],
    suggestedResponse: {
      sayTo: "HR representative, before signing the offer letter",
      message:
        "Thank you for the offer. I'm genuinely interested in the role. Before I confirm, could you share a breakdown of how the salary is structured and confirm that it meets the applicable regional minimum wage? I want to make an informed decision.",
    },
  },
  {
    id: 6,
    title: "Leave Discouraged",
    category: "Labour rights",
    cardTone: "navy",
    body:
      'You have been working for several months and want to request annual leave. Your team leader says: "People who take leave during busy periods are not committed."',
    startingMetrics: neutral,
    choices: [
      {
        id: "policy",
        label: "Check the leave policy and submit a professional leave request with enough notice.",
        outcome: "good",
        score: 100,
        delta: { teamTrust: 12, stress: -18, reputation: 18, career: 18 },
        feedback: "Good call. You balanced planning, policy, and professional communication.",
      },
      {
        id: "cancel",
        label: "Cancel your leave plan and avoid asking again.",
        outcome: "partial",
        score: 45,
        delta: { teamTrust: 0, stress: 16, reputation: -4, career: -10 },
        feedback: "Partially right. Avoiding conflict is understandable, but it can normalize pressure.",
      },
      {
        id: "unauthorised",
        label: "Take leave without approval because you believe you are entitled to it.",
        outcome: "risky",
        score: 15,
        delta: { teamTrust: -22, stress: 8, reputation: -18, career: -22 },
        feedback: "Risky choice. Entitlements still need proper process.",
      },
    ],
    suggestedResponse: {
      sayTo: "Your team leader or HR, in writing via email or the official leave system",
      message:
        "I'd like to submit a leave request for [dates]. I've checked the leave policy and I'm giving the required notice in advance. I'm also happy to plan handovers ahead of time to make sure nothing is disrupted while I'm away.",
    },
  },
  {
    id: 7,
    title: "Unsafe Task",
    category: "Workplace ethics",
    cardTone: "pink",
    body:
      'During your internship, you are asked to operate equipment you have never been trained to use. When you hesitate, a colleague says: "Don\'t worry, everyone learns by doing."',
    startingMetrics: neutral,
    choices: [
      {
        id: "blame",
        label: "Refuse loudly and blame the team for being unsafe.",
        outcome: "risky",
        score: 20,
        delta: { teamTrust: -18, stress: 12, reputation: -18, career: -16 },
        feedback: "Risky choice. Safety matters, but blame makes resolution harder.",
      },
      {
        id: "guidance",
        label: "Explain you have not been trained and ask for guidance or an alternative task.",
        outcome: "good",
        score: 100,
        delta: { teamTrust: 12, stress: -12, reputation: 18, career: 20 },
        feedback: "Good call. You protected safety and kept the conversation practical.",
      },
      {
        id: "try",
        label: "Try to operate the equipment anyway so you do not look incapable.",
        outcome: "partial",
        score: 35,
        delta: { teamTrust: -8, stress: 18, reputation: -8, career: -14 },
        feedback: "Partially right only in intent. Proving yourself is not worth unsafe work.",
      },
    ],
    suggestedResponse: {
      sayTo: "The colleague or supervisor who assigned the task, immediately and calmly",
      message:
        "I want to help with this task, but I haven't received training on this equipment yet. I wouldn't feel safe operating it without proper guidance. Could someone walk me through it first, or is there an alternative task I can take on in the meantime?",
    },
  },
  {
    id: 8,
    title: "Treated as Cheap Labour",
    category: "Workplace ethics",
    cardTone: "pink",
    body:
      "You joined an internship expecting to learn marketing, but after two months, you only do repetitive admin tasks. There is no supervision, no feedback, and no clear learning outcomes.",
    startingMetrics: neutral,
    choices: [
      {
        id: "secretly-stop",
        label: "Stop doing admin tasks without telling anyone.",
        outcome: "risky",
        score: 15,
        delta: { teamTrust: -20, stress: 10, reputation: -18, career: -18 },
        feedback: "Risky choice. Quietly stopping work does not solve the placement problem.",
      },
      {
        id: "silent",
        label: "Stay silent because interns should accept any task.",
        outcome: "partial",
        score: 35,
        delta: { teamTrust: 0, stress: 16, reputation: -8, career: -12 },
        feedback: "Partially right. Some admin work is normal, but learning goals need attention.",
      },
      {
        id: "checkin",
        label: "Request a check-in to clarify learning goals and ask for more relevant tasks.",
        outcome: "good",
        score: 100,
        delta: { teamTrust: 10, stress: -12, reputation: 16, career: 24 },
        feedback: "Good call. A clear check-in turns frustration into a constructive request.",
      },
    ],
    suggestedResponse: {
      sayTo: "Your direct supervisor, in a private one-on-one meeting or via message",
      message:
        "I've really enjoyed being part of the team and I'm glad to help with admin work. I'd love to also get some exposure to marketing tasks so I can meet the learning objectives of my internship. Could we schedule a quick check-in to align on my goals and how I can contribute more broadly?",
    },
  },
  {
    id: 9,
    title: "Sick Leave Pressure",
    category: "Workplace ethics",
    cardTone: "pink",
    body:
      'You are sick and have a medical certificate, but your supervisor messages you: "Can you still join meetings online? It will only take a few hours."',
    startingMetrics: neutral,
    choices: [
      {
        id: "work",
        label: "Work the whole day while sick to prove your commitment.",
        outcome: "partial",
        score: 45,
        delta: { teamTrust: 4, stress: 22, reputation: 0, career: -8 },
        feedback: "Partially right. Commitment is valued, but sick leave exists for recovery.",
      },
      {
        id: "ignore",
        label: "Ignore all messages from your supervisor.",
        outcome: "risky",
        score: 20,
        delta: { teamTrust: -18, stress: -4, reputation: -16, career: -16 },
        feedback: "Risky choice. You can set boundaries without disappearing.",
      },
      {
        id: "reschedule",
        label: "Explain you are on sick leave, share the medical certificate, and ask if the meeting can be rescheduled.",
        outcome: "good",
        score: 100,
        delta: { teamTrust: 12, stress: -16, reputation: 18, career: 18 },
        feedback: "Good call. You communicated clearly and protected your recovery.",
      },
    ],
    suggestedResponse: {
      sayTo: "Your supervisor, by message on the day you are sick",
      message:
        "I'm on approved sick leave today and have submitted my medical certificate. I want to be transparent about my situation rather than work through illness. Is it possible to reassign the meeting or reschedule it? I'll follow up on everything as soon as I'm back.",
    },
  },
  {
    id: 10,
    title: "Workplace AI",
    category: "Workplace ethics",
    cardTone: "pink",
    body:
      "You use an AI tool to draft a report for your manager. The output looks professional and well-structured. You are running short on time and your manager needs it within the hour.",
    startingMetrics: { teamTrust: 18, stress: 38, reputation: 18, career: 18 },
    choices: [
      {
        id: "submit",
        label: "Submit the report as generated because it looks professional and you trust the AI output.",
        outcome: "partial",
        score: 45,
        delta: { teamTrust: -4, stress: -6, reputation: -6, career: -8 },
        feedback: "Partially right. AI can help draft, but you remain responsible for accuracy.",
      },
      {
        id: "verify",
        label: "Review and verify all key facts, data, and sources before submitting, even if it takes extra time.",
        outcome: "good",
        score: 100,
        delta: { teamTrust: 16, stress: 6, reputation: 22, career: 22 },
        feedback: "Good call. Verification protects your credibility and your manager's decision.",
      },
      {
        id: "remove-sources",
        label: "Submit the report but remove all references and sources so no one can check the information.",
        outcome: "risky",
        score: 5,
        delta: { teamTrust: -24, stress: 12, reputation: -26, career: -24 },
        feedback: "Risky choice. Hiding sources is an integrity problem.",
      },
    ],
    suggestedResponse: {
      sayTo: "Your manager, before submitting",
      message:
        "I've used an AI tool to draft this report and I've reviewed and verified the key data points. Here is the final version, let me know if you'd like me to double-check any section. AI assists, humans verify. No matter what tool you use, you remain accountable for the accuracy and integrity of anything you submit under your name.",
    },
  },
  {
    id: 11,
    title: "Discriminatory Comment",
    category: "Workplace ethics",
    cardTone: "pink",
    body:
      'In a team meeting, a colleague makes a negative comment about another student\'s background and says: "People like that usually don\'t fit our workplace culture." Everyone becomes quiet.',
    startingMetrics: neutral,
    choices: [
      {
        id: "insult",
        label: "Publicly insult the colleague in front of the whole team.",
        outcome: "risky",
        score: 20,
        delta: { teamTrust: -20, stress: 12, reputation: -18, career: -16 },
        feedback: "Risky choice. Calling out harm matters, but insults can escalate the situation.",
      },
      {
        id: "calm",
        label: "Respond calmly, say the comment may be inappropriate, and seek HR support if needed.",
        outcome: "good",
        score: 100,
        delta: { teamTrust: 12, stress: -10, reputation: 20, career: 20 },
        feedback: "Good call. Calm intervention supports inclusion and keeps the issue addressable.",
      },
      {
        id: "nothing",
        label: "Say nothing because it is not about you.",
        outcome: "partial",
        score: 35,
        delta: { teamTrust: -8, stress: 4, reputation: -6, career: -8 },
        feedback: "Partially right. Staying safe matters, but silence can leave harm unchallenged.",
      },
    ],
    suggestedResponse: {
      sayTo: "The colleague who made the comment, calmly and directly in the moment; then follow up with HR if it continues",
      message:
        "I want to flag that comment may not have come across the way it was intended. I'd feel more comfortable if we kept our discussions focused on the work. If this comes up again, I'd like to raise it with HR so we can make sure everyone feels respected in this space.",
    },
  },
];

export const initialMetrics: Metrics = {
  teamTrust: 42,
  stress: 42,
  reputation: 42,
  career: 42,
};

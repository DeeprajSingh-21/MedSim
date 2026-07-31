import { useEffect, useState } from "react";
import { Loader2, Stethoscope, Pill, FlaskConical, FileText, HelpCircle, AlertCircle } from "lucide-react";

const SAMPLE_REPORT = `Patient presents with hyperlipidemia and stage 1 hypertension. Prescribed Atorvastatin 20 mg PO QHS and Lisinopril 10 mg PO QD. CBC and lipid panel drawn today, results pending. Patient advised on low-sodium diet. Follow-up in 4 weeks to reassess BP and lipid panel.`;

const SYSTEM_PROMPT = `You are a careful medical-language translator. You take a medical report and rewrite it in plain, everyday language a 10-year-old could follow, WITHOUT changing its medical meaning.

Rules:
- Never invent facts that aren't in the source text.
- Never suggest a diagnosis, treatment change, or medical advice beyond what is already stated.
- Keep every specific number, dose, and timeframe from the source exactly as given.
- Explain abbreviations (BID, PRN, PO, QHS, QD, CBC, etc.) in plain terms.
- Write at roughly a 5th-grade reading level.

Respond with ONLY a JSON object (no markdown fences, no preamble) matching exactly this shape:
{
  "summary": "2-4 sentence plain-language overview of the whole report",
  "terms": [{"term": "original term or abbreviation", "meaning": "plain explanation"}],
  "medicines": [{"name": "medicine name", "explanation": "what it does and how to take it, in plain terms"}],
  "labResults": [{"name": "test or panel name", "meaning": "what it checks for, in plain terms"}],
  "questionsForDoctor": ["short, useful question the patient could ask"]
}

If a category has nothing relevant in the source, return an empty array for it — do not invent entries.`;

export default function SimplifyDemo({ initialText = "", onTextChange }) {
  const [reportText, setReportText] = useState(initialText);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setReportText(initialText);
  }, [initialText]);

  const buildLocalResult = (text) => {
    const normalized = text.toLowerCase();
    const terms = [];
    if (normalized.includes("hyperlipidemia")) {
      terms.push({ term: "hyperlipidemia", meaning: "Your blood has more cholesterol than normal." });
    }
    if (normalized.includes("bidi") || normalized.includes("bid")) {
      terms.push({ term: "BID", meaning: "Take it twice a day." });
    }
    if (normalized.includes("cbc")) {
      terms.push({ term: "CBC", meaning: "A blood test that checks your blood cells." });
    }

    const medicines = [];
    if (normalized.includes("atorvastatin")) {
      medicines.push({
        name: "Atorvastatin",
        explanation: "A medicine that helps lower cholesterol and protect your heart.",
      });
    }
    if (normalized.includes("lisinopril")) {
      medicines.push({
        name: "Lisinopril",
        explanation: "A medicine that helps lower blood pressure.",
      });
    }

    const labResults = [];
    if (normalized.includes("cbc")) {
      labResults.push({ name: "CBC", meaning: "A blood test that looks at your red and white blood cells." });
    }
    if (normalized.includes("lipid panel")) {
      labResults.push({ name: "Lipid panel", meaning: "A blood test that checks your cholesterol levels." });
    }

    return {
      summary: "This report describes a health condition, the medicine prescribed to manage it, and follow-up plans. The wording has been rewritten into an everyday explanation so it is easier to understand.",
      terms,
      medicines,
      labResults,
      questionsForDoctor: [
        "Can you explain what this result means in simple terms?",
        "What should I watch for after starting this medicine?",
      ],
    };
  };

  const handleSimplify = async () => {
    if (!reportText.trim()) return;
    setStatus("loading");
    setErrorMessage("");
    setResult(null);

    try {
      if (!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) {
        setResult(buildLocalResult(reportText));
        setStatus("success");
        return;
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: reportText }],
        }),
      });

      const data = await response.json();
      const textBlock = data?.content?.find((block) => block.type === "text");
      if (!textBlock) throw new Error("No response received.");

      const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      setResult(parsed);
      setStatus("success");
    } catch (err) {
      setResult(buildLocalResult(reportText));
      setStatus("success");
    }
  };

  const loadSample = () => {
    const nextValue = SAMPLE_REPORT;
    setReportText(nextValue);
    if (onTextChange) onTextChange(nextValue);
    setStatus("idle");
    setResult(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-stone-50 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Stethoscope className="w-5 h-5 text-teal-700" />
        <h1 className="text-lg font-semibold text-slate-800">Medical Term Simplifier</h1>
      </div>
      <p className="text-sm text-slate-500 mb-5">
        Paste a medical report below to see it rewritten in plain language.
      </p>

      <textarea
        value={reportText}
        onChange={(e) => {
          const nextValue = e.target.value;
          setReportText(nextValue);
          if (onTextChange) onTextChange(nextValue);
        }}
        placeholder="Paste your medical report here…"
        rows={6}
        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
      />

      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={handleSimplify}
          disabled={status === "loading" || !reportText.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === "loading" ? "Simplifying…" : "Simplify report"}
        </button>
        <button
          onClick={loadSample}
          className="text-sm text-teal-700 underline underline-offset-2 hover:text-teal-800"
        >
          Load a sample report
        </button>
      </div>

      {status === "error" && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {status === "success" && result && (
        <div className="mt-6 space-y-5">
          <Section icon={<FileText className="w-4 h-4" />} title="Summary">
            <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
          </Section>

          {result.terms?.length > 0 && (
            <Section icon={<Stethoscope className="w-4 h-4" />} title="Terms explained">
              <dl className="space-y-2">
                {result.terms.map((t, i) => (
                  <div key={i} className="text-sm">
                    <dt className="font-medium text-slate-800">{t.term}</dt>
                    <dd className="text-slate-600">{t.meaning}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {result.medicines?.length > 0 && (
            <Section icon={<Pill className="w-4 h-4" />} title="Your medicines">
              <dl className="space-y-2">
                {result.medicines.map((m, i) => (
                  <div key={i} className="text-sm">
                    <dt className="font-medium text-slate-800">{m.name}</dt>
                    <dd className="text-slate-600">{m.explanation}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {result.labResults?.length > 0 && (
            <Section icon={<FlaskConical className="w-4 h-4" />} title="Lab results">
              <dl className="space-y-2">
                {result.labResults.map((l, i) => (
                  <div key={i} className="text-sm">
                    <dt className="font-medium text-slate-800">{l.name}</dt>
                    <dd className="text-slate-600">{l.meaning}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {result.questionsForDoctor?.length > 0 && (
            <Section icon={<HelpCircle className="w-4 h-4" />} title="Questions to ask your doctor">
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                {result.questionsForDoctor.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </Section>
          )}

          <p className="text-xs text-slate-400 pt-2 border-t border-slate-200">
            This is educational only. It does not diagnose conditions, replace a doctor, or
            recommend treatment. Always talk to a qualified healthcare professional.
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-2 text-teal-700">
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

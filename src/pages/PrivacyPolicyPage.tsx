import privacyPolicyText from "../../PRIVACY_POLICY.txt?raw";

function renderSections(text: string) {
  return text.split("\n\n").map((block, index) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    if (index === 0) {
      return <h1 key={index} className="text-3xl font-bold tracking-tight">{trimmed}</h1>;
    }

    if (trimmed.startsWith("Last updated:")) {
      return <p key={index} className="text-sm text-muted-foreground">{trimmed}</p>;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      return <h2 key={index} className="text-lg font-semibold">{trimmed}</h2>;
    }

    return <p key={index} className="whitespace-pre-line leading-7 text-sm text-foreground/90">{trimmed}</p>;
  });
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl space-y-4 px-4 py-10 sm:px-6">
      {renderSections(privacyPolicyText)}
    </div>
  );
}

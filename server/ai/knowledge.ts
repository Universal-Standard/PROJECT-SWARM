export interface ExtractedLearning {
  category: string;
  content: string;
  context?: string;
  confidence: number;
}

function clampConfidence(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function scoreLearning(baseConfidence: number, content: string, context?: string): number {
  const lengthBoost = Math.min(12, Math.floor(content.length / 40));
  const contextBoost = context ? 4 : 0;
  const structureBoost = /(?:because|therefore|when|if|should|avoid|use)\b/i.test(content) ? 4 : 0;

  return clampConfidence(baseConfidence + lengthBoost + contextBoost + structureBoost);
}

export function extractKnowledgeLearnings(response: string): ExtractedLearning[] {
  const learnings: ExtractedLearning[] = [];
  const dedupe = new Set<string>();

  const pushLearning = (
    category: string,
    content: string | undefined,
    baseConfidence: number,
    context?: string
  ) => {
    const normalized = content?.trim();
    if (!normalized || normalized.length < 10) return;

    const key = `${category}:${normalized.toLowerCase()}`;
    if (dedupe.has(key)) return;
    dedupe.add(key);

    learnings.push({
      category,
      content: normalized,
      context,
      confidence: scoreLearning(baseConfidence, normalized, context),
    });
  };

  const learningPatterns = [
    /(?:learned|discovered|found|realized):\s*(.+?)(?:\n|$)/gi,
    /(?:key insight|important):\s*(.+?)(?:\n|$)/gi,
    /(?:best practice|tip|recommendation):\s*(.+?)(?:\n|$)/gi,
  ];

  for (const pattern of learningPatterns) {
    const matches = response.matchAll(pattern);
    for (const match of matches) {
      pushLearning("general", match[1], 72);
    }
  }

  const codePattern = /```[\w]*\n([\s\S]+?)```/g;
  const codeMatches = response.matchAll(codePattern);
  for (const match of codeMatches) {
    pushLearning("coding", match[1], 82, "Code example from execution");
  }

  const conclusionPattern = /(?:in conclusion|summary|to summarize|overall):\s*(.+?)(?:\n\n|$)/gis;
  const conclusionMatches = response.matchAll(conclusionPattern);
  for (const match of conclusionMatches) {
    pushLearning("general", match[1], 78);
  }

  return learnings;
}

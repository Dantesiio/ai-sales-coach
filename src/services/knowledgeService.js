import knowledgeBase from '../data/knowledgeBase';

const tokenize = (text = '') =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9ñ]+/)
    .filter(Boolean);

const buildQueryTokens = ({ userInput = '', stageInfo = {}, diagnosticData = {} }) => {
  const tokens = new Set(tokenize(userInput));

  if (stageInfo?.id) {
    tokenize(stageInfo.id).forEach((token) => tokens.add(token));
    tokenize(stageInfo.title || '').forEach((token) => tokens.add(token));
  }

  Object.values(diagnosticData || {}).forEach((value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach((item) => tokenize(item).forEach((token) => tokens.add(token)));
    } else if (typeof value === 'string') {
      tokenize(value).forEach((token) => tokens.add(token));
    }
  });

  return Array.from(tokens);
};

const scoreDocument = (doc, queryTokens) => {
  let score = 0;
  const docTokens = new Set(tokenize(`${doc.title} ${doc.content} ${(doc.tags || []).join(' ')}`));

  queryTokens.forEach((token) => {
    if (docTokens.has(token)) {
      score += 2;
    }
  });

  (doc.tags || []).forEach((tag) => {
    if (queryTokens.includes(tag)) {
      score += 3;
    }
  });

  return score;
};

const formatSnippet = (doc) => {
  const maxLength = 360;
  const trimmedContent = doc.content.length > maxLength ? `${doc.content.slice(0, maxLength)}…` : doc.content;
  return `• ${doc.title}: ${trimmedContent}`;
};

export const getRelevantKnowledge = ({ userInput, stageInfo, diagnosticData, maxItems = 3 }) => {
  const queryTokens = buildQueryTokens({ userInput, stageInfo, diagnosticData });
  if (queryTokens.length === 0) return '';

  const scored = knowledgeBase
    .map((doc) => ({ doc, score: scoreDocument(doc, queryTokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map(({ doc }) => formatSnippet(doc));

  if (scored.length === 0) {
    const defaultDoc = knowledgeBase.find((doc) => doc.tags?.includes(stageInfo?.id));
    return defaultDoc ? formatSnippet(defaultDoc) : '';
  }

  return scored.join('\n');
};

export const getKnowledgeTitles = () => knowledgeBase.map((doc) => doc.title);

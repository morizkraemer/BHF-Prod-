/**
 * Name similarity helper for person-name catalogs.
 * Used to suggest similar existing names and avoid duplicate entries from typos.
 * Exposed on window.NameSimilarity for use in components (no bundler).
 */

function levenshteinDistance(a, b) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function similarity(a, b) {
  if (!a || !b) return 0;
  const sa = (a || '').trim().toLowerCase();
  const sb = (b || '').trim().toLowerCase();
  if (!sa.length && !sb.length) return 1;
  if (!sa.length || !sb.length) return 0;
  const dist = levenshteinDistance(sa, sb);
  const maxLen = Math.max(sa.length, sb.length);
  return 1 - dist / maxLen;
}

function findSimilarNames(typedName, catalog, threshold = 0.6, maxResults = 5) {
  if (!typedName || !typedName.trim() || !Array.isArray(catalog) || catalog.length === 0) {
    return [];
  }
  const trimmed = typedName.trim().toLowerCase();
  const results = [];
  for (const item of catalog) {
    const name = (item.name || '').trim();
    if (!name) continue;
    const nameLower = name.toLowerCase();
    if (nameLower === trimmed || nameLower.includes(trimmed) || trimmed.includes(nameLower)) {
      continue;
    }
    const score = similarity(trimmed, name);
    if (score >= threshold) {
      results.push({ id: item.id, name, score });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
}

window.NameSimilarity = {
  similarity,
  findSimilarNames,
  levenshteinDistance
};

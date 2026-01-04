// 전역 네임스페이스: window.DC.loadRules / window.DC.classify 로 접근
(() => {
  const toWikiSlug = (name) => {
    const base = (name || "").trim().replace(/\s+/g, "_");
    return encodeURIComponent(base);
  };

  const expandRule = (rule) => {
    const slug = toWikiSlug(rule.name);
    const pageUrl = rule.pageUrl
      ? rule.pageUrl.replace("${slug}", slug)
      : `https://dragcave.fandom.com/wiki/${slug}`;
    return { ...rule, pageUrl };
  };

  const loadRules = async () => {
    const { eggData } = await chrome.storage.sync.get(["eggData"]);
    if (Array.isArray(eggData) && eggData.length) return eggData.map(expandRule);
    try {
      const url = chrome.runtime.getURL("data/eggData.json");
      const res = await fetch(url);
      const json = await res.json();
      const rules = Array.isArray(json.rules) ? json.rules : [];
      return rules.map(expandRule);
    } catch {
      return [];
    }
  };

  const norm = (s) => (s || "").toLowerCase();
  const includesAny = (text, arr = []) => arr.some((t) => text.includes(norm(t)));
  const includesAll = (text, arr = []) => arr.length > 0 && arr.every((t) => text.includes(norm(t)));

  // 우선순위: phrases > keywords-all > keywords-some (첫 매칭 승)
  const classify = (description, rules) => {
    const text = norm(description);

    const pickMeta = (rule) => ({
      id: rule.id,
      name: rule.name,
      eggImageUrl: rule.eggImageUrl,
      adultImageUrl: rule.adultImageUrl,
      pageUrl: rule.pageUrl
    });

    const phraseHit = rules.find((r) => includesAny(text, r.phrases || []));
    if (phraseHit) return { best: pickMeta(phraseHit), reason: "phrases" };

    const allKeywordHit = rules.find((r) => includesAll(text, r.keywords || []));
    if (allKeywordHit) return { best: pickMeta(allKeywordHit), reason: "keywords-all" };

    const someKeywordHit = rules.find((r) => includesAny(text, r.keywords || []));
    if (someKeywordHit) return { best: pickMeta(someKeywordHit), reason: "keywords-some" };

    return { best: null, reason: "none" };
  };

  window.DC = { loadRules, classify };
})();

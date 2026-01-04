const normalizeText = (s) =>
  String(s || "")
    .replace(/\s+/g, " ")
    .replace(/\u00A0/g, " ")
    .trim();

const expandRule = (rule) => {
  // pattern을 정규식 문자열로 저장한다고 가정
  // 예: "foo\\."  -> new RegExp("^foo\\.$", "i") 같은 식으로 강화 가능
  const re = new RegExp(rule.pattern, "i");
  return { ...rule, re };
};

export const loadRules = async () => {
  const { eggData } = await chrome.storage.sync.get(["eggData"]);
  if (Array.isArray(eggData) && eggData.length) return eggData.map(expandRule);

  const url = chrome.runtime.getURL("../data/eggData.json");
  const res = await fetch(url);
  const json = await res.json();

  const rules = Array.isArray(json.rules) ? json.rules : [];
  return rules.map(expandRule);
};

export const matchRules = (rules, descriptionText) => {
  const text = normalizeText(descriptionText);

  // 1) 정규식 매칭
  // for (const rule of rules) {
  //   if (rule.re.test(text)) return { rule, text };
  // }

  // 2) (옵션) 너무 빡세면 includes 기반 완화 매칭도 가능
  for (const rule of rules) {
    const pat = rule.pattern.replace(/\\./g, ".").replace(/\\s+/g, " ");
    if (text.toLowerCase().includes(pat.toLowerCase())) return { rule, text };
  }

  return null;
};
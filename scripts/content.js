// div.eggs 아래에서만 동작
const CONTAINER_SELECTOR = "div.eggs";

// 컨테이너 내부에서만 찾을 셀렉터들
const DESCRIPTION_SELECTORS = [
  ".egg-description",
  ".view-egg .description",
  "p.description",
  "#egg-desc"
];

const getEggContainers = () =>
  Array.from(document.querySelectorAll(CONTAINER_SELECTOR));

const findDescriptionElsIn = (root) => {
  const nodes = new Set();

  // 명시 셀렉터들 우선
  DESCRIPTION_SELECTORS.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => {
      if (el && el.textContent?.trim()) nodes.add(el);
    });
  });

  // fallback: 의미 있는 문구가 들어있는 <p> (root 하위만)
  if (!nodes.size) {
    root.querySelectorAll("p").forEach((p) => {
      if (/egg|shell|glow|hot|wet|rough/i.test(p.textContent || "")) nodes.add(p);
    });
  }

  return Array.from(nodes);
};

const createTooltip = () => {
  const tip = document.createElement("div");
  tip.id = "dc-egg-tooltip";
  tip.style.cssText = `
    position: fixed; z-index: 2147483647;
    min-width: 220px; max-width: 340px;
    background: #111; color: #fff;
    padding: 10px 12px; border-radius: 10px;
    box-shadow: 0 10px 24px rgba(0,0,0,.35);
    font-family: system-ui,-apple-system,Segoe UI,Roboto,Arial;
    font-size: 12px; line-height: 1.35;
    display: none; pointer-events: none;
  `;
  tip.innerHTML = `
    <div style="display:flex; gap:10px; align-items:center">
      <img id="dc-egg-tip-img" width="44" height="44"
           style="border-radius:8px; object-fit:cover; background:#222"
           referrerpolicy="no-referrer" crossorigin="anonymous" />
      <div style="display:flex; flex-direction:column; gap:2px">
        <div id="dc-egg-tip-name" style="font-weight:600"></div>
        <a id="dc-egg-tip-link" target="_blank" rel="noopener"
           style="color:#9bd; text-decoration:none; pointer-events:auto">열기</a>
      </div>
    </div>
  `;
  document.documentElement.appendChild(tip);
  return tip;
};

let tooltip;

const ensureTooltip = () => {
  if (tooltip && document.body.contains(tooltip)) return tooltip;
  tooltip = createTooltip();
  return tooltip;
};

const setTooltipContent = (best) => {
  const img = tooltip.querySelector("#dc-egg-tip-img");
  const name = tooltip.querySelector("#dc-egg-tip-name");
  const link = tooltip.querySelector("#dc-egg-tip-link");

  if (best?.eggImageUrl) {
    img.src = best.eggImageUrl;
    img.style.display = "block";
  } else {
    img.removeAttribute("src");
    img.style.display = "none";
  }
  name.textContent = best?.name || "알 정보 없음";
  if (best?.pageUrl) {
    link.href = best.pageUrl;
    link.style.display = "inline";
  } else {
    link.removeAttribute("href");
    link.style.display = "none";
  }
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const positionTooltip = (x, y) => {
  const pad = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = tooltip.getBoundingClientRect();
  let left = x + pad;
  let top = y + pad;
  if (left + rect.width > vw - 6) left = vw - rect.width - 6;
  if (top + rect.height > vh - 6) top = vh - rect.height - 6;
  left = clamp(left, 6, vw - rect.width - 6);
  top = clamp(top, 6, vh - rect.height - 6);
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
};

const classifyFromEl = async (el, api) => {
  const desc = el?.textContent?.trim() || "";
  if (!desc) return { best: null };
  const rules = await api.loadRules();
  return api.classifyEgg(desc, rules);
};

const bindHover = (el, api) => {
  if (el.__dc_bound__) return;
  el.__dc_bound__ = true;

  let lastMove = 0;

  const onEnter = async (e) => {
    ensureTooltip();
    const { best } = await classifyFromEl(el, api);
    setTooltipContent(best);
    tooltip.style.display = "block";
    positionTooltip(e.clientX, e.clientY);
  };

  const onMove = (e) => {
    const now = performance.now();
    if (now - lastMove < 8) return;
    lastMove = now;
    if (tooltip?.style.display === "block") positionTooltip(e.clientX, e.clientY);
  };

  const onLeave = () => { if (tooltip) tooltip.style.display = "none"; };

  el.addEventListener("mouseenter", onEnter);
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);
};

const scanAndBind = (api) => {
  // div.eggs 컨테이너들만 순회
  const containers = getEggContainers();
  if (!containers.length) return;

  containers.forEach((root) => {
    findDescriptionElsIn(root).forEach((el) => bindHover(el, api));
  });
};

const init = async () => {
  // 동적 import로 ES 모듈 사용
  const { loadRules }   = await import(chrome.runtime.getURL("scripts/rules.js"));
  const { classifyEgg } = await import(chrome.runtime.getURL("scripts/classifier.js"));
  const api = { loadRules, classifyEgg };

  ensureTooltip();
  scanAndBind(api);

  // 변화 감지는 div.eggs 하위만 관찰
  const observers = [];
  getEggContainers().forEach((root) => {
    const mo = new MutationObserver(() => scanAndBind(api));
    mo.observe(root, { childList: true, subtree: true });
    observers.push(mo);
  });

  // 혹시 나중에 div.eggs가 동적 생성될 수도 있으니, 문서 레벨에서도 한 번 감시해서 컨테이너 등장시 재바인딩
  const rootMO = new MutationObserver(() => {
    if (getEggContainers().length) {
      scanAndBind(api);
    }
  });
  rootMO.observe(document.documentElement, { childList: true, subtree: true });
};

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", init)
  : init();

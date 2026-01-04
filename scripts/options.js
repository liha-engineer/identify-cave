const createRow = (rule = {
  id:"", name:"", phrases:[], keywords:[], eggImageUrl:"", adultImageUrl:"", pageUrl:""
}) => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" class="id" value="${rule.id || ""}"></td>
    <td><input type="text" class="name" value="${rule.name || ""}"></td>
    <td><textarea class="phrases">${(rule.phrases || []).join("\n")}</textarea></td>
    <td><textarea class="keywords">${(rule.keywords || []).join("\n")}</textarea></td>
    <td><input type="text" class="eggImageUrl" value="${rule.eggImageUrl || ""}"></td>
    <td><input type="text" class="adultImageUrl" value="${rule.adultImageUrl || ""}"></td>
    <td><input type="text" class="pageUrl" value="${rule.pageUrl || ""}"></td>
    <td><button class="del">삭제</button></td>
  `;
  tr.querySelector(".del").addEventListener("click", () => tr.remove());
  return tr;
};

const readTable = () => {
  const rows = Array.from(document.querySelectorAll("#rules tbody tr"));
  return rows.map(tr => {
    const val = (sel) => tr.querySelector(sel).value.trim();
    const list = (sel) => val(sel).split("\n").map(s => s.trim()).filter(Boolean);
    return {
      id: val(".id"),
      name: val(".name"),
      phrases: list(".phrases"),
      keywords: list(".keywords"),
      eggImageUrl: val(".eggImageUrl"),
      adultImageUrl: val(".adultImageUrl"),
      pageUrl: val(".pageUrl")
    };
  }).filter(r => r.id && r.name);
};

const writeTable = (rules) => {
  const tbody = document.querySelector("#rules tbody");
  tbody.innerHTML = "";
  (rules || []).forEach(rule => tbody.appendChild(createRow(rule)));
};

const loadSeedIfEmpty = async () => {
  const url = chrome.runtime.getURL("data/eggData.json");
  const res = await fetch(url);
  const json = await res.json();
  return Array.isArray(json.rules) ? json.rules : [];
};

const load = () => {
  chrome.storage.sync.get(["eggData"], async (res) => {
    const rules = Array.isArray(res.eggData) && res.eggData.length ? res.eggData : await loadSeedIfEmpty();
    writeTable(rules);
  });
};

document.getElementById("add").addEventListener("click", () => {
  document.querySelector("#rules tbody").appendChild(createRow());
});

document.getElementById("save").addEventListener("click", () => {
  const rules = readTable();
  chrome.storage.sync.set({ eggData: rules }, () => alert("저장했습니다."));
});

document.getElementById("reset").addEventListener("click", async () => {
  if (!confirm("기본 규칙으로 초기화할까요? (현재 작성한 내용은 사라집니다)")) return;
  const seed = await loadSeedIfEmpty();
  chrome.storage.sync.set({ eggData: seed }, load);
});

load();

const getNameForUrl = (name) => {
const base = (name || "").trim().replace(/\s+/g, "_");
return encodeURIComponent(base);
}

const makeUrlData = (rule) => {
    const nameParticle = getNameForUrl(rule.name);
    const replaceString = "${nameParticle}";
    const pageUrl = rule.pageUrl?.includes(replaceString)
    ? rule.pageUrl.replace(replaceString, nameParticle)
    : rule.pageUrl || `https://dragcave.fandom.com/wiki/${nameParticle}`

    return {...rule, pageUrl}
}
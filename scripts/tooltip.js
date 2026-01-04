// src/tooltip.js
export const tooltip = (() => {
  let el;

  const ensure = () => {
    if (el) return el;
    el = document.createElement('div');
    el.id = 'dc-tooltip-ext';
    el.style.position = 'fixed';
    el.style.zIndex = '999999';
    el.style.maxWidth = '360px';
    el.style.pointerEvents = 'none';
    el.style.padding = '10px 12px';
    el.style.borderRadius = '10px';
    el.style.background = 'rgba(20,20,20,0.92)';
    el.style.color = '#fff';
    el.style.fontSize = '12px';
    el.style.lineHeight = '1.35';
    el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)';
    el.style.display = 'none';
    document.documentElement.appendChild(el);
    return el;
  };

  const show = (html, x, y) => {
    const node = ensure();
    node.innerHTML = html;
    node.style.left = `${x + 14}px`;
    node.style.top = `${y + 14}px`;
    node.style.display = 'block';
  };

  const move = (x, y) => {
    if (!el || el.style.display === 'none') return;
    el.style.left = `${x + 14}px`;
    el.style.top = `${y + 14}px`;
  };

  const hide = () => {
    if (!el) return;
    el.style.display = 'none';
    el.innerHTML = '';
  };

  return { show, move, hide };
})();

// Tiny renderer for AI replies: headings, bullet lists, **bold**. Safe — no raw HTML.
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  );
}

export default function Markdown({ text = "" }) {
  const blocks = [];
  let list = null;
  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    const bullet = line.match(/^([-*•]|\d+[.)])\s+(.*)/);
    if (bullet) {
      if (!list) { list = []; blocks.push(<ul key={"u" + i}>{list}</ul>); }
      list.push(<li key={i}>{inline(bullet[2])}</li>);
      return;
    }
    list = null;
    if (!line) return;
    const h = line.match(/^#{1,4}\s+(.*)/);
    if (h) blocks.push(<h4 key={i}>{inline(h[1])}</h4>);
    else blocks.push(<p key={i}>{inline(line)}</p>);
  });
  return <div className="md">{blocks}</div>;
}

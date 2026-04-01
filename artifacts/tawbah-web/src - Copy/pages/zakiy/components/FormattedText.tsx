import React from "react";

const BULLET_EMOJI_PATTERN = /^([✅⚠️💡🎯✨📌🔹🔸➡️⭐🌟💎🕌📿🌙❤️🤲🌿🎉🎊])/;
const NUMBERED_AR = /^([١٢٣٤٥٦٧٨٩٠]+)[.\-\)]/;
const NUMBERED_EN = /^(\d+)[.\-\)]/;
const SECTION_HEADER = /^〔(.+)〕$/;
const SEPARATOR = /^[═─━─]+$/;

function arabicNumToInt(s: string): number {
  return parseInt(s.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))));
}

function renderInline(raw: string): React.ReactNode[] {
  const stripped = raw.replace(/\(\s*ب[^)]*\)/g, "").replace(/\s{2,}/g, " ");
  const parts: React.ReactNode[] = [];
  const boldRe = /\*\*([^*]+)\*\*/g;
  let cursor = 0;
  let m: RegExpExecArray | null;

  function renderPart(t: string, bold: boolean, keyBase: number): React.ReactNode[] {
    if (bold) return [<strong key={keyBase} className="font-bold text-foreground">{t}</strong>];
    return [<span key={keyBase}>{t}</span>];
  }

  while ((m = boldRe.exec(stripped)) !== null) {
    if (m.index > cursor) parts.push(...renderPart(stripped.slice(cursor, m.index), false, cursor));
    parts.push(...renderPart(m[1]!, true, m.index + 10000));
    cursor = m.index + m[0].length;
  }
  if (cursor < stripped.length) parts.push(...renderPart(stripped.slice(cursor), false, cursor + 20000));
  return parts;
}

export function FormattedText({ text, isActivePlaying: _isActivePlaying }: { text: string; isActivePlaying?: boolean }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!.trim();

    if (!line) { elements.push(<div key={i} className="h-1.5" />); i++; continue; }
    if (SEPARATOR.test(line)) { i++; continue; }

    const sectionMatch = SECTION_HEADER.exec(line);
    if (sectionMatch) {
      elements.push(
        <div key={i} className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-[11px] font-bold text-muted-foreground tracking-widest px-2">{sectionMatch[1]}</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>
      );
      i++; continue;
    }

    if (NUMBERED_AR.test(line) || NUMBERED_EN.test(line)) {
      const listItems: string[] = [];
      let startNum = 1;
      let firstItem = true;
      while (i < lines.length) {
        const l = lines[i]!.trim();
        if (!l) { i++; continue; }
        if (!NUMBERED_AR.test(l) && !NUMBERED_EN.test(l)) break;
        i++;
        if (firstItem) {
          const arMatch = NUMBERED_AR.exec(l);
          const enMatch = NUMBERED_EN.exec(l);
          const numStr = arMatch ? arMatch[1]! : enMatch ? enMatch[1]! : "1";
          const parsed = /[١٢٣٤٥٦٧٨٩٠]/.test(numStr) ? arabicNumToInt(numStr) : parseInt(numStr);
          startNum = isNaN(parsed) ? 1 : parsed;
          firstItem = false;
        }
        const content = l.replace(/^[١٢٣٤٥٦٧٨٩٠\d]+[.\-\)]\s*/, "");
        if (content.trim()) listItems.push(content);
      }
      if (listItems.length > 0) {
        elements.push(
          <ol key={`list-${i}`} className="space-y-2 my-2.5 pr-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-[13px] leading-relaxed">
                <span
                  className="flex-shrink-0 w-[22px] h-[22px] rounded-full text-white text-[10px] font-bold flex items-center justify-center mt-0.5 shadow-sm"
                  style={{ background: "linear-gradient(135deg,#059669,#0d9488)" }}
                >
                  {startNum + idx}
                </span>
                <span className="flex-1 pt-0.5">{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        );
      }
      continue;
    }

    if (line.startsWith("•") || line.startsWith("·") || BULLET_EMOJI_PATTERN.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const l = lines[i]!.trim();
        if (l.startsWith("•") || l.startsWith("·") || BULLET_EMOJI_PATTERN.test(l)) {
          const emojiMatch = BULLET_EMOJI_PATTERN.exec(l);
          const icon = emojiMatch ? emojiMatch[1] : "•";
          const content = l.replace(/^[•·]\s*/, "").replace(/^[✅⚠️💡🎯✨📌🔹🔸➡️⭐🌟💎🕌📿🌙❤️🤲🌿🎉🎊]\s*/, "");
          listItems.push(`${icon}|||${content}`);
          i++;
        } else break;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-2">
          {listItems.map((item, idx) => {
            const [icon, ...rest] = item.split("|||");
            const content = rest.join("|||");
            const isBullet = icon === "•" || icon === "·";
            return (
              <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
                <span className="flex-shrink-0 mt-0.5 text-base">
                  {isBullet ? <span className="text-teal-500 font-bold">•</span> : icon}
                </span>
                <span className="flex-1">{renderInline(content!)}</span>
              </li>
            );
          })}
        </ul>
      );
      continue;
    }

    elements.push(
      <p key={i} className="text-[13px] leading-relaxed">{renderInline(line)}</p>
    );
    i++;
  }

  return (
    <div className="space-y-0.5">
      {elements}
    </div>
  );
}

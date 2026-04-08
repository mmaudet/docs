interface GwederProperties {
  ref: string;
  date: string;
  expires_at: string;
  audience: string[];
  auteur: string;
  emetteur_nom: string;
  emetteur_siret: string;
  destinataire: string;
}

interface BlockContent {
  type: string;
  text?: string;
  styles?: Record<string, boolean>;
  [key: string]: unknown;
}

interface Block {
  id: string;
  type: string;
  props: { classification?: string; level?: number; [key: string]: unknown };
  content: BlockContent[];
  children: Block[];
}

const CLASSIFICATION_ORDER: Record<string, number> = {
  PUBLIC: 0, RESTREINT: 1, CONFIDENTIEL: 2, SECRET: 3,
};

function escapeTypst(text: string): string {
  return text.replace(/[#@\\]/g, "\\$&");
}

function inlineContentToTypst(content: BlockContent[]): string {
  return content
    .map((c) => {
      if (c.type !== "text" || !c.text) return "";
      const escaped = escapeTypst(c.text);
      const bold = c.styles?.bold;
      const italic = c.styles?.italic;
      if (bold && italic) return `*_${escaped}_*`;
      if (bold) return `*${escaped}*`;
      if (italic) return `_${escaped}_`;
      return escaped;
    })
    .join("");
}

function highestClassification(blocks: Block[]): string {
  let max = 0;
  for (const block of blocks) {
    const level = CLASSIFICATION_ORDER[block.props.classification ?? "PUBLIC"] ?? 0;
    if (level > max) max = level;
  }
  return Object.entries(CLASSIFICATION_ORDER).find(([, v]) => v === max)?.[0] ?? "PUBLIC";
}

export function blocksToGwederTypst(
  blocks: Block[],
  properties: GwederProperties,
  documentTitle: string,
): string {
  const classification = highestClassification(blocks);
  const lines: string[] = [];

  lines.push('#import "lib/core.typ": gweder-page, classification-badge');
  lines.push('#import "lib/formatting.typ": format-date');
  lines.push("");
  lines.push("#show: gweder-page.with(");
  lines.push(`  doc-ref: "${escapeTypst(properties.ref)}",`);
  lines.push(`  doc-date: "${properties.date}",`);
  lines.push(`  classification: "${classification}",`);
  lines.push(")");
  lines.push("");
  lines.push("#align(center)[");
  lines.push(`  #text(size: 20pt, weight: "bold")[${escapeTypst(documentTitle)}]`);
  lines.push("  #v(0.5em)");
  lines.push(`  #text(size: 12pt)[${escapeTypst(properties.emetteur_nom)} — #format-date("${properties.date}")]`);
  if (properties.destinataire) {
    lines.push("  #v(0.5em)");
    lines.push(`  #text(size: 11pt, fill: gray)[Destinataire : ${escapeTypst(properties.destinataire)}]`);
  }
  lines.push("]");
  lines.push("");
  lines.push("#pagebreak()");
  lines.push("");

  for (const block of blocks) {
    const cls = block.props.classification ?? "PUBLIC";
    switch (block.type) {
      case "heading": {
        const level = block.props.level ?? 1;
        const text = inlineContentToTypst(block.content);
        lines.push(`#heading(level: ${level})[${text} #h(1fr) #classification-badge("${cls}")]`);
        lines.push("");
        break;
      }
      case "paragraph": {
        const text = inlineContentToTypst(block.content);
        if (text) { lines.push(text); lines.push(""); }
        break;
      }
      case "bulletListItem": {
        lines.push(`- ${inlineContentToTypst(block.content)}`);
        break;
      }
      case "numberedListItem": {
        lines.push(`+ ${inlineContentToTypst(block.content)}`);
        break;
      }
      default: {
        lines.push(`// [bloc non exporté: ${block.type}]`);
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}

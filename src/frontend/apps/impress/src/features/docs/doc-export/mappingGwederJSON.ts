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
  [key: string]: unknown;
}

interface Block {
  id: string;
  type: string;
  props: { classification?: string; level?: number; [key: string]: unknown };
  content: BlockContent[];
  children: Block[];
}

interface GwederSection {
  id: string;
  classification: string;
  titre: string;
  order: number;
  data: { contenu: string; [key: string]: unknown };
}

interface GwederDocument {
  ref: string;
  type: string;
  titre: string;
  date: string;
  expires_at: string;
  audience: string[];
  metadata: {
    auteur: string;
    emetteur: { nom: string; siret?: string };
    destinataire?: string;
  };
  sections: GwederSection[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractText(content: BlockContent[]): string {
  return content
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text!)
    .join("");
}

export function blocksToGwederJSON(
  blocks: Block[],
  properties: GwederProperties,
): GwederDocument {
  const sections: GwederSection[] = [];
  let currentSection: GwederSection | null = null;
  let order = 0;

  for (const block of blocks) {
    if (block.type === "heading") {
      order++;
      const titre = extractText(block.content);
      currentSection = {
        id: slugify(titre),
        classification: block.props.classification ?? "PUBLIC",
        titre,
        order,
        data: { contenu: "" },
      };
      sections.push(currentSection);
    } else if (currentSection) {
      const text = extractText(block.content);
      if (text) {
        if (currentSection.data.contenu) {
          currentSection.data.contenu += "\n\n";
        }
        currentSection.data.contenu += text;
      }
    }
  }

  return {
    ref: properties.ref,
    type: "note",
    titre: properties.ref,
    date: properties.date,
    expires_at: properties.expires_at,
    audience: properties.audience,
    metadata: {
      auteur: properties.auteur,
      emetteur: {
        nom: properties.emetteur_nom,
        ...(properties.emetteur_siret ? { siret: properties.emetteur_siret } : {}),
      },
      ...(properties.destinataire ? { destinataire: properties.destinataire } : {}),
    },
    sections,
  };
}

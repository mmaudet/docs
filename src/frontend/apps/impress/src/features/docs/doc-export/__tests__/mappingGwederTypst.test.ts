import { describe, expect, it } from "vitest";
import { blocksToGwederTypst } from "../mappingGwederTypst";

const MOCK_PROPERTIES = {
  ref: "NOTE-2025-001",
  date: "2025-04-07",
  expires_at: "2027-04-07T00:00:00Z",
  audience: ["LINAGORA", "ANFSI"],
  auteur: "Michel Maudet",
  emetteur_nom: "LINAGORA",
  emetteur_siret: "433 779 647 00062",
  destinataire: "Direction technique ANFSI",
};

const MOCK_BLOCKS = [
  { id: "b1", type: "heading", props: { level: 1, classification: "PUBLIC" }, content: [{ type: "text", text: "Contexte général" }], children: [] },
  { id: "b2", type: "paragraph", props: { classification: "PUBLIC" }, content: [{ type: "text", text: "Le client ANFSI a engagé une réflexion." }], children: [] },
  { id: "b3", type: "heading", props: { level: 1, classification: "SECRET" }, content: [{ type: "text", text: "Budget" }], children: [] },
  { id: "b4", type: "paragraph", props: { classification: "SECRET" }, content: [{ type: "text", text: "Le montant est de " }, { type: "text", text: "450 000 €", styles: { bold: true } }], children: [] },
  { id: "b5", type: "bulletListItem", props: { classification: "SECRET" }, content: [{ type: "text", text: "Infrastructure" }], children: [] },
  { id: "b6", type: "numberedListItem", props: { classification: "SECRET" }, content: [{ type: "text", text: "Phase 1" }], children: [] },
];

const MOCK_TITLE = "Note d'analyse — Migration infrastructure";

describe("blocksToGwederTypst", () => {
  it("includes lib imports in header", () => {
    const result = blocksToGwederTypst(MOCK_BLOCKS, MOCK_PROPERTIES, MOCK_TITLE);
    expect(result).toContain('#import "lib/core.typ"');
    expect(result).toContain('#import "lib/formatting.typ"');
  });

  it("includes gweder-page setup", () => {
    const result = blocksToGwederTypst(MOCK_BLOCKS, MOCK_PROPERTIES, MOCK_TITLE);
    expect(result).toContain("gweder-page");
    expect(result).toContain("NOTE-2025-001");
  });

  it("generates title page with metadata", () => {
    const result = blocksToGwederTypst(MOCK_BLOCKS, MOCK_PROPERTIES, MOCK_TITLE);
    expect(result).toContain("Note d'analyse");
    expect(result).toContain("LINAGORA");
    expect(result).toContain("Direction technique ANFSI");
  });

  it("converts headings with classification badges", () => {
    const result = blocksToGwederTypst(MOCK_BLOCKS, MOCK_PROPERTIES, MOCK_TITLE);
    expect(result).toContain('#heading(level: 1)[Contexte général #h(1fr) #classification-badge("PUBLIC")]');
    expect(result).toContain('#heading(level: 1)[Budget #h(1fr) #classification-badge("SECRET")]');
  });

  it("converts paragraphs to plain text", () => {
    const result = blocksToGwederTypst(MOCK_BLOCKS, MOCK_PROPERTIES, MOCK_TITLE);
    expect(result).toContain("Le client ANFSI a engagé une réflexion.");
  });

  it("converts bold text", () => {
    const result = blocksToGwederTypst(MOCK_BLOCKS, MOCK_PROPERTIES, MOCK_TITLE);
    expect(result).toContain("*450 000 €*");
  });

  it("converts bullet list items", () => {
    const result = blocksToGwederTypst(MOCK_BLOCKS, MOCK_PROPERTIES, MOCK_TITLE);
    expect(result).toContain("- Infrastructure");
  });

  it("converts numbered list items", () => {
    const result = blocksToGwederTypst(MOCK_BLOCKS, MOCK_PROPERTIES, MOCK_TITLE);
    expect(result).toContain("+ Phase 1");
  });

  it("uses highest classification for document level", () => {
    const result = blocksToGwederTypst(MOCK_BLOCKS, MOCK_PROPERTIES, MOCK_TITLE);
    expect(result).toContain('classification: "SECRET"');
  });
});

import { describe, expect, it } from "vitest";
import { blocksToGwederJSON } from "../mappingGwederJSON";

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
  {
    id: "b1", type: "heading",
    props: { level: 1, classification: "PUBLIC" },
    content: [{ type: "text", text: "Contexte général" }],
    children: [],
  },
  {
    id: "b2", type: "paragraph",
    props: { classification: "PUBLIC" },
    content: [{ type: "text", text: "Le client ANFSI a engagé une réflexion." }],
    children: [],
  },
  {
    id: "b3", type: "heading",
    props: { level: 1, classification: "CONFIDENTIEL" },
    content: [{ type: "text", text: "Analyse des risques" }],
    children: [],
  },
  {
    id: "b4", type: "paragraph",
    props: { classification: "CONFIDENTIEL" },
    content: [{ type: "text", text: "Risque R1 — Exfiltration passive." }],
    children: [],
  },
];

describe("blocksToGwederJSON", () => {
  it("groups blocks by heading into sections", () => {
    const result = blocksToGwederJSON(MOCK_BLOCKS, MOCK_PROPERTIES);
    expect(result.sections).toHaveLength(2);
  });

  it("uses heading text as section titre", () => {
    const result = blocksToGwederJSON(MOCK_BLOCKS, MOCK_PROPERTIES);
    expect(result.sections[0].titre).toBe("Contexte général");
    expect(result.sections[1].titre).toBe("Analyse des risques");
  });

  it("uses heading classification for the section", () => {
    const result = blocksToGwederJSON(MOCK_BLOCKS, MOCK_PROPERTIES);
    expect(result.sections[0].classification).toBe("PUBLIC");
    expect(result.sections[1].classification).toBe("CONFIDENTIEL");
  });

  it("concatenates paragraph text into section contenu", () => {
    const result = blocksToGwederJSON(MOCK_BLOCKS, MOCK_PROPERTIES);
    expect(result.sections[0].data.contenu).toContain("Le client ANFSI");
    expect(result.sections[1].data.contenu).toContain("Risque R1");
  });

  it("generates slug ids from titles", () => {
    const result = blocksToGwederJSON(MOCK_BLOCKS, MOCK_PROPERTIES);
    expect(result.sections[0].id).toBe("contexte-general");
    expect(result.sections[1].id).toBe("analyse-des-risques");
  });

  it("includes document metadata from properties", () => {
    const result = blocksToGwederJSON(MOCK_BLOCKS, MOCK_PROPERTIES);
    expect(result.ref).toBe("NOTE-2025-001");
    expect(result.audience).toEqual(["LINAGORA", "ANFSI"]);
    expect(result.metadata.auteur).toBe("Michel Maudet");
  });

  it("assigns incremental order to sections", () => {
    const result = blocksToGwederJSON(MOCK_BLOCKS, MOCK_PROPERTIES);
    expect(result.sections[0].order).toBe(1);
    expect(result.sections[1].order).toBe(2);
  });
});

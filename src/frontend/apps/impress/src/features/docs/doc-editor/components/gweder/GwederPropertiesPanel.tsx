import { useState, type FormEvent } from "react";

export interface GwederProperties {
  ref: string;
  date: string;
  expires_at: string;
  audience: string[];
  auteur: string;
  emetteur_nom: string;
  emetteur_siret: string;
  destinataire: string;
}

const EMPTY_PROPS: GwederProperties = {
  ref: "",
  date: new Date().toISOString().split("T")[0],
  expires_at: "",
  audience: [],
  auteur: "",
  emetteur_nom: "",
  emetteur_siret: "",
  destinataire: "",
};

interface Props {
  value: GwederProperties | null;
  onSave: (properties: GwederProperties) => void;
  onClose: () => void;
}

export function GwederPropertiesPanel({ value, onSave, onClose }: Props) {
  const [form, setForm] = useState<GwederProperties>(value ?? EMPTY_PROPS);
  const [audienceInput, setAudienceInput] = useState("");

  const update = (field: keyof GwederProperties, val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const addAudience = () => {
    const trimmed = audienceInput.trim().toUpperCase();
    if (trimmed && !form.audience.includes(trimmed)) {
      setForm((prev) => ({ ...prev, audience: [...prev.audience, trimmed] }));
      setAudienceInput("");
    }
  };

  const removeAudience = (org: string) => {
    setForm((prev) => ({ ...prev, audience: prev.audience.filter((a) => a !== org) }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Expose ref globally so ClassificationToolbarButton can notify the Gweder renderer
    (window as any).__gwederDocRef = form.ref;
    onSave(form);
  };

  const inputStyle = {
    width: "100%",
    padding: "6px 10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "13px",
  };

  const labelStyle = {
    display: "block" as const,
    fontSize: "12px",
    fontWeight: 600 as const,
    color: "#555",
    marginBottom: "4px",
    marginTop: "12px",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "340px",
        height: "100vh",
        background: "#fff",
        borderLeft: "1px solid #ddd",
        boxShadow: "-4px 0 12px rgba(0,0,0,0.05)",
        padding: "20px",
        overflowY: "auto",
        zIndex: 1000,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "16px" }}>Propriétés Gweder</h3>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
      </div>

      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Référence *</label>
        <input style={inputStyle} value={form.ref} onChange={(e) => update("ref", e.target.value)} placeholder="NOTE-2025-001" required />

        <label style={labelStyle}>Date *</label>
        <input style={inputStyle} type="date" value={form.date} onChange={(e) => update("date", e.target.value)} required />

        <label style={labelStyle}>Expiration *</label>
        <input style={inputStyle} type="datetime-local" value={form.expires_at} onChange={(e) => update("expires_at", e.target.value)} required />

        <label style={labelStyle}>Audience *</label>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "4px" }}>
          {form.audience.map((org) => (
            <span key={org} style={{ background: "#e3f2fd", padding: "2px 8px", borderRadius: "12px", fontSize: "11px" }}>
              {org} <button type="button" onClick={() => removeAudience(org)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px" }}>✕</button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <input style={{ ...inputStyle, flex: 1 }} value={audienceInput} onChange={(e) => setAudienceInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAudience(); } }} placeholder="Ajouter une org..." />
          <button type="button" onClick={addAudience} style={{ padding: "6px 12px", background: "#1565c0", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>+</button>
        </div>

        <label style={labelStyle}>Auteur *</label>
        <input style={inputStyle} value={form.auteur} onChange={(e) => update("auteur", e.target.value)} required />

        <label style={labelStyle}>Emetteur — Nom *</label>
        <input style={inputStyle} value={form.emetteur_nom} onChange={(e) => update("emetteur_nom", e.target.value)} required />

        <label style={labelStyle}>Emetteur — SIRET</label>
        <input style={inputStyle} value={form.emetteur_siret} onChange={(e) => update("emetteur_siret", e.target.value)} />

        <label style={labelStyle}>Destinataire</label>
        <input style={inputStyle} value={form.destinataire} onChange={(e) => update("destinataire", e.target.value)} />

        <button type="submit" style={{ marginTop: "20px", width: "100%", padding: "10px", background: "#1565c0", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
          Enregistrer
        </button>
      </form>
    </div>
  );
}

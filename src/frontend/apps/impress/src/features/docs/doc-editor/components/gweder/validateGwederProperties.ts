import type { GwederProperties } from "./GwederPropertiesPanel";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateGwederProperties(
  props: GwederProperties | null | undefined,
): ValidationError[] {
  if (!props) {
    return [{ field: "all", message: "Veuillez renseigner les propriétés Gweder (menu ⋯)" }];
  }

  const errors: ValidationError[] = [];

  if (!props.ref || props.ref.trim() === "") {
    errors.push({ field: "ref", message: "La référence du document est requise" });
  }
  if (!props.date) {
    errors.push({ field: "date", message: "La date du document est requise" });
  }
  if (!props.expires_at) {
    errors.push({ field: "expires_at", message: "La date d'expiration est requise" });
  }
  if (!props.audience || props.audience.length === 0) {
    errors.push({ field: "audience", message: "Au moins une organisation dans l'audience est requise" });
  }
  if (!props.auteur || props.auteur.trim() === "") {
    errors.push({ field: "auteur", message: "L'auteur est requis" });
  }
  if (!props.emetteur_nom || props.emetteur_nom.trim() === "") {
    errors.push({ field: "emetteur_nom", message: "Le nom de l'émetteur est requis" });
  }

  return errors;
}

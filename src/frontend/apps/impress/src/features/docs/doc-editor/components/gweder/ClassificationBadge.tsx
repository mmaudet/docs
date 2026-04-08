import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  CLASSIFICATION_COLORS,
  CLASSIFICATION_LABELS,
  CLASSIFICATION_LEVELS,
  type Classification,
  type ProfileLevel,
} from "./constants";

interface Props {
  value: Classification;
  onChange: (value: Classification) => void;
}

// Cache for dynamically loaded levels
let dynamicLevels: ProfileLevel[] | null = null;
let loadingPromise: Promise<ProfileLevel[]> | null = null;

function loadLevels(): Promise<ProfileLevel[]> {
  if (dynamicLevels) return Promise.resolve(dynamicLevels);
  if (loadingPromise) return loadingPromise;

  const gwederApi = (window as any).__gwederApiUrl || "http://localhost:8000";
  loadingPromise = fetch(`${gwederApi}/profile`)
    .then((r) => (r.ok ? r.json() : Promise.reject("not ok")))
    .then((data) => {
      dynamicLevels = data.levels;
      return dynamicLevels!;
    })
    .catch(() => {
      // Fallback to static constants
      dynamicLevels = CLASSIFICATION_LEVELS.map((id, i) => ({
        id,
        numeric: i,
        label: CLASSIFICATION_LABELS[id as Classification],
        color: CLASSIFICATION_COLORS[id as Classification].text,
        aliases: [],
      }));
      return dynamicLevels;
    })
    .finally(() => {
      loadingPromise = null;
    });

  return loadingPromise;
}

function getColor(levelId: string, levels: ProfileLevel[]) {
  const level = levels.find((l) => l.id === levelId);
  if (level) {
    return { bg: level.color + "1A", text: level.color, border: level.color };
  }
  const fallback = CLASSIFICATION_COLORS[levelId as Classification];
  return fallback || { bg: "#f5f5f5", text: "#666", border: "#ccc" };
}

function getLabel(levelId: string, levels: ProfileLevel[]) {
  const level = levels.find((l) => l.id === levelId);
  if (level) return level.label;
  const fallback = CLASSIFICATION_LABELS[levelId as Classification];
  return fallback || levelId;
}

export function ClassificationBadge({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [levels, setLevels] = useState<ProfileLevel[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  // Load levels from Gweder API on mount
  useEffect(() => {
    loadLevels().then(setLevels);
  }, []);

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.right - 140,
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const colors = getColor(value, levels);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!open) updatePosition();
    setOpen(!open);
  };

  // Use dynamic levels if loaded, otherwise fallback to static
  const displayLevels = levels.length > 0 ? levels : CLASSIFICATION_LEVELS.map((id, i) => ({
    id,
    numeric: i,
    label: CLASSIFICATION_LABELS[id as Classification],
    color: CLASSIFICATION_COLORS[id as Classification].text,
    aliases: [],
  }));

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onMouseDown={handleToggle}
        style={{
          background: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          borderRadius: "4px",
          padding: "2px 8px",
          fontSize: "10px",
          fontWeight: 700,
          cursor: "pointer",
          lineHeight: "18px",
        }}
      >
        {getLabel(value, levels)} ▼
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: dropdownPos.top,
            left: dropdownPos.left,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 99999,
            minWidth: "160px",
            overflow: "hidden",
          }}
        >
          {displayLevels.map((level) => {
            const c = getColor(level.id, levels);
            return (
              <button
                key={level.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(level.id as Classification);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 14px",
                  border: "none",
                  background: value === level.id ? c.bg : "transparent",
                  color: c.text,
                  fontSize: "13px",
                  fontWeight: value === level.id ? 700 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {level.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

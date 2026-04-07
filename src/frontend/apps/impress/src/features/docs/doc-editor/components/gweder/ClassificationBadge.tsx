import { useState, useRef, useEffect } from "react";
import {
  CLASSIFICATION_COLORS,
  CLASSIFICATION_LABELS,
  CLASSIFICATION_LEVELS,
  type Classification,
} from "./constants";

interface Props {
  value: Classification;
  onChange: (value: Classification) => void;
}

export function ClassificationBadge({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const colors = CLASSIFICATION_COLORS[value];

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
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
        {CLASSIFICATION_LABELS[value]} ▼
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "4px",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 1000,
            minWidth: "140px",
            overflow: "hidden",
          }}
        >
          {CLASSIFICATION_LEVELS.map((level) => {
            const c = CLASSIFICATION_COLORS[level];
            return (
              <button
                key={level}
                type="button"
                onClick={() => {
                  onChange(level);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "6px 12px",
                  border: "none",
                  background: value === level ? c.bg : "transparent",
                  color: c.text,
                  fontSize: "12px",
                  fontWeight: value === level ? 700 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {level}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

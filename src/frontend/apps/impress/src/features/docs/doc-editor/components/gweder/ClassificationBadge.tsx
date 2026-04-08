import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

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

  const colors = CLASSIFICATION_COLORS[value];

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!open) updatePosition();
    setOpen(!open);
  };

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
        {CLASSIFICATION_LABELS[value]} ▼
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(level);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 14px",
                  border: "none",
                  background: value === level ? c.bg : "transparent",
                  color: c.text,
                  fontSize: "13px",
                  fontWeight: value === level ? 700 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {level}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

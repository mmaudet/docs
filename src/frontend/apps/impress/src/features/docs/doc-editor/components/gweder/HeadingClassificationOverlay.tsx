/**
 * HeadingClassificationOverlay
 *
 * Injects classification pill badges next to each heading in the BlockNote editor.
 * Scans the DOM for .bn-block[data-node-type="blockContainer"] containing h1/h2/h3,
 * reads the classification from the editor's block data, and renders a colored pill.
 */
import { useBlockNoteEditor } from '@blocknote/react';
import { useEffect, useRef, useCallback, useState } from 'react';

import { type Classification, DEFAULT_CLASSIFICATION } from './constants';

// Profile cache
let profileLevels: Array<{ id: string; label: string; color: string }> | null = null;

async function ensureProfile() {
  if (profileLevels) return;
  try {
    const api = (window as any).__gwederApiUrl || 'http://localhost:8000';
    const r = await fetch(`${api}/profile`);
    if (r.ok) {
      profileLevels = (await r.json()).levels;
      return;
    }
  } catch { /* */ }
  profileLevels = [
    { id: 'PUBLIC', label: 'Public', color: '#6B7280' },
    { id: 'GENERAL', label: 'Général', color: '#10B981' },
    { id: 'RESTREINT', label: 'Restreint', color: '#3B82F6' },
    { id: 'CONFIDENTIEL', label: 'Confidentiel', color: '#F59E0B' },
    { id: 'SECRET', label: 'Secret', color: '#EF4444' },
  ];
}

function getLevelInfo(id: string) {
  return profileLevels?.find((l) => l.id === id) || { id, label: id, color: '#6B7280' };
}

function createPillElement(label: string, color: string): HTMLSpanElement {
  const pill = document.createElement('span');
  pill.className = 'gweder-pill';
  pill.textContent = label;
  Object.assign(pill.style, {
    display: 'inline-block',
    background: color,
    color: '#fff',
    borderRadius: '12px',
    padding: '2px 10px',
    fontSize: '11px',
    fontWeight: '600',
    lineHeight: '18px',
    marginLeft: '8px',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    flexShrink: '0',
  });
  return pill;
}

export function HeadingClassificationOverlay() {
  const editor = useBlockNoteEditor();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureProfile().then(() => setReady(true));
  }, []);

  const updateBadges = useCallback(() => {
    if (!ready || !profileLevels) return;

    try {
      // Get all blocks from editor
      const blocks = editor.document;

      // Build a map: block data-id → classification
      const classificationMap = new Map<string, string>();
      for (const block of blocks) {
        if (block.type === 'heading') {
          const cls = ((block.props as any)?.classification as string) || DEFAULT_CLASSIFICATION;
          classificationMap.set(block.id, cls);
        }
      }

      // Find all heading containers in DOM
      const containers = document.querySelectorAll(
        '.bn-block[data-node-type="blockContainer"]'
      );

      for (const container of containers) {
        const heading = container.querySelector('h1, h2, h3');
        if (!heading) continue;

        const dataId = container.getAttribute('data-id') || '';
        const classification = classificationMap.get(dataId) || DEFAULT_CLASSIFICATION;
        const levelInfo = getLevelInfo(classification);

        // Check if pill already exists
        let pill = container.querySelector('.gweder-pill') as HTMLSpanElement;

        if (pill) {
          // Update existing pill
          if (pill.textContent !== levelInfo.label || pill.style.background !== levelInfo.color) {
            pill.textContent = levelInfo.label;
            pill.style.background = levelInfo.color;
          }
        } else {
          // Create new pill — insert it inside the heading's inline content wrapper
          pill = createPillElement(levelInfo.label, levelInfo.color);

          // Make the heading content a flex container to push pill to the right
          const inlineContent = heading.closest('.bn-block-content') || heading.parentElement;
          if (inlineContent) {
            const contentEl = inlineContent as HTMLElement;
            contentEl.style.display = 'flex';
            contentEl.style.alignItems = 'center';
            contentEl.style.justifyContent = 'space-between';
            contentEl.style.gap = '8px';
            contentEl.appendChild(pill);
          }
        }
      }
    } catch {
      // Editor not ready
    }
  }, [editor, ready]);

  useEffect(() => {
    if (!ready) return;

    // Initial render after a short delay (DOM needs to be ready)
    const timer = setTimeout(updateBadges, 800);

    // Re-render periodically
    const interval = setInterval(updateBadges, 1500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      // Cleanup pills
      document.querySelectorAll('.gweder-pill').forEach((el) => el.remove());
    };
  }, [updateBadges, ready]);

  return null;
}

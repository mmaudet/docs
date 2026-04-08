/**
 * HeadingClassificationOverlay
 *
 * Injects classification pill badges into heading elements in the BlockNote
 * editor. Uses a MutationObserver to detect when headings appear/change
 * and renders React portals into them.
 */
import { useBlockNoteEditor } from '@blocknote/react';
import { useEffect, useRef, useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { type Classification, DEFAULT_CLASSIFICATION } from './constants';

// Inline pill component (no dropdown — clicking triggers toolbar selection)
function Pill({ classification, color }: { classification: string; color: string }) {
  return (
    <span
      className="gweder-pill"
      style={{
        display: 'inline-block',
        background: color,
        color: '#fff',
        borderRadius: '12px',
        padding: '2px 10px',
        fontSize: '11px',
        fontWeight: 600,
        lineHeight: '18px',
        marginLeft: '8px',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      {classification}
    </span>
  );
}

// Cache for profile levels
let profileLevels: Array<{ id: string; label: string; color: string }> | null = null;

async function loadProfile() {
  if (profileLevels) return profileLevels;
  try {
    const gwederApi = (window as any).__gwederApiUrl || 'http://localhost:8000';
    const r = await fetch(`${gwederApi}/profile`);
    if (r.ok) {
      const data = await r.json();
      profileLevels = data.levels;
      return profileLevels!;
    }
  } catch { /* fallback */ }
  profileLevels = [
    { id: 'PUBLIC', label: 'Public', color: '#6B7280' },
    { id: 'RESTREINT', label: 'Restreint', color: '#3B82F6' },
    { id: 'CONFIDENTIEL', label: 'Confidentiel', color: '#F59E0B' },
    { id: 'SECRET', label: 'Secret', color: '#EF4444' },
  ];
  return profileLevels;
}

function getLevelInfo(id: string) {
  const level = profileLevels?.find(l => l.id === id);
  return level || { id, label: id, color: '#6B7280' };
}

export function HeadingClassificationOverlay() {
  const editor = useBlockNoteEditor();
  const rootsRef = useRef<Map<string, ReturnType<typeof createRoot>>>(new Map());
  const [ready, setReady] = useState(false);

  // Load profile on mount
  useEffect(() => {
    loadProfile().then(() => setReady(true));
  }, []);

  const updateBadges = useCallback(() => {
    if (!ready) return;

    try {
      const blocks = editor.document;

      for (const block of blocks) {
        if (block.type !== 'heading') continue;

        const classification = ((block.props as any)?.classification as string) || DEFAULT_CLASSIFICATION;
        const levelInfo = getLevelInfo(classification);

        // Find the heading element in DOM — BlockNote uses data-id on the block wrapper
        // Try multiple selectors
        let blockEl = document.querySelector(`[data-id="${block.id}"]`) as HTMLElement;
        if (!blockEl) {
          // BlockNote 0.47 may use data-node-view-content or other attributes
          // Try finding by the inline content
          const allHeadings = document.querySelectorAll('[data-content-type="heading"], [data-node-type="blockContainer"] h1, [data-node-type="blockContainer"] h2, [data-node-type="blockContainer"] h3, .bn-block-content[data-content-type="heading"]');
          // Match by text content
          const headingText = block.content?.map((c: any) => c.text || '').join('') || '';
          for (const h of allHeadings) {
            if (h.textContent?.trim() === headingText.trim()) {
              blockEl = (h.closest('[data-node-type="blockContainer"]') || h.parentElement || h) as HTMLElement;
              break;
            }
          }
        }

        if (!blockEl) continue;

        // Check if pill already exists
        let pillContainer = blockEl.querySelector('.gweder-pill-container') as HTMLElement;
        if (!pillContainer) {
          pillContainer = document.createElement('span');
          pillContainer.className = 'gweder-pill-container';
          pillContainer.style.cssText = 'display:inline;';

          // Find the heading text element and append after it
          const headingContent = blockEl.querySelector('h1, h2, h3, [data-content-type="heading"] .bn-inline-content, [role="textbox"]');
          if (headingContent) {
            headingContent.parentElement?.appendChild(pillContainer);
          } else {
            blockEl.appendChild(pillContainer);
          }
        }

        // Render or update the pill
        const key = block.id;
        if (!rootsRef.current.has(key)) {
          rootsRef.current.set(key, createRoot(pillContainer));
        }
        rootsRef.current.get(key)!.render(
          <Pill classification={levelInfo.label} color={levelInfo.color} />
        );
      }
    } catch {
      // Editor not ready
    }
  }, [editor, ready]);

  useEffect(() => {
    if (!ready) return;

    // Initial render
    const timer = setTimeout(updateBadges, 500);

    // Re-render periodically to catch changes
    const interval = setInterval(updateBadges, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      // Cleanup roots
      for (const root of rootsRef.current.values()) {
        try { root.unmount(); } catch { /* */ }
      }
      rootsRef.current.clear();
    };
  }, [updateBadges, ready]);

  return null; // Rendering happens via createRoot into DOM elements
}

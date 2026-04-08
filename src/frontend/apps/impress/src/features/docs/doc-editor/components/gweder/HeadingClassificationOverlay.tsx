/**
 * HeadingClassificationOverlay
 *
 * Injects classification pill badges next to each heading in the BlockNote editor.
 * Uses direct DOM manipulation (proven to work via console testing).
 */
import { useBlockNoteEditor } from '@blocknote/react';
import { useEffect, useCallback, useState } from 'react';

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
  return profileLevels?.find((l) => l.id === id) || { label: id, color: '#6B7280' };
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
      // Build classification map from editor blocks
      const classMap = new Map<string, string>();
      for (const block of editor.document) {
        if (block.type === 'heading') {
          classMap.set(block.id, ((block.props as any)?.classification as string) || DEFAULT_CLASSIFICATION);
        }
      }

      // Find all heading containers in DOM
      document.querySelectorAll('.bn-block[data-node-type="blockContainer"]').forEach(function (container) {
        var h = container.querySelector('h1,h2,h3');
        if (!h) return;

        var dataId = container.getAttribute('data-id') || '';
        var classification = classMap.get(dataId) || DEFAULT_CLASSIFICATION;
        var info = getLevelInfo(classification);

        // Check if pill already exists
        var existing = container.querySelector('.gweder-pill') as HTMLElement;
        if (existing) {
          // Update if changed
          if (existing.textContent !== info.label) {
            existing.textContent = info.label;
            existing.style.background = info.color;
          }
          return;
        }

        // Create pill — position it AFTER the heading element using the block-content wrapper
        var blockContent = h.closest('.bn-block-content') as HTMLElement;
        if (!blockContent) return;

        var pill = document.createElement('span');
        pill.className = 'gweder-pill';
        pill.textContent = info.label;
        pill.setAttribute('style',
          'display:inline-flex;align-items:center;justify-content:center;' +
          'background:' + info.color + ';color:#fff;border-radius:12px;' +
          'padding:2px 12px;font-size:11px;font-weight:600;line-height:20px;' +
          'white-space:nowrap;flex-shrink:0;cursor:pointer;' +
          'position:absolute;right:8px;top:50%;transform:translateY(-50%);'
        );

        // Make block-content position:relative so the pill is positioned correctly
        blockContent.style.position = 'relative';
        blockContent.style.paddingRight = '100px'; // space for the pill
        blockContent.appendChild(pill);
      });
    } catch {
      // Editor not ready
    }
  }, [editor, ready]);

  useEffect(() => {
    if (!ready) return;

    var timer = setTimeout(updateBadges, 500);
    var interval = setInterval(updateBadges, 1500);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      document.querySelectorAll('.gweder-pill').forEach(function (el) { el.remove(); });
    };
  }, [updateBadges, ready]);

  return null;
}

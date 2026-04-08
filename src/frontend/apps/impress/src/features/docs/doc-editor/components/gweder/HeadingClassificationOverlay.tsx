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
    console.log('[GwederOverlay] mounted');
    ensureProfile().then(() => {
      console.log('[GwederOverlay] profile loaded, levels:', profileLevels?.length);
      setReady(true);
    });
  }, []);

  const updateBadges = useCallback(() => {
    console.log('[GwederOverlay] updateBadges called, ready:', ready, 'levels:', profileLevels?.length);
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
      var containers = document.querySelectorAll('.bn-block[data-node-type="blockContainer"]');
      console.log('[GwederOverlay] DOM containers:', containers.length, 'editor blocks:', classMap.size);
      containers.forEach(function (container) {
        var h = container.querySelector('h1,h2,h3');
        if (!h) return;

        var dataId = container.getAttribute('data-id') || '';
        var classification = classMap.get(dataId) || DEFAULT_CLASSIFICATION;
        console.log('[GwederOverlay] heading:', h.textContent?.substring(0,20), 'data-id:', dataId?.substring(0,20), 'cls:', classification, 'matched:', classMap.has(dataId));
        var info = getLevelInfo(classification);

        // Check if pill already exists in this container
        var existing = container.querySelector('.gweder-pill') as HTMLElement;
        if (existing) {
          if (existing.textContent !== info.label) {
            existing.textContent = info.label;
            existing.style.background = info.color;
          }
          return;
        }

        // Create pill and append AFTER the heading element (sibling, not child)
        var pill = document.createElement('span');
        pill.className = 'gweder-pill';
        pill.textContent = info.label;
        pill.setAttribute('contenteditable', 'false');
        pill.setAttribute('style',
          'display:inline-block;background:' + info.color + ';color:#fff;' +
          'border-radius:12px;padding:2px 12px;font-size:11px;font-weight:600;' +
          'line-height:20px;white-space:nowrap;margin-left:12px;vertical-align:middle;' +
          'user-select:none;pointer-events:none;'
        );

        // Append to the heading element itself (proven to work from console test)
        h.appendChild(pill);
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

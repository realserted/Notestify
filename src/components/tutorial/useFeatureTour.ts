'use client';

import { useEffect, useRef } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

const STORAGE_PREFIX = 'notestify-tour-';

export const useFeatureTour = (key: string, steps: DriveStep[], ready = true) => {
  const started = useRef(false);

  useEffect(() => {
    if (!ready || started.current) return;
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_PREFIX + key)) return;

    const allPresent = steps.every((s) => {
      if (!s.element || typeof s.element !== 'string') return true;
      return document.querySelector(s.element);
    });
    if (!allPresent) return;

    started.current = true;
    const id = window.setTimeout(() => {
      const instance = driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        nextBtnText: 'Next',
        prevBtnText: 'Back',
        doneBtnText: 'Got it',
        popoverClass: 'notestify-tour',
        onDestroyed: () => {
          localStorage.setItem(STORAGE_PREFIX + key, '1');
        },
        steps,
      });
      instance.drive();
    }, 600);

    return () => window.clearTimeout(id);
  }, [key, steps, ready]);
};

export const replayFeatureTour = (key: string) => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_PREFIX + key);
};

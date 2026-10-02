import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  theme = signal<ThemeMode>(this.getSavedTheme());

  constructor() {
    effect(() => {
      const mode = this.theme();
      localStorage.setItem('json_viewer_theme', mode);
      this.applyTheme(mode);
    });

    // Listen to system preference changes if in system mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.theme() === 'system') {
        this.applyTheme('system');
      }
    });
  }

  setTheme(mode: ThemeMode) {
    this.theme.set(mode);
  }

  private getSavedTheme(): ThemeMode {
    const saved = localStorage.getItem('json_viewer_theme') as ThemeMode;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      return saved;
    }
    return 'dark'; // Default to dark developer theme
  }

  private applyTheme(mode: ThemeMode) {
    let effectiveTheme = mode;
    if (mode === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }
}

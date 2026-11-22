import {computed, Injectable, signal} from '@angular/core';
import {Lang, PRINTS} from '../data/prints';

export type AppView = 'gallery' | 'list' | 'page';

@Injectable({providedIn: 'root'})
export class ZestwellStore {
  readonly view = signal<AppView>('gallery');
  readonly lang = signal<Lang>('bs');
  readonly activePrintIndex = signal<number>(0);
  readonly lastPrintIndex = signal<number>(0);
  readonly pageDetailsVisible = signal<boolean>(false);
  readonly pageImageHidden = signal<boolean>(false);

  readonly savedPrints = signal<Set<number>>(new Set());

  readonly activePrint = computed(
    () => PRINTS[this.activePrintIndex()] ?? PRINTS[0],
  );

  setLang(lang: Lang): void {
    this.lang.set(lang);
  }

  toggleSaved(index: number): void {
    this.savedPrints.update((set) => {
      const next = new Set(set);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }
}

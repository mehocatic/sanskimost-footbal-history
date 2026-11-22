import {
  Directive,
  ElementRef,
  effect,
  inject,
  input,
  PLATFORM_ID,
} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {PRINTS} from '../data/prints';

export function applyPhotoBackground(
  el: HTMLElement,
  imageUrl: string,
  fit: 'contain' | 'cover' = 'contain',
): void {
  el.style.backgroundImage = `url("${imageUrl}")`;
  el.style.backgroundRepeat = 'no-repeat';
  el.style.backgroundPosition = 'center center';
  el.style.backgroundSize = fit;
}

@Directive({
  selector: '[appSheetCrop]',
})
export class SheetCropDirective {
  readonly printIndex = input.required<number>({alias: 'appSheetCrop'});
  readonly fit = input<'contain' | 'cover'>('contain');

  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    effect(() => {
      const idx = this.printIndex();
      const fitMode = this.fit();
      if (!this.isBrowser) return;
      const print = PRINTS[idx];
      if (!print) return;
      applyPhotoBackground(this.elRef.nativeElement, print.imageUrl, fitMode);
    });
  }
}

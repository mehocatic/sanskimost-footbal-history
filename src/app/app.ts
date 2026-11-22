import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {PRINTS} from './data/prints';
import {applyPhotoBackground} from './directives/sheet-crop';
import {ZestwellStore} from './services/store';
import {GalleryStage, PrintOpenEvent, ProjectedRect} from './components/gallery-stage';
import {NavBar} from './components/nav-bar';
import {GalleryUi} from './components/gallery-ui';
import {PrintPage} from './components/print-page';
import {ListView} from './components/list-view';

const SMALL_SCREEN_MQ =
  '(max-width: 819px), (orientation: portrait) and (max-width: 1100px), (orientation: landscape) and (max-height: 500px)';
const REDUCED_MOTION_MQ = '(prefers-reduced-motion: reduce)';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    GalleryStage,
    NavBar,
    GalleryUi,
    PrintPage,
    ListView,
  ],
  template: `
    <app-gallery-stage
      #galleryStage
      [activeOverlay]="overlayActive()"
      [reducedMotion]="reducedMotion()"
      [isSmallScreen]="isSmallScreen()"
      [lang]="store.lang()"
      (introReady)="introReady.set(true)"
      (focusChanged)="galleryFocused.set($event)"
      (printFocused)="onGalleryPrintFocused($event)"
      (openPrint)="onGalleryOpenPrint($event)"
    />

    <app-nav-bar
      [solidNav]="store.view() !== 'gallery'"
      [introReady]="introReady()"
      (goCorridor)="returnToHome()"
    />

    <app-gallery-ui
      [hidden]="store.view() !== 'gallery'"
      [introReady]="introReady()"
      [focused]="galleryFocused()"
      [mode]="store.view() === 'list' ? 'list' : 'gallery'"
      [lang]="store.lang()"
      (stepPrev)="galleryStage.step(-1)"
      (stepNext)="galleryStage.step(1)"
      (selectGallery)="returnToHome()"
      (selectList)="openList()"
    />

    <app-list-view
      [open]="store.view() === 'list'"
      (selectPrint)="onListOrCardSelect($event)"
      (selectGallery)="returnToHome()"
    />

    <app-print-page
      #printPage
      [open]="store.view() === 'page'"
      [reducedMotion]="reducedMotion()"
      (viewInRoom)="returnToRoom($event)"
      (openCollectionPrint)="onListOrCardSelect($event)"
    />
  `,
})
export class App implements OnInit, OnDestroy {
  readonly store = inject(ZestwellStore);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly galleryStage = viewChild<GalleryStage>('galleryStage');
  private readonly printPage = viewChild<PrintPage>('printPage');

  readonly introReady = signal(false);
  readonly galleryFocused = signal(false);
  readonly isSmallScreen = signal(false);
  readonly reducedMotion = signal(false);

  readonly overlayActive = computed(() => this.store.view() !== 'gallery');

  private smallMq: MediaQueryList | null = null;
  private motionMq: MediaQueryList | null = null;
  private onSmallChange = (e: MediaQueryListEvent) => this.isSmallScreen.set(e.matches);
  private onMotionChange = (e: MediaQueryListEvent) => this.reducedMotion.set(e.matches);

  private activeFlyer: HTMLElement | null = null;
  private detailsTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.smallMq = window.matchMedia(SMALL_SCREEN_MQ);
    this.isSmallScreen.set(this.smallMq.matches);
    this.smallMq.addEventListener('change', this.onSmallChange);

    this.motionMq = window.matchMedia(REDUCED_MOTION_MQ);
    this.reducedMotion.set(this.motionMq.matches);
    this.motionMq.addEventListener('change', this.onMotionChange);
  }

  onGalleryPrintFocused(printIndex: number): void {
    this.store.lastPrintIndex.set(printIndex);
  }

  onGalleryOpenPrint(event: PrintOpenEvent): void {
    this.openPrintWithFlyer(event.printIndex, event.rect);
  }

  onListOrCardSelect(event: {printIndex: number; rect: ProjectedRect}): void {
    this.openPrintWithFlyer(event.printIndex, event.rect);
  }

  openList(): void {
    this.clearPrintTimers();
    this.store.view.set('list');
  }

  returnToHome(): void {
    this.clearPrintTimers();
    this.store.view.set('gallery');
    if (this.galleryFocused()) {
      this.galleryStage()?.stepBack();
    }
  }

  returnToRoom(explicitPrintIndex?: number): void {
    const wasInOverlay = this.store.view() !== 'gallery';
    const targetIdx = explicitPrintIndex ?? this.store.lastPrintIndex();
    this.clearPrintTimers();
    this.store.view.set('gallery');

    if (wasInOverlay) {
      this.galleryStage()?.focusOuterPrint(targetIdx);
    } else if (this.galleryFocused()) {
      this.galleryStage()?.stepBack();
    }
  }

  private clearPrintTimers(): void {
    if (this.detailsTimer) {
      clearTimeout(this.detailsTimer);
      this.detailsTimer = null;
    }
    if (this.activeFlyer) {
      this.activeFlyer.remove();
      this.activeFlyer = null;
    }
  }

  private openPrintWithFlyer(printIndex: number, sourceRect: ProjectedRect): void {
    this.clearPrintTimers();

    this.store.activePrintIndex.set(printIndex);
    this.store.lastPrintIndex.set(printIndex);
    this.store.view.set('page');

    const page = this.printPage();
    page?.scrollToTop(false);

    if (this.reducedMotion() || sourceRect.width <= 0 || sourceRect.height <= 0) {
      this.store.pageImageHidden.set(false);
      this.store.pageDetailsVisible.set(true);
      return;
    }

    this.store.pageImageHidden.set(true);
    this.store.pageDetailsVisible.set(false);

    const flyer = document.createElement('div');
    flyer.style.position = 'fixed';
    flyer.style.left = `${sourceRect.left}px`;
    flyer.style.top = `${sourceRect.top}px`;
    flyer.style.width = `${sourceRect.width}px`;
    flyer.style.height = `${sourceRect.height}px`;
    flyer.style.zIndex = '25';
    flyer.style.pointerEvents = 'none';
    flyer.style.transformOrigin = 'top left';
    flyer.style.boxShadow = '0 0 0 8px #F6EAD8';
    flyer.style.backgroundColor = '#F6EAD8';

    const print = PRINTS[printIndex];
    if (print) {
      applyPhotoBackground(flyer, print.imageUrl, 'contain');
    }
    document.body.appendChild(flyer);
    this.activeFlyer = flyer;

    requestAnimationFrame(() => {
      const targetRect = this.printPage()?.getPageImageRect();
      if (!targetRect || targetRect.width <= 0 || targetRect.height <= 0) {
        this.store.pageImageHidden.set(false);
        flyer.remove();
        this.activeFlyer = null;
        return;
      }

      const dx = targetRect.left - sourceRect.left;
      const dy = targetRect.top - sourceRect.top;
      const sx = targetRect.width / sourceRect.width;
      const sy = targetRect.height / sourceRect.height;

      const anim = flyer.animate(
        [
          {transform: 'translate(0px, 0px) scale(1, 1)'},
          {transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`},
        ],
        {
          duration: 300,
          easing: 'cubic-bezier(.25,.75,.25,1)',
          fill: 'forwards',
        },
      );

      anim.onfinish = () => {
        this.store.pageImageHidden.set(false);
        flyer.remove();
        if (this.activeFlyer === flyer) {
          this.activeFlyer = null;
        }
      };
    });

    this.detailsTimer = setTimeout(() => {
      this.store.pageDetailsVisible.set(true);
      this.detailsTimer = null;
    }, 1000);
  }

  ngOnDestroy(): void {
    this.clearPrintTimers();
    if (this.smallMq) {
      this.smallMq.removeEventListener('change', this.onSmallChange);
    }
    if (this.motionMq) {
      this.motionMq.removeEventListener('change', this.onMotionChange);
    }
  }
}

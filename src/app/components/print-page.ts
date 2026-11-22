import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {ACCORDIONS, ArtPrint, PRINTS} from '../data/prints';
import {SheetCropDirective} from '../directives/sheet-crop';
import {ZestwellStore} from '../services/store';
import {ProjectedRect} from './gallery-stage';

@Component({
  selector: 'app-print-page',
  imports: [SheetCropDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      #pageEl
      id="page"
      class="page"
      [class.open]="open()"
      [attr.aria-hidden]="!open()"
    >
      <div class="page-grid">
        <div class="left-col">
          <div class="sticky-box">
            <div
              #pageImg
              class="page-img"
              [class.hidden-for-flyer]="store.pageImageHidden()"
              [style.aspect-ratio]="print().width + ' / ' + print().height"
              [appSheetCrop]="print().index"
              fit="cover"
              role="img"
              [attr.aria-label]="print().title + ' — ' + print().artist"
            ></div>

            <div class="meta-row" [class.revealed]="store.pageDetailsVisible()">
              <span>{{ print().index + 1 }} / {{ totalPrints }}</span>

              <button
                type="button"
                class="meta-btn"
                (click)="viewInRoom.emit(print().index)"
              >
                <svg
                  class="meta-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
                  <path d="M12 12 4 7.5" />
                  <path d="M12 12l8-4.5" />
                  <path d="M12 12v9" />
                </svg>
                <span>{{ store.lang() === 'bs' ? 'Pogledaj u hodniku' : 'View in corridor' }}</span>
              </button>

              <button
                type="button"
                class="meta-btn bookmark-btn"
                [attr.aria-label]="bookmarkLabel()"
                [attr.aria-pressed]="isSaved()"
                (click)="store.toggleSaved(print().index)"
              >
                <svg
                  class="meta-svg"
                  viewBox="0 0 24 24"
                  [attr.fill]="isSaved() ? 'currentColor' : 'none'"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 4h12v16l-6-4-6 4V4Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="right-col" [class.revealed]="store.pageDetailsVisible()">
          <h2 class="title">{{ print().title }}</h2>
          <p class="artist">{{ print().artist }}</p>
          <p class="desc">
            {{ store.lang() === 'bs' ? print().descriptionBs : print().descriptionEn }}
          </p>

          <div class="arch-meta-grid">
            <div class="arch-meta-cell">
              <span class="arch-meta-label">
                {{ store.lang() === 'bs' ? 'GODINA' : 'YEAR' }}
              </span>
              <span class="arch-meta-value">{{ print().year }}</span>
            </div>

            <div class="arch-meta-cell">
              <span class="arch-meta-label">
                {{ store.lang() === 'bs' ? 'LOKACIJA' : 'LOCATION' }}
              </span>
              <span class="arch-meta-value">{{ print().location }}</span>
            </div>

            <div class="arch-meta-cell">
              <span class="arch-meta-label">
                {{ store.lang() === 'bs' ? 'VRSTA ZAPISA' : 'RECORD TYPE' }}
              </span>
              <span class="arch-meta-value">
                {{ recordTypeLabel() }}
              </span>
            </div>

            <div class="arch-meta-cell">
              <span class="arch-meta-label">
                {{ store.lang() === 'bs' ? 'ARHIVSKI FORMAT' : 'DIMENSIONS' }}
              </span>
              <span class="arch-meta-value">{{ print().width }} × {{ print().height }} px</span>
            </div>
          </div>

          <div class="arch-actions">
            <button
              type="button"
              class="arch-btn-primary"
              (click)="viewInRoom.emit(print().index)"
            >
              {{ store.lang() === 'bs' ? 'POGLEDAJ U 3D HODNIKU →' : 'VIEW IN 3D CORRIDOR →' }}
            </button>

            <button
              type="button"
              class="arch-btn-secondary"
              (click)="onNextArchiveItem()"
            >
              {{ store.lang() === 'bs' ? 'SLJEDEĆA FOTOGRAFIJA →' : 'NEXT PHOTOGRAPH →' }}
            </button>
          </div>

          <div class="accordions">
            @for (acc of accordions; track acc.titleBs; let i = $index) {
              <div class="acc-item" [class.open]="openAcc() === i">
                <button
                  type="button"
                  class="acc-head"
                  [attr.aria-expanded]="openAcc() === i"
                  (click)="toggleAcc(i)"
                >
                  <span>{{ store.lang() === 'bs' ? acc.titleBs : acc.titleEn }}</span>
                  <span class="acc-plus">+</span>
                </button>
                <div class="acc-body-wrap">
                  <div class="acc-body-inner">
                    <p class="acc-body">
                      {{ store.lang() === 'bs' ? acc.bodyBs : acc.bodyEn }}
                    </p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="collection-band" [class.revealed]="store.pageDetailsVisible()">
        <h3 class="collection-heading">
          {{ store.lang() === 'bs' ? 'OSTALE FOTOGRAFIJE' : 'MORE FROM THE ARCHIVE' }}
        </h3>

        <div class="collection-row">
          @for (item of collectionItems(); track item.index) {
            <button
              type="button"
              class="col-card"
              (click)="onSelectCollectionCard(item.index, $event)"
            >
              <span class="col-img-wrap">
                <span class="col-img" [appSheetCrop]="item.index"></span>
              </span>
              <span class="col-title">{{ item.title }}</span>
              <span class="col-artist">{{ item.artist }}</span>
              <span class="col-year">{{ item.year }}</span>
            </button>
          }
        </div>
      </div>
    </section>
  `,
})
export class PrintPage {
  readonly store = inject(ZestwellStore);
  readonly open = input<boolean>(false);
  readonly reducedMotion = input<boolean>(false);

  readonly viewInRoom = output<number>();
  readonly openCollectionPrint = output<{printIndex: number; rect: ProjectedRect}>();

  private readonly pageElRef = viewChild<ElementRef<HTMLElement>>('pageEl');
  private readonly pageImgRef = viewChild<ElementRef<HTMLElement>>('pageImg');

  readonly accordions = ACCORDIONS;
  readonly totalPrints = PRINTS.length;

  readonly openAcc = signal<number | null>(0);

  readonly print = computed<ArtPrint>(() => this.store.activePrint());
  readonly isSaved = computed(() =>
    this.store.savedPrints().has(this.print().index),
  );

  readonly bookmarkLabel = computed(() => {
    const bs = this.store.lang() === 'bs';
    if (this.isSaved()) {
      return bs ? 'Ukloni oznaku' : 'Remove bookmark';
    }
    return bs ? 'Sačuvaj u pregled' : 'Bookmark record';
  });

  readonly recordTypeLabel = computed(() => {
    const p = this.print();
    const bs = this.store.lang() === 'bs';
    if (p.height > p.width) {
      return bs ? 'Novinski članak' : 'Newspaper clipping';
    }
    return bs ? 'Timska fotografija' : 'Team photograph';
  });

  readonly collectionItems = computed<ArtPrint[]>(() => {
    const start = this.print().index;
    return [1, 2, 3, 4].map((offset) => PRINTS[(start + offset) % PRINTS.length]);
  });

  toggleAcc(idx: number): void {
    this.openAcc.update((curr) => (curr === idx ? null : idx));
  }

  getPageImageRect(): DOMRect | null {
    return this.pageImgRef()?.nativeElement.getBoundingClientRect() ?? null;
  }

  scrollToTop(smooth: boolean): void {
    const el = this.pageElRef()?.nativeElement;
    if (!el) return;
    el.scrollTo({
      top: 0,
      behavior: smooth && !this.reducedMotion() ? 'smooth' : 'auto',
    });
  }

  onNextArchiveItem(): void {
    const nextIdx = (this.print().index + 1) % PRINTS.length;
    const domRect = this.getPageImageRect();
    this.scrollToTop(true);
    this.openCollectionPrint.emit({
      printIndex: nextIdx,
      rect: domRect
        ? {
            left: domRect.left,
            top: domRect.top,
            width: domRect.width,
            height: domRect.height,
          }
        : {left: 0, top: 0, width: 0, height: 0},
    });
  }

  onSelectCollectionCard(printIndex: number, event: MouseEvent): void {
    const btn = event.currentTarget as HTMLElement | null;
    const imgEl = btn?.querySelector('.col-img') as HTMLElement | null;
    const domRect = (imgEl ?? btn)?.getBoundingClientRect();
    this.scrollToTop(true);
    if (domRect) {
      this.openCollectionPrint.emit({
        printIndex,
        rect: {
          left: domRect.left,
          top: domRect.top,
          width: domRect.width,
          height: domRect.height,
        },
      });
    }
  }
}

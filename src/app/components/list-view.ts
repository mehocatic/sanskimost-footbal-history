import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import {PRINTS} from '../data/prints';
import {SheetCropDirective} from '../directives/sheet-crop';
import {ZestwellStore} from '../services/store';
import {ProjectedRect} from './gallery-stage';

@Component({
  selector: 'app-list-view',
  imports: [SheetCropDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      id="list"
      class="list-section"
      [class.open]="open()"
      [attr.aria-hidden]="!open()"
    >
      <div class="list-header">
        <h2 class="list-heading">
          {{ store.lang() === 'bs' ? 'HODNIK HISTORIJE — ARHIV' : 'CORRIDOR OF HISTORY — ARCHIVE' }}
        </h2>

        <div
          class="list-toggle"
          role="tablist"
          [attr.aria-label]="store.lang() === 'bs' ? 'Prikaz' : 'View mode'"
        >
          <button
            type="button"
            role="tab"
            class="toggle-btn"
            aria-selected="false"
            (click)="selectGallery.emit()"
          >
            {{ store.lang() === 'bs' ? 'GALERIJA' : 'GALLERY' }}
          </button>
          <button
            type="button"
            role="tab"
            class="toggle-btn active"
            aria-selected="true"
          >
            {{ store.lang() === 'bs' ? 'LISTA' : 'LIST' }}
          </button>
        </div>
      </div>

      <div class="list-grid">
        @for (item of prints; track item.index) {
          <button
            type="button"
            class="list-card"
            (click)="onCardClick(item.index, $event)"
          >
            <span class="list-img-wrap">
              <span class="list-img" [appSheetCrop]="item.index"></span>
            </span>
            <span class="list-title">{{ item.title }}</span>
            <span class="list-artist">{{ item.artist }}</span>
            <span class="list-year">{{ item.year }}</span>
          </button>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .list-section {
        position: fixed;
        inset: 0;
        z-index: 14;
        background: var(--page);
        overflow-y: auto;
        overflow-x: hidden;
        padding: calc(110 * var(--w)) calc(48 * var(--w)) calc(80 * var(--w));
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }

      .list-section.open {
        opacity: 1;
        pointer-events: auto;
        visibility: visible;
      }

      .list-header {
        margin-bottom: calc(36 * var(--w));
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      .list-toggle {
        display: inline-flex;
        border: 1px solid var(--ink-35);
        border-radius: 99px;
        padding: calc(2 * var(--u));
        gap: calc(2 * var(--u));
      }

      .toggle-btn {
        font-family: var(--mono);
        font-size: max(11px, calc(9.5 * var(--u)));
        letter-spacing: 0.12em;
        height: max(24px, calc(22 * var(--u)));
        padding: 0 calc(14 * var(--u));
        border-radius: 99px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--ink);
        transition: background 0.2s ease, color 0.2s ease;
      }

      .toggle-btn.active {
        background: var(--ink);
        color: var(--wall);
      }

      .list-heading {
        margin: 0;
        font-family: var(--cond);
        font-weight: 600;
        font-size: calc(38 * var(--w));
        text-transform: uppercase;
        line-height: 1;
      }

      .list-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(calc(190 * var(--w)), 1fr));
        column-gap: calc(48 * var(--w));
        row-gap: calc(46 * var(--w));
      }

      .list-card {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
      }

      .list-img-wrap {
        display: block;
        width: 100%;
        margin-bottom: calc(14 * var(--w));
        transition: transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1);
      }

      .list-card:hover .list-img-wrap {
        transform: translateY(calc(-4 * var(--w)));
      }

      .list-img {
        display: block;
        width: 100%;
        aspect-ratio: 4 / 3;
        background-color: #f6ead8;
        box-shadow: 0 0 0 calc(7 * var(--w)) #f6ead8;
      }

      .list-title {
        font-family: var(--serif);
        font-weight: 500;
        font-size: max(11px, calc(15 * var(--w)));
        line-height: 1.25;
      }

      .list-artist {
        font-family: var(--serif);
        font-style: italic;
        font-size: max(11px, calc(13.5 * var(--w)));
        color: var(--ink-60);
        margin-top: calc(2 * var(--w));
      }

      .list-year {
        font-family: var(--mono);
        font-size: max(11px, calc(11 * var(--w)));
        color: var(--ink-60);
        margin-top: calc(5 * var(--w));
      }

      @media (max-width: 819px), (orientation: portrait) and (max-width: 1100px), (orientation: landscape) and (max-height: 500px) {
        .list-section {
          padding: 76px 16px 60px;
        }

        .list-header {
          margin-bottom: 24px;
        }

        .list-heading {
          font-size: 28px;
        }

        .list-grid {
          grid-template-columns: repeat(2, 1fr);
          column-gap: 16px;
          row-gap: 28px;
        }

        .list-img-wrap {
          margin-bottom: 10px;
        }

        .list-img {
          box-shadow: 0 0 0 5px #f6ead8;
        }

        .list-title {
          font-size: 14px;
        }

        .list-artist {
          font-size: 13px;
        }

        .list-year {
          font-size: 11px;
        }
      }
    `,
  ],
})
export class ListView {
  readonly store = inject(ZestwellStore);
  readonly open = input<boolean>(false);
  readonly selectPrint = output<{printIndex: number; rect: ProjectedRect}>();
  readonly selectGallery = output<void>();

  readonly prints = PRINTS;

  onCardClick(printIndex: number, event: MouseEvent): void {
    const btn = event.currentTarget as HTMLElement | null;
    const imgEl = btn?.querySelector('.list-img') as HTMLElement | null;
    const domRect = (imgEl ?? btn)?.getBoundingClientRect();
    if (domRect) {
      this.selectPrint.emit({
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

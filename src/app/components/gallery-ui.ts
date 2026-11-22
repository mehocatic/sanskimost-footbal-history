import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {Lang} from '../data/prints';

@Component({
  selector: 'app-gallery-ui',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gui" [class.hidden]="hidden()" [class.intro-done]="introReady()">
      <div class="arrows">
        <button
          type="button"
          class="arrow-btn"
          [attr.aria-label]="lang() === 'bs' ? 'Prethodna fotografija' : 'Previous photograph'"
          (click)="stepPrev.emit()"
        >
          <svg
            class="arrow-svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="m11 6-6 6 6 6" />
          </svg>
        </button>

        <button
          type="button"
          class="arrow-btn"
          [attr.aria-label]="lang() === 'bs' ? 'Sljedeća fotografija' : 'Next photograph'"
          (click)="stepNext.emit()"
        >
          <svg
            class="arrow-svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </button>
      </div>

      <div class="hint" aria-live="polite">
        <span class="mask">
          <span class="rise" style="--mi: 0">
            @if (lang() === 'bs') {
              {{ focused() ? 'Kliknite fotografiju za otvaranje' : 'Skroluj ili prevuci za šetnju' }}
            } @else {
              {{ focused() ? 'Click the photograph to open it' : 'Scroll or drag to walk round' }}
            }
          </span>
        </span>
        <span class="mask">
          <span class="rise" style="--mi: 1">
            @if (lang() === 'bs') {
              {{ focused() ? 'Esc ili klik sa strane za povratak' : 'Kliknite fotografiju da priđete bliže' }}
            } @else {
              {{ focused() ? 'Esc or click away to step back' : 'Click a photograph to look closer' }}
            }
          </span>
        </span>
      </div>

      <div class="toggle" role="tablist" [attr.aria-label]="lang() === 'bs' ? 'Prikaz' : 'View mode'">
        <button
          type="button"
          role="tab"
          class="toggle-btn"
          [class.active]="mode() === 'gallery'"
          [attr.aria-selected]="mode() === 'gallery'"
          (click)="selectGallery.emit()"
        >
          {{ lang() === 'bs' ? 'GALERIJA' : 'GALLERY' }}
        </button>
        <button
          type="button"
          role="tab"
          class="toggle-btn"
          [class.active]="mode() === 'list'"
          [attr.aria-selected]="mode() === 'list'"
          (click)="selectList.emit()"
        >
          {{ lang() === 'bs' ? 'LISTA' : 'LIST' }}
        </button>
      </div>

      <div class="caption">
        <span class="mask kicker-mask">
          <span class="rise kicker" style="--mi: 2">
            {{ lang() === 'bs' ? 'UPRAVO PROLAZITE PORED' : 'YOU ARE WALKING PAST' }}
          </span>
        </span>

        <div class="headline-row">
          <h1 class="headline">
            <span class="mask">
              <span class="rise" style="--mi: 3">
                {{ lang() === 'bs' ? 'HODNIK HISTORIJE' : 'CORRIDOR OF HISTORY' }}
              </span>
            </span>
          </h1>

          <button
            type="button"
            class="enter-link"
            (click)="selectList.emit()"
          >
            <span class="mask">
              <span class="rise enter-inner" style="--mi: 4">
                {{ lang() === 'bs' ? 'ISTRAŽI ARHIV →' : 'ENTER THE ARCHIVE →' }}
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .gui {
        position: fixed;
        inset: 0;
        z-index: 20;
        pointer-events: none;
        opacity: 1;
        visibility: visible;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }

      .gui.hidden {
        opacity: 0;
        visibility: hidden;
      }

      .gui button {
        pointer-events: auto;
      }

      .gui.hidden button {
        pointer-events: none;
      }

      .mask {
        display: block;
        overflow: hidden;
      }

      .rise {
        display: block;
        transform: translateY(105%);
      }

      .gui.intro-done .rise {
        animation: maskRise 1000ms cubic-bezier(0.2, 0.7, 0.2, 1)
          calc(250ms + var(--mi) * 60ms) both;
      }

      .arrows {
        position: absolute;
        left: calc(27 * var(--u));
        top: calc(262 * var(--u));
        display: flex;
        flex-direction: column;
        gap: calc(10 * var(--u));
      }

      .arrow-btn {
        width: max(24px, calc(50 * var(--u)));
        height: max(24px, calc(50 * var(--u)));
        border: 1.5px solid var(--ink);
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--ink);
        background: transparent;
        transition: background 0.25s ease, color 0.25s ease;
      }

      .arrow-btn:hover {
        background: var(--ink);
        color: var(--wall);
      }

      .arrow-svg {
        width: calc(20 * var(--u));
        height: calc(20 * var(--u));
      }

      .hint {
        position: absolute;
        right: calc(27 * var(--u));
        bottom: calc(229 * var(--u));
        text-align: right;
        font-family: var(--mono);
        font-size: max(11px, calc(10 * var(--u)));
        letter-spacing: 0.12em;
        line-height: 1.65;
        text-transform: uppercase;
      }

      .toggle {
        position: absolute;
        right: calc(29 * var(--u));
        bottom: calc(174 * var(--u));
        display: inline-flex;
        border: 1px solid var(--ink-35);
        border-radius: 99px;
        padding: calc(2 * var(--u));
        gap: calc(2 * var(--u));
        pointer-events: auto;
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

      .caption {
        position: absolute;
        left: calc(25 * var(--u));
        right: calc(25 * var(--u));
        bottom: calc(30 * var(--u));
      }

      .kicker-mask {
        width: max-content;
        margin: 0 0 calc(10 * var(--u)) calc(3 * var(--u));
      }

      .kicker {
        font-family: var(--mono);
        font-size: max(11px, calc(11.5 * var(--u)));
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .headline-row {
        display: flex;
        align-items: flex-end;
        flex-wrap: wrap;
        gap: calc(28 * var(--u));
      }

      .headline {
        margin: 0;
        font-family: var(--cond);
        font-weight: 600;
        font-size: calc(146 * var(--u));
        line-height: 0.84;
        letter-spacing: -0.005em;
        white-space: nowrap;
      }

      .enter-link {
        margin-bottom: calc(8 * var(--u));
        min-height: 24px;
        display: inline-flex;
        align-items: flex-end;
        font-family: var(--mono);
        font-size: max(11px, calc(11 * var(--u)));
        letter-spacing: 0.12em;
        white-space: nowrap;
      }

      .enter-inner {
        border-bottom: 1px solid var(--ink);
        padding-bottom: calc(2 * var(--u));
      }

      @media (min-width: 820px) and (max-aspect-ratio: 1/1) {
        .headline {
          font-size: calc(120 * var(--u));
        }
      }

      @media (max-width: 819px), (orientation: portrait) and (max-width: 1100px), (orientation: landscape) and (max-height: 500px) {
        .hint {
          top: 62px;
          left: 16px;
          right: 16px;
          bottom: auto;
          text-align: left;
          font-size: 11px;
        }

        .caption {
          left: 14px;
          right: 14px;
          bottom: 100px;
        }

        .kicker-mask {
          margin: 0 0 8px 0;
        }

        .kicker {
          font-size: 11px;
        }

        .headline-row {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .headline {
          font-size: min(17vw, 15vh);
          white-space: normal;
          line-height: 0.88;
        }

        .enter-link {
          margin-top: 0;
          margin-bottom: 0;
          font-size: 11px;
        }

        .enter-inner {
          padding-bottom: 2px;
        }

        .arrows {
          left: 16px;
          bottom: 24px;
          top: auto;
          flex-direction: row;
          gap: 8px;
        }

        .arrow-btn {
          width: 44px;
          height: 44px;
        }

        .arrow-svg {
          width: 18px;
          height: 18px;
        }

        .toggle {
          right: 16px;
          bottom: 30px;
          padding: 2px;
          gap: 2px;
        }

        .toggle-btn {
          height: 26px;
          padding: 0 12px;
          font-size: 11px;
        }
      }

      @media (orientation: landscape) and (max-height: 500px) {
        .hint {
          display: none;
        }

        .caption {
          bottom: 18px;
        }

        .headline {
          font-size: min(11vw, 24vh);
          white-space: nowrap;
        }

        .arrows {
          left: auto;
          right: 16px;
          bottom: 18px;
        }

        .toggle {
          top: 60px;
          right: 16px;
          bottom: auto;
        }
      }
    `,
  ],
})
export class GalleryUi {
  readonly hidden = input<boolean>(false);
  readonly introReady = input<boolean>(false);
  readonly focused = input<boolean>(false);
  readonly mode = input<'gallery' | 'list'>('gallery');
  readonly lang = input<Lang>('bs');

  readonly stepPrev = output<void>();
  readonly stepNext = output<void>();
  readonly selectGallery = output<void>();
  readonly selectList = output<void>();
}

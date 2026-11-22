import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {ZestwellStore} from '../services/store';

@Component({
  selector: 'app-nav-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="nav"
      [class.solid]="solidNav() || mobileOpen()"
      [class.intro-done]="introReady()"
    >
      <button
        type="button"
        class="logo nav-item"
        style="--ni: 0"
        (click)="onCorridor()"
      >
        Sanski Most
      </button>

      <nav class="nav-links" aria-label="Primarna navigacija">
        <span class="nav-link nav-item" style="--ni: 1">
          {{ store.lang() === 'bs' ? 'POČETNA' : 'HOME' }}
        </span>
        <span class="nav-link nav-item" style="--ni: 2">
          {{ store.lang() === 'bs' ? 'ISTRAŽI' : 'EXPLORE' }}
        </span>
        <span class="nav-link nav-item" style="--ni: 3">
          {{ store.lang() === 'bs' ? 'HISTORIJA' : 'HISTORY' }}
        </span>
        <span class="nav-link nav-item" style="--ni: 4">
          {{ store.lang() === 'bs' ? 'LIČNOSTI' : 'FIGURES' }}
        </span>
        <span class="nav-link nav-item" style="--ni: 5">
          {{ store.lang() === 'bs' ? 'ARHIV' : 'ARCHIVE' }}
        </span>
        <span class="nav-link nav-item" style="--ni: 6">
          {{ store.lang() === 'bs' ? 'KVIZ' : 'QUIZ' }}
        </span>
        <span class="nav-link nav-item" style="--ni: 7">
          {{ store.lang() === 'bs' ? 'POSJETA' : 'VISIT' }}
        </span>
        <button
          type="button"
          class="nav-link nav-item active"
          style="--ni: 8"
          (click)="onCorridor()"
        >
          {{ store.lang() === 'bs' ? 'HODNIK HISTORIJE' : 'CORRIDOR OF HISTORY' }}
        </button>
      </nav>

      <div class="nav-right nav-item" style="--ni: 9">
        <button
          type="button"
          class="mobile-menu-btn"
          [attr.aria-expanded]="mobileOpen()"
          (click)="mobileOpen.set(!mobileOpen())"
        >
          {{ mobileOpen() ? '✕' : (store.lang() === 'bs' ? 'MENI' : 'MENU') }}
        </button>

        <div class="lang-switch" role="group" aria-label="Odabir jezika">
          <button
            type="button"
            class="lang-btn"
            [class.active]="store.lang() === 'bs'"
            [attr.aria-pressed]="store.lang() === 'bs'"
            (click)="store.setLang('bs')"
          >
            BS
          </button>
          <span class="lang-sep" aria-hidden="true">|</span>
          <button
            type="button"
            class="lang-btn"
            [class.active]="store.lang() === 'en'"
            [attr.aria-pressed]="store.lang() === 'en'"
            (click)="store.setLang('en')"
          >
            EN
          </button>
        </div>
      </div>
    </header>

    @if (mobileOpen()) {
      <div class="mobile-drawer" role="dialog" aria-label="Navigacija">
        <span class="mobile-link">
          {{ store.lang() === 'bs' ? 'POČETNA' : 'HOME' }}
        </span>
        <span class="mobile-link">
          {{ store.lang() === 'bs' ? 'ISTRAŽI' : 'EXPLORE' }}
        </span>
        <span class="mobile-link">
          {{ store.lang() === 'bs' ? 'HISTORIJA' : 'HISTORY' }}
        </span>
        <span class="mobile-link">
          {{ store.lang() === 'bs' ? 'LIČNOSTI' : 'FIGURES' }}
        </span>
        <span class="mobile-link">
          {{ store.lang() === 'bs' ? 'ARHIV' : 'ARCHIVE' }}
        </span>
        <span class="mobile-link">
          {{ store.lang() === 'bs' ? 'KVIZ' : 'QUIZ' }}
        </span>
        <span class="mobile-link">
          {{ store.lang() === 'bs' ? 'POSJETA' : 'VISIT' }}
        </span>
        <button
          type="button"
          class="mobile-link active"
          (click)="onCorridor()"
        >
          {{ store.lang() === 'bs' ? 'HODNIK HISTORIJE' : 'CORRIDOR OF HISTORY' }}
        </button>
      </div>
    }
  `,
  styles: [
    `
      .nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: calc(58 * var(--u));
        display: flex;
        align-items: center;
        padding: 0 calc(27 * var(--u));
        z-index: 30;
        background: transparent;
        border-bottom: 1px solid transparent;
        transition: background 0.3s ease, border-color 0.3s ease;
      }

      .nav.solid {
        background: var(--page);
        border-bottom-color: var(--ink-15);
      }

      .nav-item {
        opacity: 0;
      }

      .nav.intro-done .nav-item {
        animation: navFade 1000ms cubic-bezier(0.2, 0.7, 0.2, 1)
          calc(250ms + (5 + var(--ni)) * 60ms) both;
      }

      .logo {
        font-family: var(--serif);
        font-weight: 500;
        font-size: calc(21 * var(--u));
        letter-spacing: -0.01em;
        white-space: nowrap;
        min-height: 24px;
        display: inline-flex;
        align-items: center;
      }

      .nav-links {
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: calc(22 * var(--u));
      }

      .nav-link {
        position: relative;
        font-family: var(--mono);
        font-size: max(11px, calc(11 * var(--u)));
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--ink-60);
        min-height: 28px;
        padding-bottom: 3px;
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
        transition: color 0.2s ease;
      }

      .nav-link::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 1.5px;
        background: var(--ink);
        transform: scaleX(0);
        transform-origin: center;
        transition: transform 0.22s ease;
      }

      button.nav-link:hover,
      .nav-link.active {
        color: var(--ink);
      }

      .nav-link.active::after {
        transform: scaleX(1);
      }

      .nav-right {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .lang-switch {
        display: inline-flex;
        align-items: center;
        gap: calc(8 * var(--u));
        font-family: var(--mono);
        font-size: max(11px, calc(11 * var(--u)));
        letter-spacing: 0.12em;
      }

      .lang-btn {
        min-height: 24px;
        padding: 0 2px;
        color: var(--ink-60);
        font-weight: 400;
        transition: color 0.2s ease;
      }

      .lang-btn.active {
        color: var(--ink);
        font-weight: 500;
      }

      .lang-btn:hover {
        color: var(--ink);
      }

      .lang-sep {
        color: var(--ink-35);
        user-select: none;
      }

      .mobile-menu-btn {
        display: none;
        font-family: var(--mono);
        font-size: 11px;
        letter-spacing: 0.14em;
        padding: 4px 10px;
        border: 1px solid var(--ink-35);
        border-radius: 99px;
        min-height: 26px;
        align-items: center;
      }

      .mobile-drawer {
        position: fixed;
        top: 52px;
        left: 0;
        right: 0;
        z-index: 29;
        background: var(--page);
        border-bottom: 1px solid var(--ink-15);
        padding: 12px 16px 18px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        box-shadow: 0 10px 28px rgba(58, 53, 80, 0.1);
      }

      .mobile-link {
        text-align: left;
        font-family: var(--mono);
        font-size: 12px;
        letter-spacing: 0.14em;
        padding: 10px 6px;
        color: var(--ink-60);
        border-bottom: 1px solid var(--ink-15);
      }

      .mobile-link:last-child {
        border-bottom: 0;
      }

      .mobile-link.active {
        color: var(--ink);
        font-weight: 500;
      }

      @media (max-width: 960px), (orientation: portrait) and (max-width: 1100px), (orientation: landscape) and (max-height: 500px) {
        .nav {
          height: 52px;
          padding: 0 16px;
          justify-content: space-between;
        }

        .logo {
          font-size: 19px;
        }

        .nav-links {
          display: none;
        }

        .mobile-menu-btn {
          display: inline-flex;
        }
      }
    `,
  ],
})
export class NavBar {
  readonly store = inject(ZestwellStore);
  readonly solidNav = input<boolean>(false);
  readonly introReady = input<boolean>(false);

  readonly goCorridor = output<void>();

  readonly mobileOpen = signal(false);

  onCorridor(): void {
    this.mobileOpen.set(false);
    this.goCorridor.emit();
  }
}

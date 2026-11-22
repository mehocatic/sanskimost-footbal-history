import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import * as THREE from 'three';
import {ArtPrint, Lang, PRINTS} from '../data/prints';

export interface ProjectedRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PrintOpenEvent {
  printIndex: number;
  rect: ProjectedRect;
}

interface Pose {
  th: number;
  r: number;
  yaw: number;
  y: number;
  pitch: number;
}

interface PrintGroupEntry {
  printIndex: number;
  angle: number;
  wall: 'outer' | 'inner';
  pw: number;
  ph: number;
  mesh: THREE.Mesh;
}

interface GlideState {
  startMs: number;
  durationMs: number;
  from: Pose;
  to: Pose;
  mode: 'focus' | 'walk' | 'intro';
}

const OUTER_RADIUS = 18;
const INNER_RADIUS = 12.2;
const WALL_HEIGHT = 6.2;
const OUTER_COUNT = 36;
const INNER_COUNT = 24;
const STEP = (2 * Math.PI) / OUTER_COUNT;
const PY = 1.95;

function computeFrameDimensions(print: ArtPrint): {pw: number; ph: number} {
  const aspect = print.width / print.height;
  if (aspect >= 1) {
    const maxW = 2.32;
    const baseH = 1.38;
    const pw = Math.min(maxW, baseH * aspect);
    const ph = pw / aspect;
    return {pw, ph};
  }
  const ph = 1.95;
  const pw = Math.max(0.86, ph * aspect);
  return {pw, ph};
}

@Component({
  selector: 'app-gallery-stage',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      #galleryHost
      id="gallery"
      class="gallery-host"
      [class.grabbing]="isDragging()"
      [class.pointer]="isHoveringPrint()"
    >
      <div #canvasMount class="canvas-mount" [class.ready]="introStarted()"></div>
      <div class="veil" [class.faded]="introStarted()"></div>

      <div
        class="open-pill"
        [class.visible]="pillVisible()"
        [style.left.px]="pillX()"
        [style.top.px]="pillY()"
        aria-hidden="true"
      >
        {{ lang() === 'bs' ? 'OTVORI FOTOGRAFIJU' : 'OPEN PHOTOGRAPH' }}
      </div>
    </main>
  `,
  styles: [
    `
      .gallery-host {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        touch-action: none;
        cursor: grab;
        user-select: none;
        -webkit-user-select: none;
      }

      .gallery-host.grabbing {
        cursor: grabbing;
      }

      .gallery-host.pointer {
        cursor: pointer;
      }

      .canvas-mount {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .canvas-mount.ready {
        opacity: 1;
      }

      .veil {
        position: absolute;
        inset: 0;
        background: var(--wall);
        pointer-events: none;
        opacity: 1;
        transition: opacity 900ms ease-out;
        z-index: 2;
      }

      .veil.faded {
        opacity: 0;
      }

      .open-pill {
        position: fixed;
        z-index: 12;
        background: #1e1b2b;
        color: #ffffff;
        font-family: var(--mono);
        font-size: max(11px, calc(10 * var(--u)));
        letter-spacing: 0.14em;
        line-height: 1;
        padding: calc(7 * var(--u)) calc(13 * var(--u));
        border-radius: 99px;
        white-space: nowrap;
        transform: translate(-50%, -50%);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.12s ease;
      }

      .open-pill.visible {
        opacity: 1;
      }
    `,
  ],
})
export class GalleryStage implements OnInit, OnDestroy {
  readonly activeOverlay = input<boolean>(false);
  readonly reducedMotion = input<boolean>(false);
  readonly isSmallScreen = input<boolean>(false);
  readonly lang = input<Lang>('bs');

  readonly focusChanged = output<boolean>();
  readonly printFocused = output<number>();
  readonly openPrint = output<PrintOpenEvent>();
  readonly introReady = output<void>();

  private readonly hostRef = viewChild<ElementRef<HTMLElement>>('galleryHost');
  private readonly mountRef = viewChild<ElementRef<HTMLElement>>('canvasMount');
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly introStarted = signal(false);
  readonly isDragging = signal(false);
  readonly isHoveringPrint = signal(false);
  readonly pillVisible = signal(false);
  readonly pillX = signal(0);
  readonly pillY = signal(0);

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2();

  private printEntries: PrintGroupEntry[] = [];
  private printMeshes: THREE.Mesh[] = [];
  private labelTextures: {
    canvas: HTMLCanvasElement;
    tex: THREE.CanvasTexture;
    index: number;
  }[] = [];
  private disposables: {dispose: () => void}[] = [];

  private rafId = 0;
  private lastTimeMs = 0;
  private failsafeTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  private pose: Pose = {th: 0.14, r: 15.6, yaw: -0.3, y: 1.92, pitch: -0.12};
  private targetTh = 0.14;
  private focusedEntry: PrintGroupEntry | null = null;
  private glide: GlideState | null = null;

  private pointerDown = false;
  private pointerMoved = false;
  private pointerId = -1;
  private downX = 0;
  private downY = 0;
  private dragStartTh = 0;
  private hoverCursorX = 0;
  private hoverCursorY = 0;
  private hoveringFocused = false;

  private readonly _pos = new THREE.Vector3();
  private readonly _look = new THREE.Vector3();
  private readonly _corner = new THREE.Vector3();

  private onResizeBound = () => this.handleResize();
  private onWheelBound = (e: WheelEvent) => this.handleWheel(e);
  private onPointerDownBound = (e: PointerEvent) => this.handlePointerDown(e);
  private onPointerMoveBound = (e: PointerEvent) => this.handlePointerMove(e);
  private onPointerUpBound = (e: PointerEvent) => this.handlePointerUp(e);
  private onKeyDownBound = (e: KeyboardEvent) => this.handleKeyDown(e);

  ngOnInit(): void {
    if (!this.isBrowser) return;
    requestAnimationFrame(() => {
      if (!this.destroyed) {
        this.initThree();
      }
    });
  }

  private isPortraitSmall(): boolean {
    if (!this.isBrowser) return false;
    return this.isSmallScreen() && window.innerHeight > window.innerWidth;
  }

  private walkOffset(): number {
    return this.isPortraitSmall() ? 0.14 + 0.9 * STEP : 0.14;
  }

  private walkPose(th: number): Pose {
    if (this.isPortraitSmall()) {
      return {th, r: 15.4, yaw: -0.42, y: 1.9, pitch: -0.1};
    }
    return {th, r: 15.6, yaw: -0.3, y: 1.92, pitch: -0.12};
  }

  private focusPose(entry: PrintGroupEntry, targetAngle: number): Pose {
    const portrait = this.isPortraitSmall();
    if (entry.wall === 'outer') {
      return {
        th: targetAngle,
        r: portrait ? OUTER_RADIUS - 5.4 : OUTER_RADIUS - 4.45,
        yaw: Math.PI / 2,
        y: portrait ? PY - 0.95 : PY - 0.42,
        pitch: 0,
      };
    }
    return {
      th: targetAngle,
      r: portrait ? INNER_RADIUS + 5.4 : INNER_RADIUS + 4.45,
      yaw: -Math.PI / 2,
      y: portrait ? PY - 0.95 : PY - 0.42,
      pitch: 0,
    };
  }

  private initThree(): void {
    const mount = this.mountRef()?.nativeElement;
    const host = this.hostRef()?.nativeElement;
    if (!mount || !host) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    mount.appendChild(renderer.domElement);
    this.renderer = renderer;

    renderer.domElement.addEventListener('webglcontextlost', (ev) => {
      ev.preventDefault();
      cancelAnimationFrame(this.rafId);
    });
    renderer.domElement.addEventListener('webglcontextrestored', () => {
      this.lastTimeMs = performance.now();
      this.startLoop();
    });

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#FFF9EC');
    scene.fog = new THREE.Fog('#FFF9EC', 10, 46);
    this.scene = scene;

    const fov = w >= h ? 56 : 70;
    const camera = new THREE.PerspectiveCamera(fov, w / h, 0.05, 100);
    this.camera = camera;

    scene.add(new THREE.HemisphereLight(0xfffdf6, 0xe9cfa6, 1.55));
    scene.add(new THREE.AmbientLight(0xfff6e6, 0.55));

    this.buildCorridor(scene);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const {haloTex, shadowTex} = this.createBackdropTextures();

    let texLoaded = false;
    let fontsLoaded = false;
    let launched = false;

    const tryLaunch = () => {
      if (launched || this.destroyed) return;
      if (!texLoaded || !fontsLoaded) return;
      launched = true;
      if (this.failsafeTimer) {
        clearTimeout(this.failsafeTimer);
        this.failsafeTimer = null;
      }
      this.beginOpeningAnimation();
    };

    const manager = new THREE.LoadingManager();
    manager.onLoad = () => {
      texLoaded = true;
      tryLaunch();
    };
    manager.onError = () => {
      texLoaded = true;
      tryLaunch();
    };

    const textureLoader = new THREE.TextureLoader(manager);
    const printTextures: THREE.Texture[] = PRINTS.map((p) => {
      const tex = textureLoader.load(p.imageUrl);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      this.disposables.push(tex);
      return tex;
    });

    this.createLabels(maxAniso);
    this.buildPrintGroups(scene, printTextures, haloTex, shadowTex);

    const d = this.walkOffset();
    const baseWalk = this.walkPose(d);
    this.targetTh = d;

    if (this.reducedMotion()) {
      this.pose = {...baseWalk};
    } else {
      this.pose = {
        ...baseWalk,
        th: baseWalk.th + 0.16,
        r: baseWalk.r - 0.35,
      };
    }
    this.applyCameraPose();

    this.failsafeTimer = setTimeout(() => {
      if (!launched && !this.destroyed) {
        launched = true;
        this.redrawAllLabels();
        this.beginOpeningAnimation();
      }
    }, 4000);

    document.fonts.ready.then(() => {
      if (this.destroyed) return;
      this.redrawAllLabels();
      fontsLoaded = true;
      tryLaunch();
    });

    window.addEventListener('resize', this.onResizeBound);
    host.addEventListener('wheel', this.onWheelBound, {passive: false});
    host.addEventListener('pointerdown', this.onPointerDownBound);
    window.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('pointerup', this.onPointerUpBound);
    window.addEventListener('pointercancel', this.onPointerUpBound);
    window.addEventListener('keydown', this.onKeyDownBound);

    this.lastTimeMs = performance.now();
    this.startLoop();
  }

  private beginOpeningAnimation(): void {
    this.introStarted.set(true);
    this.introReady.emit();

    const targetWalk = this.walkPose(this.walkOffset());
    if (this.reducedMotion()) {
      this.pose = {...targetWalk};
      this.targetTh = targetWalk.th;
      this.glide = null;
      return;
    }

    this.glide = {
      startMs: performance.now(),
      durationMs: 1400,
      from: {...this.pose},
      to: {...targetWalk},
      mode: 'intro',
    };
  }

  private buildCorridor(scene: THREE.Scene): void {
    const outerCanvas = document.createElement('canvas');
    outerCanvas.width = 4;
    outerCanvas.height = 256;
    const octx = outerCanvas.getContext('2d');
    if (octx) {
      const grad = octx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#F5EBD8');
      grad.addColorStop(0.2, '#FBF3E3');
      grad.addColorStop(0.6, '#FBF3E3');
      grad.addColorStop(0.86, '#F8EDD9');
      grad.addColorStop(1, '#EFDFC4');
      octx.fillStyle = grad;
      octx.fillRect(0, 0, 4, 256);
    }
    const outerTex = new THREE.CanvasTexture(outerCanvas);
    outerTex.colorSpace = THREE.SRGBColorSpace;
    const outerGeo = new THREE.CylinderGeometry(
      OUTER_RADIUS,
      OUTER_RADIUS,
      WALL_HEIGHT,
      160,
      1,
      true,
    );
    const outerMat = new THREE.MeshBasicMaterial({
      map: outerTex,
      side: THREE.BackSide,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    outerMesh.position.y = 3.1;
    scene.add(outerMesh);
    this.disposables.push(outerTex, outerGeo, outerMat);

    const innerCanvas = document.createElement('canvas');
    innerCanvas.width = 4;
    innerCanvas.height = 256;
    const ictx = innerCanvas.getContext('2d');
    if (ictx) {
      const grad = ictx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#F7EEDD');
      grad.addColorStop(0.3, '#FFFAF0');
      grad.addColorStop(0.8, '#FDF5E6');
      grad.addColorStop(1, '#F1E1C6');
      ictx.fillStyle = grad;
      ictx.fillRect(0, 0, 4, 256);
    }
    const innerTex = new THREE.CanvasTexture(innerCanvas);
    innerTex.colorSpace = THREE.SRGBColorSpace;
    const innerGeo = new THREE.CylinderGeometry(
      INNER_RADIUS,
      INNER_RADIUS,
      WALL_HEIGHT,
      120,
      1,
      true,
    );
    const innerMat = new THREE.MeshBasicMaterial({
      map: innerTex,
      side: THREE.FrontSide,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.position.y = 3.1;
    scene.add(innerMesh);
    this.disposables.push(innerTex, innerGeo, innerMat);

    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 1024;
    floorCanvas.height = 1024;
    const fctx = floorCanvas.getContext('2d');
    if (fctx) {
      const grad = fctx.createRadialGradient(
        512,
        512,
        (512 * INNER_RADIUS) / OUTER_RADIUS,
        512,
        512,
        512,
      );
      grad.addColorStop(0, '#EDD6B0');
      grad.addColorStop(0.55, '#F3E1C3');
      grad.addColorStop(1, '#EFDAB8');
      fctx.fillStyle = grad;
      fctx.fillRect(0, 0, 1024, 1024);
    }
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.colorSpace = THREE.SRGBColorSpace;
    const floorGeo = new THREE.CircleGeometry(OUTER_RADIUS, 160);
    const floorMat = new THREE.MeshBasicMaterial({map: floorTex});
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    scene.add(floorMesh);
    this.disposables.push(floorTex, floorGeo, floorMat);

    const ceilGeo = new THREE.CircleGeometry(OUTER_RADIUS, 160);
    const ceilMat = new THREE.MeshBasicMaterial({
      color: '#FAF1E0',
      side: THREE.BackSide,
    });
    const ceilMesh = new THREE.Mesh(ceilGeo, ceilMat);
    ceilMesh.rotation.x = -Math.PI / 2;
    ceilMesh.position.y = WALL_HEIGHT;
    scene.add(ceilMesh);
    this.disposables.push(ceilGeo, ceilMat);
  }

  private createBackdropTextures(): {
    haloTex: THREE.CanvasTexture;
    shadowTex: THREE.CanvasTexture;
  } {
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 256;
    haloCanvas.height = 256;
    const hctx = haloCanvas.getContext('2d');
    if (hctx) {
      const grad = hctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, 'rgba(255,255,255,0.95)');
      grad.addColorStop(0.35, 'rgba(255,255,255,0.95)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      hctx.fillStyle = grad;
      hctx.fillRect(0, 0, 256, 256);
    }
    const haloTex = new THREE.CanvasTexture(haloCanvas);
    haloTex.colorSpace = THREE.SRGBColorSpace;

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext('2d');
    if (sctx) {
      const grad = sctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, 'rgba(120,90,50,0.28)');
      grad.addColorStop(0.25, 'rgba(120,90,50,0.28)');
      grad.addColorStop(1, 'rgba(120,90,50,0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;

    this.disposables.push(haloTex, shadowTex);
    return {haloTex, shadowTex};
  }

  private createLabels(maxAniso: number): void {
    this.labelTextures = PRINTS.map((p) => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 260;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      this.disposables.push(tex);
      return {canvas, tex, index: p.index};
    });
  }

  private redrawAllLabels(): void {
    for (const item of this.labelTextures) {
      const p = PRINTS[item.index];
      const ctx = item.canvas.getContext('2d');
      if (!ctx || !p) continue;
      ctx.clearRect(0, 0, 640, 260);
      ctx.fillStyle = '#3A3550';
      ctx.font = '500 52px "Newsreader", Georgia, serif';
      ctx.fillText(p.artist, 30, 82, 580);

      ctx.font = 'italic 400 50px "Newsreader", Georgia, serif';
      ctx.fillText(p.title, 30, 150, 580);

      ctx.fillStyle = 'rgba(58, 53, 80, 0.7)';
      ctx.font = '400 30px "DM Mono", ui-monospace, monospace';
      ctx.fillText(`${p.year} · ARHIV`, 30, 215, 580);

      item.tex.needsUpdate = true;
    }
  }

  private buildPrintGroups(
    scene: THREE.Scene,
    printTextures: THREE.Texture[],
    haloTex: THREE.CanvasTexture,
    shadowTex: THREE.CanvasTexture,
  ): void {
    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTex,
      transparent: true,
      depthWrite: false,
      fog: true,
    });

    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      fog: true,
    });

    const frameMat = new THREE.MeshBasicMaterial({color: '#D3AA72'});
    const labelGeo = new THREE.PlaneGeometry(0.92, (0.92 * 260) / 640);

    this.disposables.push(haloMat, shadowMat, frameMat, labelGeo);

    const assetsByPrint = PRINTS.map((p, idx) => {
      const {pw, ph} = computeFrameDimensions(p);
      const haloGeo = new THREE.PlaneGeometry(2.1 * pw, 1.75 * ph);
      const shadowGeo = new THREE.PlaneGeometry(1.25 * pw, 1.18 * ph);
      const frameGeo = new THREE.BoxGeometry(pw + 0.07, ph + 0.07, 0.06);
      const printGeo = new THREE.PlaneGeometry(pw, ph);
      const printMat = new THREE.MeshBasicMaterial({map: printTextures[idx]});
      const labelMat = new THREE.MeshBasicMaterial({
        map: this.labelTextures[idx].tex,
        transparent: true,
        depthWrite: false,
      });

      this.disposables.push(
        haloGeo,
        shadowGeo,
        frameGeo,
        printGeo,
        printMat,
        labelMat,
      );

      return {
        pw,
        ph,
        haloGeo,
        shadowGeo,
        frameGeo,
        printGeo,
        printMat,
        labelMat,
      };
    });

    const createGroup = (
      printIndex: number,
      angle: number,
      wall: 'outer' | 'inner',
    ) => {
      const a = assetsByPrint[printIndex];
      const group = new THREE.Group();
      const radius = wall === 'outer' ? 17.98 : 12.22;
      const cx = radius * Math.cos(angle);
      const cz = radius * Math.sin(angle);
      group.position.set(cx, 0, cz);
      if (wall === 'outer') {
        group.lookAt(0, 0, 0);
      } else {
        group.lookAt(cx * 2, 0, cz * 2);
      }

      const halo = new THREE.Mesh(a.haloGeo, haloMat);
      halo.position.set(0, PY + 0.05, 0.005);
      group.add(halo);

      const shadow = new THREE.Mesh(a.shadowGeo, shadowMat);
      shadow.position.set(0.05, PY - 0.06, 0.01);
      group.add(shadow);

      const frame = new THREE.Mesh(a.frameGeo, frameMat);
      frame.position.set(0, PY, 0.045);
      group.add(frame);

      const printMesh = new THREE.Mesh(a.printGeo, a.printMat);
      printMesh.position.set(0, PY, 0.077);
      group.add(printMesh);

      const label = new THREE.Mesh(labelGeo, a.labelMat);
      label.position.set(-a.pw / 2 + 0.46, PY - a.ph / 2 - 0.42, 0.02);
      group.add(label);

      const entry: PrintGroupEntry = {
        printIndex,
        angle,
        wall,
        pw: a.pw,
        ph: a.ph,
        mesh: printMesh,
      };
      printMesh.userData['entry'] = entry;
      this.printEntries.push(entry);
      this.printMeshes.push(printMesh);

      scene.add(group);
    };

    const count = PRINTS.length;
    for (let s = 0; s < OUTER_COUNT; s++) {
      const angle = (s * 2 * Math.PI) / OUTER_COUNT;
      createGroup(s % count, angle, 'outer');
    }

    for (let k = 0; k < INNER_COUNT; k++) {
      const angle = ((k + 0.5) * 2 * Math.PI) / INNER_COUNT;
      createGroup((k + 4) % count, angle, 'inner');
    }
  }

  private applyCameraPose(): void {
    const cam = this.camera;
    if (!cam) return;
    const {th, r, yaw, y, pitch} = this.pose;
    const cosTh = Math.cos(th);
    const sinTh = Math.sin(th);

    this._pos.set(r * cosTh, y, r * sinTh);
    cam.position.copy(this._pos);

    const tx = sinTh;
    const tz = -cosTh;
    const nx = cosTh;
    const nz = sinTh;

    const dx = Math.cos(yaw) * tx + Math.sin(yaw) * nx;
    const dz = Math.cos(yaw) * tz + Math.sin(yaw) * nz;

    this._look.set(this._pos.x + dx, this._pos.y + pitch, this._pos.z + dz);
    cam.lookAt(this._look);
  }

  private shortestAngleNear(angle: number, ref: number): number {
    let a = angle;
    while (a - ref > Math.PI) a -= 2 * Math.PI;
    while (a - ref < -Math.PI) a += 2 * Math.PI;
    return a;
  }

  private startFocusGlide(entry: PrintGroupEntry): void {
    const targetAngle = this.shortestAngleNear(entry.angle, this.pose.th);
    const to = this.focusPose(entry, targetAngle);
    this.focusedEntry = entry;
    this.focusChanged.emit(true);
    this.printFocused.emit(entry.printIndex);

    if (this.reducedMotion()) {
      this.pose = {...to};
      this.targetTh = to.th;
      this.glide = null;
      this.applyCameraPose();
      this.updateFocusedPill();
      return;
    }

    this.glide = {
      startMs: performance.now(),
      durationMs: 950,
      from: {...this.pose},
      to,
      mode: 'focus',
    };
  }

  stepBack(): void {
    if (!this.focusedEntry) return;
    const d = this.walkOffset();
    const walkTargetTh = this.pose.th + d;
    const to = this.walkPose(walkTargetTh);
    this.focusedEntry = null;
    this.hoveringFocused = false;
    this.pillVisible.set(false);
    this.focusChanged.emit(false);
    this.targetTh = walkTargetTh;

    if (this.reducedMotion()) {
      this.pose = {...to};
      this.glide = null;
      this.applyCameraPose();
      return;
    }

    this.glide = {
      startMs: performance.now(),
      durationMs: 950,
      from: {...this.pose},
      to,
      mode: 'walk',
    };
  }

  step(direction: number): void {
    if (this.activeOverlay()) return;
    if (this.focusedEntry) {
      this.stepBack();
      return;
    }
    if (this.glide?.mode === 'intro') {
      this.glide = null;
    }
    const d = this.walkOffset();
    this.targetTh = (Math.round((this.targetTh - d) / STEP) - direction) * STEP + d;
  }

  focusOuterPrint(printIndex: number): void {
    const outerMatches = this.printEntries.filter(
      (e) => e.wall === 'outer' && e.printIndex === printIndex,
    );
    if (outerMatches.length === 0) return;

    let best = outerMatches[0];
    let bestDiff = Infinity;
    for (const candidate of outerMatches) {
      const adj = this.shortestAngleNear(candidate.angle, this.pose.th);
      const diff = Math.abs(adj - this.pose.th);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = candidate;
      }
    }
    this.startFocusGlide(best);
  }

  private projectMeshRect(entry: PrintGroupEntry): ProjectedRect {
    const cam = this.camera;
    const mesh = entry.mesh;
    if (!cam) return {left: 0, top: 0, width: 0, height: 0};
    mesh.updateMatrixWorld(true);
    cam.updateMatrixWorld(true);
    const w = window.innerWidth;
    const h = window.innerHeight;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const hw = entry.pw / 2;
    const hh = entry.ph / 2;
    const corners: [number, number][] = [
      [-hw, -hh],
      [hw, -hh],
      [-hw, hh],
      [hw, hh],
    ];

    for (const [cx, cy] of corners) {
      this._corner.set(cx, cy, 0).applyMatrix4(mesh.matrixWorld).project(cam);
      const sx = ((this._corner.x + 1) / 2) * w;
      const sy = ((1 - this._corner.y) / 2) * h;
      if (sx < minX) minX = sx;
      if (sx > maxX) maxX = sx;
      if (sy < minY) minY = sy;
      if (sy > maxY) maxY = sy;
    }

    return {
      left: minX,
      top: minY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY),
    };
  }

  private updateFocusedPill(): void {
    if (this.activeOverlay() || !this.focusedEntry) {
      this.pillVisible.set(false);
      return;
    }

    if (this.isSmallScreen()) {
      const rect = this.projectMeshRect(this.focusedEntry);
      this.pillX.set(rect.left + rect.width / 2);
      this.pillY.set(rect.top + rect.height * 0.55);
      this.pillVisible.set(true);
    } else if (this.hoveringFocused) {
      this.pillX.set(this.hoverCursorX);
      this.pillY.set(this.hoverCursorY);
      this.pillVisible.set(true);
    } else {
      this.pillVisible.set(false);
    }
  }

  private handleResize(): void {
    if (!this.renderer || !this.camera) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.fov = w >= h ? 56 : 70;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
    this.updateFocusedPill();
  }

  private handleWheel(e: WheelEvent): void {
    if (this.activeOverlay()) return;
    e.preventDefault();
    if (this.focusedEntry) {
      this.stepBack();
      return;
    }
    if (this.glide?.mode === 'intro') {
      this.glide = null;
    }
    const mult = e.deltaMode === 1 ? 33 : 1;
    const dy = e.deltaY * mult;
    this.targetTh += -dy * 0.0016;
  }

  private handlePointerDown(e: PointerEvent): void {
    if (this.activeOverlay()) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    this.pointerDown = true;
    this.pointerMoved = false;
    this.pointerId = e.pointerId;
    this.downX = e.clientX;
    this.downY = e.clientY;
    this.dragStartTh = this.targetTh;
    this.hostRef()?.nativeElement.setPointerCapture?.(e.pointerId);
  }

  private handlePointerMove(e: PointerEvent): void {
    if (this.activeOverlay()) {
      this.isHoveringPrint.set(false);
      this.pillVisible.set(false);
      return;
    }

    this.hoverCursorX = e.clientX;
    this.hoverCursorY = e.clientY;

    if (this.pointerDown && e.pointerId === this.pointerId) {
      const dx = e.clientX - this.downX;
      const dy = e.clientY - this.downY;
      if (!this.pointerMoved && Math.hypot(dx, dy) > 6) {
        this.pointerMoved = true;
        this.isDragging.set(true);
        if (this.focusedEntry) {
          this.stepBack();
          this.dragStartTh = this.targetTh;
        }
        if (this.glide?.mode === 'intro') {
          this.glide = null;
        }
      }
      if (this.pointerMoved) {
        const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
        const sens = this.isSmallScreen() ? 0.0042 : 0.0022;
        this.targetTh = this.dragStartTh + delta * sens;
        return;
      }
    }

    if (this.camera && e.pointerType === 'mouse') {
      this.pointerNdc.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointerNdc.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.pointerNdc, this.camera);
      const hits = this.raycaster.intersectObjects(this.printMeshes, false);
      const hitMesh = hits.length > 0 ? (hits[0].object as THREE.Mesh) : null;
      this.isHoveringPrint.set(hitMesh !== null);
      this.hoveringFocused =
        hitMesh !== null &&
        this.focusedEntry !== null &&
        hitMesh === this.focusedEntry.mesh;
      this.updateFocusedPill();
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    if (!this.pointerDown || e.pointerId !== this.pointerId) return;
    this.pointerDown = false;
    this.isDragging.set(false);
    this.hostRef()?.nativeElement.releasePointerCapture?.(e.pointerId);

    if (this.pointerMoved || this.activeOverlay()) {
      this.pointerMoved = false;
      return;
    }

    if (!this.camera) return;
    this.pointerNdc.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointerNdc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.printMeshes, false);

    if (hits.length > 0) {
      const hitMesh = hits[0].object as THREE.Mesh;
      const entry = hitMesh.userData['entry'] as PrintGroupEntry | undefined;
      if (!entry) return;

      if (this.focusedEntry && entry === this.focusedEntry) {
        const rect = this.projectMeshRect(entry);
        this.openPrint.emit({printIndex: entry.printIndex, rect});
      } else {
        this.startFocusGlide(entry);
      }
    } else if (this.focusedEntry) {
      this.stepBack();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.activeOverlay()) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key === 'Escape' && this.focusedEntry) {
      this.stepBack();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.step(1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.step(-1);
    }
  }

  private startLoop(): void {
    const tick = (nowMs: number) => {
      if (this.destroyed) return;
      this.rafId = requestAnimationFrame(tick);

      const dt = Math.min(0.1, Math.max(0.0001, (nowMs - this.lastTimeMs) / 1000));
      this.lastTimeMs = nowMs;

      if (this.glide) {
        const elapsed = nowMs - this.glide.startMs;
        const t = Math.min(1, elapsed / this.glide.durationMs);

        if (this.glide.mode === 'intro') {
          const e = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
          this.pose.th = this.lerp(this.glide.from.th, this.glide.to.th, e);
          this.pose.r = this.lerp(this.glide.from.r, this.glide.to.r, e);
          this.pose.yaw = this.lerp(this.glide.from.yaw, this.glide.to.yaw, e);
          this.pose.y = this.lerp(this.glide.from.y, this.glide.to.y, e);
          this.pose.pitch = this.lerp(this.glide.from.pitch, this.glide.to.pitch, e);
        } else {
          const eTh = 1 - Math.pow(1 - t, 4);
          const eYaw = 1 - Math.pow(1 - t, 2);
          const eRest = 1 - Math.pow(1 - t, 3);

          this.pose.th = this.lerp(this.glide.from.th, this.glide.to.th, eTh);
          this.pose.yaw = this.lerpAngle(this.glide.from.yaw, this.glide.to.yaw, eYaw);
          this.pose.r = this.lerp(this.glide.from.r, this.glide.to.r, eRest);
          this.pose.y = this.lerp(this.glide.from.y, this.glide.to.y, eRest);
          this.pose.pitch = this.lerp(this.glide.from.pitch, this.glide.to.pitch, eRest);
        }

        if (t >= 1) {
          this.pose = {...this.glide.to};
          if (this.glide.mode === 'walk' || this.glide.mode === 'intro') {
            this.targetTh = this.pose.th;
          }
          this.glide = null;
        }
      } else if (!this.focusedEntry) {
        if (this.reducedMotion()) {
          this.pose.th = this.targetTh;
        } else {
          const alpha = 1 - Math.exp(-dt / 0.36);
          this.pose.th += (this.targetTh - this.pose.th) * alpha;
        }
        const wp = this.walkPose(this.pose.th);
        this.pose.r = wp.r;
        this.pose.yaw = wp.yaw;
        this.pose.y = wp.y;
        this.pose.pitch = wp.pitch;
      }

      this.applyCameraPose();
      if (this.focusedEntry) {
        this.updateFocusedPill();
      }
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return a + diff * t;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (!this.isBrowser) return;

    cancelAnimationFrame(this.rafId);
    if (this.failsafeTimer) {
      clearTimeout(this.failsafeTimer);
    }

    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
    window.removeEventListener('pointercancel', this.onPointerUpBound);
    window.removeEventListener('keydown', this.onKeyDownBound);

    const host = this.hostRef()?.nativeElement;
    if (host) {
      host.removeEventListener('wheel', this.onWheelBound);
      host.removeEventListener('pointerdown', this.onPointerDownBound);
    }

    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
      this.renderer = null;
    }
  }
}

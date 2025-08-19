import {
   Component,
   OnInit,
   OnDestroy,
   ViewChild,
   ElementRef,
   AfterViewInit,
   CUSTOM_ELEMENTS_SCHEMA,
   Renderer2,
   Inject
 } from '@angular/core';
 import { CommonModule } from '@angular/common';
 import { Router, RouterModule } from '@angular/router';
 import { FormsModule } from '@angular/forms';
 import { Store } from '@ngrx/store';
 import { Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
 import { takeUntil, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
 import { AppState } from '../../store';
 import { Station } from '../../core/models/station.model';
 import * as StationActions from '../../store/actions/station.actions';
 import { EnhancedStationCardComponent } from '../../shared/components/enhanced-station-card/enhanced-station-card.component';
 import { LoaderComponent } from '../../shared/components/loader/loader.component';
 import { GeoService } from '../../core/services/geo.service';
 import gsap from 'gsap';
 import { ScrollTrigger } from 'gsap/ScrollTrigger';
 import { create } from '@lottiefiles/lottie-interactivity';
 
 const DEFAULT_LOCATION = {
   LATITUDE: 6.5244,
   LONGITUDE: 3.3792,
   RADIUS_KM: 15
 } as const;
 
 const STATIONS_DISPLAY_LIMIT = 6;
 
 const ANIMATION_CONFIG = {
   HERO_VIDEO_DELAY: 0.7,
   SCROLL_SCRUB: 0.3,
   SNAP_DURATION: 0.2,
   INTERSECTION_THRESHOLD: 0.5,
   DEBUG_MARKERS: false,
   THROTTLE_LOGGING: 200
 } as const;
 
 const ENABLE_HOW_IT_WORKS_ANIMATION = true;
 const DISABLE_SCROLL_FIXES = false;
 
 @Component({
   selector: 'app-home',
   standalone: true,
   imports: [
     CommonModule,
     RouterModule,
     FormsModule,
     EnhancedStationCardComponent,
     LoaderComponent
   ],
   schemas: [CUSTOM_ELEMENTS_SCHEMA],
   templateUrl: './home.component.html',
   styleUrls: ['./home.component.scss'] // <-- fixed
 })
 export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
   @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;
   @ViewChild('lottieContainerLocate') lottieContainerLocate!: ElementRef<HTMLDivElement>;
   @ViewChild('lottieContainerReport') lottieContainerReport!: ElementRef<HTMLDivElement>;
   @ViewChild('lottieContainerShare') lottieContainerShare!: ElementRef<HTMLDivElement>;
 
   stations$: Observable<Station[]>;
   loading$: Observable<boolean>;
   error$: Observable<any>;
 
   searchQuery$ = new BehaviorSubject<string>('');
   filteredStations$: Observable<Station[]>;
   searchQuery = '';
 
   private destroy$ = new Subject<void>();
 
   // Video-related
   private videoElement?: HTMLVideoElement;
   private canPlayThroughListener?: () => void;
   private videoReadyPromise!: Promise<void>;
   private resolveVideoReady?: () => void;
   private videoReadyTimeoutId?: number;
 
   // Lottie
   private lottieChainInteractionObserver?: IntersectionObserver;
   private lottieChainInitialized = false;
 
   // GSAP / ScrollTrigger housekeeping
   private animationRAF?: number;
   private resizeRefreshTimeoutId?: number;
   private pendingTimeouts: number[] = [];
   private flagOverlayEl?: HTMLElement;
   private flagTransitionInitialized = false;
 
   // For throttled logs
   private lastScrollTriggerLog = 0;
 
   constructor(
     private store: Store<AppState>,
     private router: Router,
     private geoService: GeoService,
     private renderer: Renderer2,
     private hostRef: ElementRef
   ) {
     // Observables initialization
     this.stations$ = this.store.select(state => state.stations.stations.slice(0, STATIONS_DISPLAY_LIMIT));
     this.loading$ = this.store.select(state => state.stations.loading);
     this.error$ = this.store.select(state => state.stations.error);
 
     this.filteredStations$ = combineLatest([
       this.stations$,
       this.searchQuery$.pipe(debounceTime(300), distinctUntilChanged())
     ]).pipe(
       map(([stations, query]) => {
         if (!query?.trim()) return stations;
         const searchTerm = query.toLowerCase().trim();
         return stations.filter(station =>
           station.name?.toLowerCase().includes(searchTerm) ||
           station.address?.toLowerCase().includes(searchTerm) ||
           station.brand?.toLowerCase().includes(searchTerm)
         );
       })
     );
   }
 
   ngOnInit(): void {
     if (!DISABLE_SCROLL_FIXES) {
       this.ensurePageStartsAtTop();
     }
 
     // Setup video ready promise early so timeouts/listeners have access
     this.videoReadyPromise = new Promise<void>((resolve) => {
       this.resolveVideoReady = () => {
         // Clear fallback timeout (if present)
         if (this.videoReadyTimeoutId !== undefined) {
           window.clearTimeout(this.videoReadyTimeoutId);
           this.videoReadyTimeoutId = undefined;
         }
         resolve();
       };
     });
 
     gsap.registerPlugin(ScrollTrigger);
 
     this.loadNearbyStations();
     this.setupScrollTriggerResizeRefresh();
 
     // light warning if many triggers exist; keep as diagnostic only
     const existingTriggers = ScrollTrigger.getAll();
     if (existingTriggers?.length > 5) {
       console.warn('Multiple ScrollTriggers detected:', existingTriggers.length);
     }
   }
 
   private setupScrollTriggerResizeRefresh(): void {
     const handler = () => {
       if (this.resizeRefreshTimeoutId) {
         window.clearTimeout(this.resizeRefreshTimeoutId);
       }
       this.resizeRefreshTimeoutId = window.setTimeout(() => {
         try { ScrollTrigger.refresh(); } catch { /* best effort */ }
       }, 800);
     };
     window.addEventListener('resize', handler);
     // store handler so we can remove it on destroy
     (this as any)._resizeHandler = handler;
 
     // initial refresh at next tick
     const id = window.setTimeout(() => {
       try { ScrollTrigger.refresh(); } catch {}
     }, 0);
     this.pendingTimeouts.push(id);
   }
 
   async ngAfterViewInit(): Promise<void> {
     // Clean previous GSAP artifacts that may remain from HMR or prior navigations
     this.removeGsapPinArtifacts();
 
     const heroSection = document.querySelector('.hero-section');
     const howItWorksSection = document.querySelector('.how-it-works-pinned-viewport');
 
     if (!heroSection || !howItWorksSection) {
       console.error('Critical DOM elements missing (.hero-section or .how-it-works-pinned-viewport). Animation setup aborted.');
       return;
     }
 
     if (!DISABLE_SCROLL_FIXES) {
       window.scrollTo(0, 0);
     }
 
     try {
       this.initializeVideoPlayer();
       await this.videoReadyPromise;
 
       if (!DISABLE_SCROLL_FIXES) {
         this.ensurePageStartsAtTop();
       }
 
       // schedule animation setup in RAF chain (keeps things smooth)
       this.animationRAF = requestAnimationFrame(() => {
         this.animationRAF = requestAnimationFrame(() => {
           if (ENABLE_HOW_IT_WORKS_ANIMATION) {
             this.setupHowItWorksAnimation();
 
             // initialize lottie after scroll triggers are stable
             this.animationRAF = requestAnimationFrame(() => {
               this.initializeLottieChainOnVisible();
             });
           }
         });
       });
     } catch (err) {
       console.error('Error in ngAfterViewInit:', err);
       // ensure we still allow destroy cleanup
     }
   }
 
   private removeGsapPinArtifacts(): void {
     try {
       // Kill all ScrollTriggers (defensive)
       try { ScrollTrigger.killAll(); } catch { /* best effort */ }
 
       // Remove pin spacer wrappers left behind by GSAP pinning
       document.querySelectorAll('.pin-spacer').forEach((spacer) => {
         const parent = spacer.parentElement;
         if (!parent) return;
         const frag = document.createDocumentFragment();
         while (spacer.firstChild) frag.appendChild(spacer.firstChild);
         parent.replaceChild(frag, spacer);
       });
 
       // Clear inline transforms and other GSAP props on common selectors
       try {
         gsap.set(['body', 'html', '.how-it-works-pinned-viewport', '.how-it-works-track'], { clearProps: 'all' });
       } catch { /* ignore failures */ }
 
       // Reset scroll to top as a last effort
       window.scrollTo(0, 0);
     } catch (e) {
       // ignore - this is best effort
     }
   }
 
   private initializeVideoPlayer(): void {
     if (!this.heroVideo?.nativeElement) {
       console.warn('Hero video element not found - skipping video initialization');
       // resolve promise to avoid blocking animations
       if (this.resolveVideoReady) this.resolveVideoReady();
       return;
     }
 
     try {
       this.videoElement = this.heroVideo.nativeElement;
       this.videoElement.muted = true;
 
       // error handler resolves video promise so animations won't block
       const onError = (err: any) => {
         console.error('Video loading error:', err);
         if (this.resolveVideoReady) this.resolveVideoReady();
       };
       this.videoElement.addEventListener('error', onError, { once: true });
 
       this.canPlayThroughListener = () => {
         if (this.resolveVideoReady) this.resolveVideoReady();
         // try autoplay but quietly ignore failure
         const playPromise = this.videoElement!.play();
         if (playPromise && typeof playPromise.catch === 'function') {
           playPromise.catch((error) => {
             if (error?.name && error.name !== 'NotAllowedError') {
               console.warn('Video autoplay issue:', error.name);
             }
           });
         }
       };
 
       if (this.videoElement.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
         // video is already ready
         if (this.resolveVideoReady) this.resolveVideoReady();
         this.videoElement.play().catch(() => {});
       } else {
         // wait for canplaythrough or fallback after 3s
         this.videoElement.addEventListener('canplaythrough', this.canPlayThroughListener, { once: true });
 
         this.videoReadyTimeoutId = window.setTimeout(() => {
           console.warn('Video ready timeout reached, proceeding with animations');
           if (this.resolveVideoReady) this.resolveVideoReady();
           this.videoReadyTimeoutId = undefined;
         }, 3000);
 
         // record timeout so we can cancel in ngOnDestroy if needed
         if (this.videoReadyTimeoutId !== undefined) this.pendingTimeouts.push(this.videoReadyTimeoutId);
       }
     } catch (error) {
       console.error('Error initializing video player:', error);
       if (this.resolveVideoReady) this.resolveVideoReady();
     }
   }
 
   ngOnDestroy(): void {
     this.destroy$.next();
     this.destroy$.complete();
 
     // Cancel RAF
     if (this.animationRAF !== undefined) {
       cancelAnimationFrame(this.animationRAF);
       this.animationRAF = undefined;
     }
 
     // Remove video listeners
     try {
       if (this.videoElement && this.canPlayThroughListener) {
         this.videoElement.removeEventListener('canplaythrough', this.canPlayThroughListener);
       }
     } catch {}
 
     // Clear any pending timeouts
     if (this.resizeRefreshTimeoutId !== undefined) {
       window.clearTimeout(this.resizeRefreshTimeoutId);
       this.resizeRefreshTimeoutId = undefined;
     }
     this.pendingTimeouts.forEach(id => window.clearTimeout(id));
     this.pendingTimeouts = [];
 
     // Kill all ScrollTriggers
     try {
       const triggers = ScrollTrigger.getAll();
       triggers.forEach(st => {
         try { st.kill(); } catch {}
       });
     } catch { /* ignore */ }
 
     // Disconnect IntersectionObserver
     try { this.lottieChainInteractionObserver?.disconnect(); } catch {}
 
   }
 
   public loadNearbyStations(): void {
     this.geoService.getCurrentPosition()
       .pipe(takeUntil(this.destroy$))
       .subscribe({
         next: (position) => {
           this.store.dispatch(StationActions.loadStations({
             latitude: position.coords.latitude,
             longitude: position.coords.longitude,
             radiusKm: DEFAULT_LOCATION.RADIUS_KM
           }));
         },
         error: () => {
           this.store.dispatch(StationActions.loadStations({
             latitude: DEFAULT_LOCATION.LATITUDE,
             longitude: DEFAULT_LOCATION.LONGITUDE,
             radiusKm: DEFAULT_LOCATION.RADIUS_KM
           }));
         }
       });
   }
 
   private setupHowItWorksAnimation(): void {
     try {
       const animationStage = document.querySelector('.animation-stage') as HTMLElement | null;
       const track = document.querySelector('.how-it-works-track') as HTMLElement | null;
       const panels = gsap.utils.toArray(".how-it-works-panel") as HTMLElement[];
       const flagPanels = gsap.utils.toArray('.flag-background .flag-stripe-green, .flag-background .flag-stripe-white') as HTMLElement[];

      if (!animationStage || !track || panels.length === 0 || flagPanels.length === 0) {
        console.warn('Animation elements not found - skipping how-it-works animation');
        return;
      }

      const masterTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: animationStage,
          start: 'top top',
          end: () => `+=${(track.scrollWidth - document.documentElement.clientWidth) + window.innerHeight}`,
          scrub: true,
          pin: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          markers: ANIMATION_CONFIG.DEBUG_MARKERS,
        },
        defaults: { ease: 'none' },
      });

      masterTimeline
        .fromTo(flagPanels, { scaleY: 0 }, { scaleY: 1, stagger: 0.3, duration: 2 })
        .to(panels, { opacity: 1, duration: 0.5 }, "-=0.5")
        .to(track, {
          x: () => `-${track.scrollWidth - document.documentElement.clientWidth}px`,
          duration: panels.length, 
        }, "+=0.3");

    } catch (error) {
      console.error('Animation setup error:', error);
    }
  }

  private setupHeroToHowItWorksFlagTransition(): void {
    // This function is now empty as its logic has been merged into setupHowItWorksAnimation.
    // We'll keep the function to avoid breaking any calls to it, but it will do nothing.
    this.flagTransitionInitialized = true;
  }

  private initializeLottieChainOnVisible(): void {
    try {
      if (!this.lottieContainerLocate?.nativeElement?.id) {
        console.warn('Lottie container not properly configured - skipping');
        return;
      }
 
      const lottieContainerEl = this.lottieContainerLocate.nativeElement;
 
      this.lottieChainInteractionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.lottieChainInitialized) {
            try {
              if (typeof create !== 'undefined') {
                create({
                  player: `#${lottieContainerEl.id}`,
                  mode: 'chain',
                  actions: [
                    { state: 'autoplay', transition: 'onComplete' },
                    { path: '/how-it-works/locate_idle.json', state: 'loop', transition: 'none' }
                  ]
                } as any);
                this.lottieChainInitialized = true;
                observer.unobserve(entry.target);
              }
            } catch (error) {
              console.error('Lottie initialization error', error);
            }
          }
        });
      }, { threshold: ANIMATION_CONFIG.INTERSECTION_THRESHOLD });
 
      this.lottieChainInteractionObserver.observe(lottieContainerEl);
    } catch (error) {
      console.error('Lottie setup error', error);
    }
  }
 
   // Search handlers (unchanged)
   onSearchInput(event: Event): void {
     const target = event.target as HTMLInputElement;
     const q = target?.value || '';
     this.searchQuery = q;
     this.searchQuery$.next(q);
   }
 
   clearSearch(): void {
     this.searchQuery = '';
     this.searchQuery$.next('');
   }
 
   exploreStations(): void {
     this.router.navigate(['/stations']);
   }
 
   onStationSelected(station: Station): void {
     this.store.dispatch(StationActions.selectStation({ stationId: station.id }));
     this.router.navigate(['/stations', station.id]);
   }
 
   playVideo(event: Event): void {
     const video = event.target as HTMLVideoElement;
     if (video && typeof video.play === 'function') {
       video.play().catch(() => {});
     }
   }
 
   pauseVideo(event: Event): void {
     const video = event.target as HTMLVideoElement;
     if (video && typeof video.pause === 'function') {
       video.pause();
     }
   }
 
   trackByStation(index: number, station: Station): string {
     return station.id;
   }
 
   scrollToHero(): void {
     const heroSection = document.querySelector('.hero-section');
     if (heroSection) {
       heroSection.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
     } else {
       window.scrollTo({ top: 0, behavior: 'smooth' });
     }
   }
 
   forceScrollToTop(): void {
     const triggers = ScrollTrigger.getAll();
     triggers.forEach((trigger: any) => trigger.disable());
     ScrollTrigger.refresh();
     window.scrollTo({ top: 0, behavior: 'smooth' });
     const id = window.setTimeout(() => triggers.forEach((trigger: any) => trigger.enable()), 1000);
     this.pendingTimeouts.push(id);
   }
 
   private ensurePageStartsAtTop(): void {
     window.scrollTo(0, 0);
     document.documentElement.scrollTop = 0;
     document.body.scrollTop = 0;
     if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
 
     const id1 = window.setTimeout(() => { if (window.scrollY !== 0) window.scrollTo({ top: 0, behavior: 'auto' }); }, 0);
     this.pendingTimeouts.push(id1);
 
     const id2 = window.setTimeout(() => {
       if (window.scrollY !== 0) {
         window.scrollTo({ top: 0, behavior: 'auto' });
         console.warn('Had to force scroll reset after delay - this may indicate a timing issue');
       }
     }, 50);
     this.pendingTimeouts.push(id2);
   }
 
   public emergencyScrollReset(): void {
     console.log('🚨 Emergency scroll reset triggered');
     const triggers = ScrollTrigger.getAll();
     triggers.forEach((trigger: any) => trigger.kill());
     window.scrollTo(0, 0);
     document.documentElement.scrollTop = 0;
     document.body.scrollTop = 0;
     try { gsap.set('.how-it-works-track', { clearProps: 'all' }); } catch {}
     const id = window.setTimeout(() => this.setupHowItWorksAnimation(), 200);
     this.pendingTimeouts.push(id);
   }
 }
 
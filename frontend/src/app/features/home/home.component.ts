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
  SCROLL_SCRUB: 0.2, // Reduced for smoother performance
  SNAP_DURATION: 0.15, // Faster snapping
   INTERSECTION_THRESHOLD: 0.5,
   DEBUG_MARKERS: false,
  THROTTLE_LOGGING: 200,
  // New performance settings
  RAF_THROTTLE: 16, // Throttle to ~60fps
  RESIZE_DEBOUNCE: 150 // Debounce resize events
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

  // Video optimization properties
  videoLoaded = false;
  readonly videoPosterUrl = 'https://res.cloudinary.com/dhc3kh8qk/video/upload/so_2,f_auto,q_auto:good,w_1920,h_1080/v1755377934/landing_page_cqmjrz.jpg';
  readonly videoUrlLowQuality = 'https://res.cloudinary.com/dhc3kh8qk/video/upload/q_auto:low,f_auto,br_500k,w_1280,h_720/v1755377934/landing_page_cqmjrz.mp4';
  readonly videoUrlMediumQuality = 'https://res.cloudinary.com/dhc3kh8qk/video/upload/q_auto:good,f_auto,br_1200k,w_1920,h_1080/v1755377934/landing_page_cqmjrz.mp4';
  readonly videoUrlHighQuality = 'https://res.cloudinary.com/dhc3kh8qk/video/upload/q_auto:good,f_auto,br_2000k/v1755377934/landing_page_cqmjrz.mp4';

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
    this.preloadHeroVideo();
 
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
        try { 
          // Use requestAnimationFrame for smooth refresh
          requestAnimationFrame(() => {
            ScrollTrigger.refresh(); 
          });
        } catch { /* best effort */ }
      }, ANIMATION_CONFIG.RESIZE_DEBOUNCE);
    };
    
    // Use passive listener for better performance
    window.addEventListener('resize', handler, { passive: true });
     // store handler so we can remove it on destroy
     (this as any)._resizeHandler = handler;
 
    // initial refresh at next tick with RAF
     const id = window.setTimeout(() => {
      try { 
        requestAnimationFrame(() => {
          ScrollTrigger.refresh(); 
        });
      } catch {}
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

     // Ensure how-it-works scroll indicator starts hidden
     const howItWorksScrollIndicator = document.querySelector('.scroll-how-it-works') as HTMLElement | null;
     if (howItWorksScrollIndicator) {
       howItWorksScrollIndicator.classList.remove('visible');
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
          // Only show warning if video hasn't loaded at all
          if (this.videoElement && this.videoElement.readyState === HTMLMediaElement.HAVE_NOTHING) {
            console.warn('Video loading timeout - proceeding with animations without video');
          }
           if (this.resolveVideoReady) this.resolveVideoReady();
           this.videoReadyTimeoutId = undefined;
        }, 2000); // Reduced timeout to 2 seconds
 
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

     // Clean up hero content interactivity state
     try {
       const heroContentWrapper = document.querySelector('.hero-content-wrapper') as HTMLElement | null;
       if (heroContentWrapper) {
         heroContentWrapper.classList.remove('non-interactive');
       }
       
       // Clean up scroll indicator state
       const howItWorksScrollIndicator = document.querySelector('.scroll-how-it-works') as HTMLElement | null;
       if (howItWorksScrollIndicator) {
         howItWorksScrollIndicator.classList.remove('visible');
       }
     } catch {}

    // Clean up resize listener
    try {
      const resizeHandler = (this as any)._resizeHandler;
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        (this as any)._resizeHandler = null;
      }
    } catch {}

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
      const heroContentWrapper = document.querySelector('.hero-content-wrapper') as HTMLElement | null;
      const howItWorksScrollIndicator = document.querySelector('.scroll-how-it-works') as HTMLElement | null;

     if (!animationStage || !track || panels.length === 0 || flagPanels.length === 0 || !heroContentWrapper) {
       console.warn('Animation elements not found - skipping how-it-works animation');
       return;
     }

     // Ensure scroll indicator starts hidden
     if (howItWorksScrollIndicator) {
       howItWorksScrollIndicator.classList.remove('visible');
     }

     // Cache expensive calculations to avoid forced reflows during animation
     const viewportWidth = document.documentElement.clientWidth;
     const trackScrollWidth = track.scrollWidth;
     const trackTranslateDistance = trackScrollWidth - viewportWidth;
     const animationEndDistance = trackTranslateDistance + window.innerHeight;

     // Pre-configure elements for optimal performance
     gsap.set(track, { 
       willChange: 'transform',
       backfaceVisibility: 'hidden',
       perspective: 1000
     });
     
     gsap.set(flagPanels, { 
       willChange: 'transform',
       transformOrigin: 'bottom center'
     });

     gsap.set(panels, { 
       willChange: 'opacity',
       opacity: 0
     });

           const masterTimeline = gsap.timeline({
       scrollTrigger: {
         trigger: animationStage,
         start: 'top top',
        end: `+=${animationEndDistance}`,
        scrub: ANIMATION_CONFIG.SCROLL_SCRUB,
         pin: true,
         invalidateOnRefresh: true,
         anticipatePin: 1,
         markers: ANIMATION_CONFIG.DEBUG_MARKERS,
        // Optimize refresh behavior
        refreshPriority: -1,
        // Reduce calculation frequency
        fastScrollEnd: true,
        // Add callback to manage hero content interactivity and scroll indicator visibility
        onUpdate: (self) => {
          // When flag panels start appearing (progress > 0.1), disable hero interactions
          if (self.progress > 0.1) {
            if (!heroContentWrapper.classList.contains('non-interactive')) {
              heroContentWrapper.classList.add('non-interactive');
            }
          } else {
            // Re-enable hero interactions when flag panels are not visible
            if (heroContentWrapper.classList.contains('non-interactive')) {
              heroContentWrapper.classList.remove('non-interactive');
            }
          }

          // Show how-it-works scroll indicator when flag animation starts (progress > 0.1)
          if (howItWorksScrollIndicator) {
            if (self.progress > 0.1) {
              if (!howItWorksScrollIndicator.classList.contains('visible')) {
                howItWorksScrollIndicator.classList.add('visible');
              }
            } else {
              if (howItWorksScrollIndicator.classList.contains('visible')) {
                howItWorksScrollIndicator.classList.remove('visible');
              }
            }
          }
        }
      },
      defaults: { 
        ease: 'none',
        force3D: true // Force hardware acceleration
      },
    });

     // Use cached values in animations to prevent recalculation
      masterTimeline
       .fromTo(flagPanels, 
         { scaleY: 0 }, 
         { 
           scaleY: 1, 
           stagger: 0.5, // Reduced stagger for smoother performance
           duration: 1.5, // Reduced duration
           force3D: true
         }
       )
       .to(panels, { 
         opacity: 1, 
         duration: 0.3, // Reduced duration for faster opacity change
         force3D: true
       }, "-=0.3")
        .to(track, {
         x: -trackTranslateDistance, // Use cached value
         duration: panels.length * 0.8, // Slightly faster scrolling
         force3D: true,
         ease: 'none'
       }, "+=0.2");

     // Clean up will-change after animation completes
     masterTimeline.eventCallback("onComplete", () => {
       gsap.set([track, flagPanels, panels], { clearProps: "willChange" });
       // Re-enable hero interactions when animation completes
       heroContentWrapper.classList.remove('non-interactive');
       // Ensure scroll indicator remains visible at the end
       if (howItWorksScrollIndicator) {
         howItWorksScrollIndicator.classList.add('visible');
       }
     });

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

  onVideoLoaded(): void {
    this.videoLoaded = true;
    console.log('Hero video loaded successfully');
    
    // Start intelligent preloading of higher quality versions in the background
    this.preloadHigherQualityVideos();
  }

  private preloadHigherQualityVideos(): void {
    // Use requestIdleCallback for non-blocking preloading of higher quality videos
    const preloadWhenIdle = () => {
      try {
        // Create video elements to preload higher quality versions
        const mediumQualityVideo = document.createElement('video');
        mediumQualityVideo.preload = 'metadata';
        mediumQualityVideo.src = this.videoUrlMediumQuality;
        
        // Only preload high quality on good connections
        const connection = (navigator as any).connection;
        if (connection && (connection.effectiveType === '4g' || connection.downlink > 2)) {
          setTimeout(() => {
            const highQualityVideo = document.createElement('video');
            highQualityVideo.preload = 'metadata';
            highQualityVideo.src = this.videoUrlHighQuality;
          }, 2000); // Delay high quality preloading
        }
        
        console.log('Started background preloading of higher quality video versions');
      } catch (error) {
        console.warn('Background video preloading failed:', error);
      }
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadWhenIdle, { timeout: 5000 });
    } else {
      setTimeout(preloadWhenIdle, 1000);
    }
  }

  private preloadHeroVideo(): void {
    // Start preloading the low-quality video immediately for faster initial display
    try {
      const preloadVideo = document.createElement('video');
      preloadVideo.preload = 'metadata';
      preloadVideo.muted = true;
      
      // Network-aware loading: choose initial video quality based on connection
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection && connection.effectiveType) {
        switch (connection.effectiveType) {
          case 'slow-2g':
          case '2g':
            preloadVideo.src = this.videoUrlLowQuality;
            break;
          case '3g':
            preloadVideo.src = this.videoUrlMediumQuality;
            break;
          default:
            preloadVideo.src = this.videoUrlLowQuality; // Start with low quality for faster initial load
        }
      } else {
        preloadVideo.src = this.videoUrlLowQuality;
      }
      
      // Preload poster image with error handling and immediate usage
      const posterImg = new Image();
      posterImg.onload = () => {
        // Set poster immediately when loaded to avoid preload warning
        const heroVideo = this.heroVideo?.nativeElement;
        if (heroVideo && !heroVideo.poster) {
          heroVideo.poster = this.videoPosterUrl;
        }
      };
      posterImg.onerror = () => {
        console.warn('Failed to preload video poster image');
      };
      posterImg.src = this.videoPosterUrl;
      
      console.log('Started preloading hero video assets with network-aware quality selection');
    } catch (error) {
      console.warn('Video preloading failed:', error);
    }
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
 
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { create } from '@lottiefiles/lottie-interactivity';

// Constants
const DEFAULT_LOCATION = {
  LATITUDE: 6.5244, // Lagos, Nigeria
  LONGITUDE: 3.3792,
  RADIUS_KM: 15
} as const;

const STATIONS_DISPLAY_LIMIT = 6;

const ANIMATION_CONFIG = {
  HERO_VIDEO_DELAY: 0.7,
  SCROLL_SCRUB: 0.3, // Optimized for smoother performance
  SNAP_DURATION: 0.2, // Faster snapping
  INTERSECTION_THRESHOLD: 0.5,
  DEBUG_MARKERS: false,
  THROTTLE_LOGGING: 200 // Reduced logging frequency
} as const;

// Temporary flag to fully disable the "How it Works" animation setup
const ENABLE_HOW_IT_WORKS_ANIMATION = true;
const DISABLE_SCROLL_FIXES = false;

// Type interfaces for better type safety
interface GSAPTrigger {
  kill(): void;
  disable(): void;
  enable(): void;
}

interface LottieChainAction {
  state: string;
  transition: string;
  path?: string;
}

interface LottieInteractivityConfig {
  player: string;
  mode: string;
  actions: LottieChainAction[];
}

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
  styleUrl: './home.component.scss'
})

export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('lottieContainerLocate') lottieContainerLocate!: ElementRef<HTMLDivElement>;
  @ViewChild('lottieContainerReport') lottieContainerReport!: ElementRef<HTMLDivElement>;
  @ViewChild('lottieContainerShare') lottieContainerShare!: ElementRef<HTMLDivElement>;
  
  // Observable states for loading and error handling
  stations$: Observable<Station[]>;
  loading$: Observable<boolean>;
  error$: Observable<any>;
  
  // Search functionality
  searchQuery$ = new BehaviorSubject<string>('');
  filteredStations$: Observable<Station[]>;
  searchQuery = '';
  
  private destroy$ = new Subject<void>();
  private videoElement!: HTMLVideoElement;
  private canPlayThroughListener!: () => void;
  private videoReadyPromise!: Promise<void>;
  private resolveVideoReady!: () => void;
  
  // Properties for LottieInteractivity chain
  private lottieChainInteractionObserver?: IntersectionObserver;
  private lottieChainInitialized = false;
  
  // Performance optimization properties
  private lastScrollTriggerLog = 0;
  private animationRAF?: number;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private geoService: GeoService
  ) {
    // Initialize observables for loading states and error handling
    this.stations$ = this.store.select(state => state.stations.stations.slice(0, STATIONS_DISPLAY_LIMIT));
    this.loading$ = this.store.select(state => state.stations.loading);
    this.error$ = this.store.select(state => state.stations.error);
    
    // Setup search functionality with debouncing for performance
    this.filteredStations$ = combineLatest([
      this.stations$,
      this.searchQuery$.pipe(
        debounceTime(300), // Debounce search for performance
        distinctUntilChanged()
      )
    ]).pipe(
      map(([stations, query]) => {
        if (!query.trim()) return stations;
        
        const searchTerm = query.toLowerCase().trim();
        return stations.filter(station => 
          station.name.toLowerCase().includes(searchTerm) ||
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
    
    // Initialize the video ready promise
    this.videoReadyPromise = new Promise<void>((resolve) => {
      this.resolveVideoReady = resolve;
    });
    
    gsap.registerPlugin(ScrollTrigger);
    this.loadNearbyStations();
    
    // Only log warnings, reduce excessive logging
    const existingTriggers = ScrollTrigger.getAll();
    if (existingTriggers.length > 5) { // Only warn if excessive triggers exist
      console.warn('Multiple ScrollTriggers detected:', existingTriggers.length);
    }
  }

  async ngAfterViewInit(): Promise<void> {
    // Hard-reset any previous GSAP pin/scroll artifacts that could offset the page
    this.removeGsapPinArtifacts();
    // Validate critical DOM elements exist
    const heroSection = document.querySelector('.hero-section');
    const howItWorksSection = document.querySelector('.how-it-works-pinned-viewport');
    
    if (!heroSection || !howItWorksSection) {
      console.error('Critical DOM elements missing');
      return;
    }
    
    if (!DISABLE_SCROLL_FIXES) {
      window.scrollTo(0, 0);
    }
    
    try {
      this.initializeVideoPlayer();
      
      // Wait for video to be ready before proceeding with animations
      await this.videoReadyPromise;
      
      if (!DISABLE_SCROLL_FIXES) {
        this.ensurePageStartsAtTop();
      }
      
      // SOLUTION 6: Use sequential RAF calls for better timing control after video is ready
      this.animationRAF = requestAnimationFrame(() => {
        // Wait another frame to ensure DOM is stable
        requestAnimationFrame(() => {
          if (ENABLE_HOW_IT_WORKS_ANIMATION) {
            this.setupHowItWorksAnimation();
            // Initialize Lottie after ScrollTrigger is properly set up
            requestAnimationFrame(() => {
              this.initializeLottieChainOnVisible();
            });
          }
        });
      });
    } catch (error) {
      console.error('Error in ngAfterViewInit:', error);
    }
  }

  /**
   * Remove GSAP pin-spacers and inline styles that can leave the page offset,
   * making the top content (hero) unreachable even after disabling animations.
   */
  private removeGsapPinArtifacts(): void {
    try {
      // Kill all ScrollTriggers
      try { ScrollTrigger.killAll(); } catch {}

      // Remove pin-spacer wrappers if present
      document.querySelectorAll('.pin-spacer').forEach((spacer) => {
        const fragment = document.createDocumentFragment();
        while (spacer.firstChild) fragment.appendChild(spacer.firstChild);
        spacer.parentElement?.replaceChild(fragment, spacer);
      });

      // Clear inline transforms on common containers
      gsap.set(['body', 'html', '.how-it-works-pinned-viewport', '.how-it-works-track'], { clearProps: 'all' });

      // Ensure scroll is at the top after cleanup
      window.scrollTo(0, 0);
    } catch (e) {
      // Best-effort cleanup; ignore
    }
  }

  private initializeVideoPlayer(): void {
    if (!this.heroVideo?.nativeElement) {
      console.warn('Hero video element not found');
      return;
    }

    try {
      this.videoElement = this.heroVideo.nativeElement;
      this.videoElement.muted = true;
      
      // Enhanced video loading with promise resolution
      this.videoElement.addEventListener('error', (error) => {
        console.error('Video loading error:', error);
        // Resolve the promise even on error to prevent blocking
        this.resolveVideoReady();
      });

      this.canPlayThroughListener = () => {
        // Resolve the video ready promise when video can play through
        this.resolveVideoReady();
        
        const playPromise = this.videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            // Reduced logging - only log if autoplay fails
            if (error.name !== 'NotAllowedError') {
              console.warn('Video autoplay issue:', error.name);
            }
          });
        }
      };

      if (this.videoElement.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
        // Video is already ready, resolve immediately
        this.resolveVideoReady();
        this.videoElement.play().catch(() => {}); // Silent fail for autoplay
      } else {
        this.videoElement.addEventListener('canplaythrough', this.canPlayThroughListener, { once: true });
        
        // Fallback timeout to prevent indefinite waiting
        setTimeout(() => {
          if (this.resolveVideoReady) {
            console.warn('Video ready timeout reached, proceeding with animations');
            this.resolveVideoReady();
          }
        }, 3000); // 3 second timeout
      }
    } catch (error) {
      console.error('Error initializing video player:', error);
      // Resolve the promise on error to prevent blocking
      this.resolveVideoReady();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clean up RAF
    if (this.animationRAF) {
      cancelAnimationFrame(this.animationRAF);
    }
    
    // Clean up video event listeners
    if (this.videoElement && this.canPlayThroughListener) {
      this.videoElement.removeEventListener('canplaythrough', this.canPlayThroughListener);
    }
    
    // Clean up GSAP ScrollTriggers
    const triggers = ScrollTrigger.getAll();
    triggers.forEach((trigger: GSAPTrigger) => trigger.kill());
    
    // Clean up Intersection Observer
    this.lottieChainInteractionObserver?.disconnect();
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
        error: (error) => {
          // Use default location on geolocation error
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
      const howItWorksViewport = document.querySelector('.how-it-works-pinned-viewport') as HTMLElement;
      const track = document.querySelector('.how-it-works-track') as HTMLElement;
      const panels = gsap.utils.toArray(".how-it-works-panel") as HTMLElement[];

      if (!howItWorksViewport || !track || panels.length === 0) {
        console.warn('Animation elements not found');
        return;
      }
      
      // SOLUTION 1: Ensure we're at the top before creating ScrollTrigger
      const currentScrollY = window.scrollY;
      if (currentScrollY !== 0) {
        console.warn('Page not at top during animation setup, forcing scroll reset');
        this.ensurePageStartsAtTop();
      }
      
      // SOLUTION 2: Disable ScrollTrigger during setup to prevent jumps
      ScrollTrigger.disable();
      
      // Optimized animation with better performance
      const tween = gsap.to(track, {
        x: () => -(track.scrollWidth - document.documentElement.clientWidth) + "px",
        ease: "none",
      });

      // SOLUTION 3: Create ScrollTrigger with deferred refresh
      const scrollTriggerInstance = ScrollTrigger.create({
        trigger: howItWorksViewport,
        animation: tween,
        start: "top top",
        end: () => "+=" + (track.scrollWidth - document.documentElement.clientWidth),
        scrub: ANIMATION_CONFIG.SCROLL_SCRUB,
        pin: false,
        pinSpacing: false,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        fastScrollEnd: true,
        preventOverlaps: true,
        refreshPriority: -1, // Lower priority to prevent early calculation
        // Disable snapping entirely to avoid trapping the scroll near the start/end
        snap: false as any,
        markers: ANIMATION_CONFIG.DEBUG_MARKERS,
        // Reduced logging with throttling
        onUpdate: (self) => {
          const now = Date.now();
          if (now - this.lastScrollTriggerLog > ANIMATION_CONFIG.THROTTLE_LOGGING) {
            // Only log in development mode
            if (!window.location.hostname.includes('localhost')) return;
            this.lastScrollTriggerLog = now;
          }
        }
      });

      // SOLUTION 4: Re-enable ScrollTrigger and ensure proper positioning
      requestAnimationFrame(() => {
        // Final scroll position check
        this.ensurePageStartsAtTop();
        
        // Refresh ScrollTrigger calculations from the top position
        ScrollTrigger.refresh();
        
        // Re-enable ScrollTrigger
        ScrollTrigger.enable();
        
        // Final safety check - ensure we're still at top
        setTimeout(() => {
          if (window.scrollY !== 0) {
            console.warn('Final scroll check failed, applying emergency reset');
            this.ensurePageStartsAtTop();
          }
        }, 100);
      });

    } catch (error) {
      console.error('Animation setup error:', error);
      // Re-enable ScrollTrigger even if there's an error
      ScrollTrigger.enable();
    }
  }

  private initializeLottieChainOnVisible(): void {
    try {
      if (!this.lottieContainerLocate?.nativeElement?.id) {
        console.warn('Lottie container not properly configured');
        return;
      }
      
      const lottieContainerEl = this.lottieContainerLocate.nativeElement;

      this.lottieChainInteractionObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !this.lottieChainInitialized) {
              try {
                if (typeof create !== 'undefined') { 
                  const config: LottieInteractivityConfig = {
                    player: `#${lottieContainerEl.id}`,
                    mode: 'chain',
                    actions: [
                      {
                        state: 'autoplay',        
                        transition: 'onComplete' 
                      },
                      {
                        path: '/how-it-works/locate_idle.json',
                        state: 'loop',          
                        transition: 'none'        
                      }
                    ]
                  };
                  create(config as any);
                  this.lottieChainInitialized = true;
                  observer.unobserve(entry.target); 
                }
              } catch (error) {
                console.error('Lottie initialization error:', error);
              }
            }
          });
        },
        { threshold: ANIMATION_CONFIG.INTERSECTION_THRESHOLD }
      );

      this.lottieChainInteractionObserver.observe(lottieContainerEl);
    } catch (error) {
      console.error('Lottie setup error:', error);
    }
  }

  // Search functionality
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const query = target?.value || '';
    this.searchQuery = query;
    this.searchQuery$.next(query);
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
      video.play().catch(() => {}); // Silent error handling
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

  // Utility methods for emergency scroll fixes
  scrollToHero(): void {
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
      heroSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  forceScrollToTop(): void {
    const triggers = ScrollTrigger.getAll();
    triggers.forEach((trigger: GSAPTrigger) => trigger.disable());
    
    // Refresh trigger positions first, then scroll
    ScrollTrigger.refresh();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setTimeout(() => {
      triggers.forEach((trigger: GSAPTrigger) => trigger.enable());
    }, 1000);
  }

  /**
   * SOLUTION 8: Utility method to aggressively ensure page starts at top
   */
  private ensurePageStartsAtTop(): void {
    // Immediate scroll reset
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Also reset any potential scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Additional safety measures
    setTimeout(() => {
      if (window.scrollY !== 0) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }, 0);
    
    // Final check after a short delay
    setTimeout(() => {
      if (window.scrollY !== 0) {
        window.scrollTo({ top: 0, behavior: 'auto' });
        console.warn('Had to force scroll reset after delay - this may indicate a timing issue');
      }
    }, 50);
  }

  /**
   * SOLUTION 11: Emergency scroll reset for persistent issues
   * Call this method if the page still doesn't start at the top
   */
  public emergencyScrollReset(): void {
    console.log('🚨 Emergency scroll reset triggered');
    
    // Kill all ScrollTriggers temporarily
    const triggers = ScrollTrigger.getAll();
    triggers.forEach((trigger: GSAPTrigger) => trigger.kill());
    
    // Force scroll to top
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Clear any GSAP transforms that might be interfering
    gsap.set('.how-it-works-track', { clearProps: 'all' });
    
    // Wait for DOM to settle, then recreate animations
    setTimeout(() => {
      this.setupHowItWorksAnimation();
    }, 200);
  }
}
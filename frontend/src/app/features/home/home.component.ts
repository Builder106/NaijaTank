import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppState } from '../../store';
import { Station } from '../../core/models/station.model';
import * as StationActions from '../../store/actions/station.actions';
import { EnhancedStationCardComponent } from '../../shared/components/enhanced-station-card/enhanced-station-card.component';
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
  SCROLL_SCRUB: 0.2,
  SNAP_DURATION: { min: 0.2, max: 0.3 },
  INTERSECTION_THRESHOLD: 0.5,
  DEBUG_MARKERS: true // Set to false in production
} as const;

// Type interfaces for better type safety
interface GSAPTrigger {
  kill(): void;
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
    EnhancedStationCardComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})

export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('lottieContainerLocate') lottieContainerLocate!: ElementRef<HTMLDivElement>;
  @ViewChild('lottieContainerReport') lottieContainerReport!: ElementRef<HTMLDivElement>;
  @ViewChild('lottieContainerShare') lottieContainerShare!: ElementRef<HTMLDivElement>;
  
  stations$: Observable<Station[]>;
  private destroy$ = new Subject<void>();
  private videoElement!: HTMLVideoElement;
  private canPlayThroughListener!: () => void;
  
  // Properties for LottieInteractivity chain
  private lottieChainInteractionObserver?: IntersectionObserver;
  private lottieChainInitialized = false;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private geoService: GeoService
  ) {
    this.stations$ = this.store.select(state => state.stations.stations.slice(0, STATIONS_DISPLAY_LIMIT));
  }

  ngOnInit(): void {
    gsap.registerPlugin(ScrollTrigger);
    this.loadNearbyStations();
  }

  ngAfterViewInit(): void {
    try {
      this.initializeVideoPlayer();
      this.setupHowItWorksAnimation();
      this.initializeLottieChainOnVisible();
    } catch (error) {
      console.error('Error in ngAfterViewInit:', error);
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

      // Add error event listener
      this.videoElement.addEventListener('error', (error) => {
        console.error('Video loading error:', error);
      });

      // Add loadeddata event listener for better performance
      this.videoElement.addEventListener('loadeddata', () => {
        console.log('Video data loaded successfully');
      });

      this.canPlayThroughListener = () => {
        const playPromise = this.videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Hero video autoplay was prevented:', error);
          });
        }
      };

      if (this.videoElement.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
        const playPromise = this.videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Hero video autoplay was prevented:', error);
          });
        }
      } else {
        this.videoElement.addEventListener('canplaythrough', this.canPlayThroughListener, { once: true });
      }
    } catch (error) {
      console.error('Error initializing video player:', error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clean up video event listeners
    if (this.videoElement && this.canPlayThroughListener) {
      this.videoElement.removeEventListener('canplaythrough', this.canPlayThroughListener);
    }
    
    // Clean up GSAP ScrollTriggers
    ScrollTrigger.getAll().forEach((trigger: GSAPTrigger) => trigger.kill());
    
    // Clean up Intersection Observer
    this.lottieChainInteractionObserver?.disconnect();
  }

  private loadNearbyStations(): void {
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
          console.warn('Failed to get user location, using default location (Lagos):', error?.message || error);
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
      const flagBackground = document.querySelector('.flag-background') as HTMLElement;
      const panels = gsap.utils.toArray(".how-it-works-panel") as HTMLElement[];

      if (!howItWorksViewport || !track) {
        console.warn('Required elements not found for how-it-works animation - missing viewport or track elements');
        return;
      }
      
      // Pin the container and set up the horizontal scroll.
      const tween = gsap.to(track, {
        x: () => -(track.scrollWidth - document.documentElement.clientWidth) + "px",
        ease: "none",
      });

      ScrollTrigger.create({
        trigger: howItWorksViewport,
        animation: tween,
        start: "top top",
        end: () => "+=" + (track.scrollWidth - document.documentElement.clientWidth),
        scrub: ANIMATION_CONFIG.SCROLL_SCRUB,
        pin: true,
        pinSpacing: true, // Add space after pinning to push down next section
        invalidateOnRefresh: true,
        snap: {
          snapTo: 1 / (panels.length - 1),
          duration: ANIMATION_CONFIG.SNAP_DURATION,
          ease: "power1.inOut"
        },
        markers: ANIMATION_CONFIG.DEBUG_MARKERS,
      });

    } catch (error) {
      console.error('Error setting up how-it-works animation:', error instanceof Error ? error.message : error);
    }
  }

  private initializeLottieChainOnVisible(): void {
    try {
      if (!this.lottieContainerLocate?.nativeElement) {
        console.warn('Lottie container element not found for chain initialization');
        return;
      }
      
      const lottieContainerEl = this.lottieContainerLocate.nativeElement;
      
      if (!lottieContainerEl.id) {
        console.warn('Lottie container missing ID attribute for chain initialization');
        return;
      }

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
                  create(config as any); // Type assertion needed for library compatibility
                  this.lottieChainInitialized = true;
                  observer.unobserve(entry.target); 
                } else {
                  console.error('LottieInteractivity library is not loaded');
                }
              } catch (error) {
                console.error('Error initializing Lottie chain:', error instanceof Error ? error.message : error);
              }
            }
          });
        },
        { threshold: ANIMATION_CONFIG.INTERSECTION_THRESHOLD }
      );

      this.lottieChainInteractionObserver.observe(lottieContainerEl);
    } catch (error) {
      console.error('Error setting up Lottie chain observer:', error instanceof Error ? error.message : error);
    }
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
      video.play().catch(err => console.error("Error playing video:", err));
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
}
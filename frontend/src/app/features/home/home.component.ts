import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { AppState } from '../../store';
import { Station } from '../../core/models/station.model';
import * as StationActions from '../../store/actions/station.actions';
import { EnhancedStationCardComponent } from '../../shared/components/enhanced-station-card/enhanced-station-card.component';
import { GeoService } from '../../core/services/geo.service';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    EnhancedStationCardComponent
  ],
  template: `
    <!-- Hero Section with Video Background -->
    <section class="hero-section relative min-h-screen overflow-hidden">
      <!-- Video Background -->
      <div class="absolute inset-0 z-0">
        <video
          #heroVideo
          autoplay 
          muted 
          loop 
          playsinline
          class="w-full h-full object-cover">
          <source src="/landing_page/landing_page.mp4" type="video/mp4">
        </video>
      </div>

      <!-- Hero Content -->
      <div class="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
        <!-- Animated Header Text -->
        <div class="hero-text-container mb-8">
          <h1 class="hero-title text-white mb-6">
            <span class="block text-4xl md:text-5xl lg:text-6xl font-light tracking-wide opacity-90 mb-4">
              <span class="hero-word font-africa text-hero-black text-outline-white mr-6">Fueling</span>
              <span class="hero-word font-africa text-outline-black mr-6">
                <span class="text-block-green">Nig</span><span class="text-block-white">eri</span><span class="text-block-green">a's</span>
              </span>
              <span class="hero-word font-africa text-hero-black text-outline-white">Future</span>
            </span>
          </h1>
        </div>

        <!-- CTA Buttons -->
        <div class="hero-actions flex flex-col sm:flex-row gap-4 mb-12">
          <button 
            (click)="exploreStations()"
            class="cta-primary px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer">
            Explore Stations
          </button>
          <a 
            routerLink="/auth"
            class="cta-secondary px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-primary-900 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105">
            Join Community
          </a>
        </div>

        <!-- Scroll Indicator -->
        <div class="scroll-indicator absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <div class="scroll-text text-white text-sm font-light tracking-widest uppercase mb-4 opacity-80">
            Scroll Down
          </div>
          <div class="scroll-arrow w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div class="scroll-dot w-1 h-3 bg-white rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- How it Works Section-->
    <!-- Pinned Viewport for Horizontal Scroll -->
    <section class="how-it-works-pinned-viewport">
      <!-- Nigerian Flag Background -->
      <div class="flag-background">
        <div class="flag-stripe-green"></div>
        <div class="flag-stripe-white"></div>
        <div class="flag-stripe-green"></div>
      </div>

      <!-- Horizontal Track containing panels -->
      <div class="how-it-works-track">
        <article class="how-it-works-panel">
          <div class="panel-content-wrapper">
            <div class="panel-content">
              <div class="flex flex-col items-center mb-6">
                <img src="/how-it-works/Locate.svg" alt="Locate stations" class="w-24 h-24 md:w-32 md:h-32 mb-4 opacity-80 hover:opacity-100 transition-opacity duration-300">
                <div class="text-4xl md:text-5xl font-bold text-primary-500 mb-2 opacity-50">01</div>
              </div>
              <h3 class="text-2xl md:text-3xl font-bold text-primary-900 mb-4 text-center">Locate & Discover</h3>
              <p class="text-base md:text-lg text-gray-700 leading-relaxed text-center">
                Find petrol stations near you with our intelligent location system. Get real-time directions and discover the best fuel options in your area.
              </p>
            </div>
          </div>
        </article>

        <article class="how-it-works-panel">
          <div class="panel-content-wrapper">
            <div class="panel-content">
              <div class="text-6xl md:text-7xl font-bold text-primary-500 mb-4 opacity-50">02</div>
              <h3 class="text-2xl md:text-3xl font-bold text-primary-900 mb-4">Check Real-Time Status</h3>
              <p class="text-base md:text-lg text-gray-700 leading-relaxed">
                View live updates on fuel availability, current prices, and queue lengths, all reported by our active community.
              </p>
            </div>
          </div>
        </article>

        <article class="how-it-works-panel">
          <div class="panel-content-wrapper">
            <div class="panel-content">
              <div class="text-6xl md:text-7xl font-bold text-primary-500 mb-4 opacity-50">03</div>
              <h3 class="text-2xl md:text-3xl font-bold text-primary-900 mb-4">Report & Earn</h3>
              <p class="text-base md:text-lg text-gray-700 leading-relaxed">
                Share your fuelling experience. Report prices, queue times, and availability to help others and earn community points.
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- Nearby Stations Section -->
    <section class="nearby-stations-section py-20 bg-white" *ngIf="(stations$ | async)?.length">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-primary-900 mb-6">
            Stations Near You
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover fuel stations in your area with real-time availability and community insights.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <app-enhanced-station-card 
            *ngFor="let station of (stations$ | async)?.slice(0, 6)" 
            [station]="station"
            (viewDetails)="onStationSelected($event)">
          </app-enhanced-station-card>
        </div>

        <div class="text-center">
          <a 
            routerLink="/stations" 
            class="inline-flex items-center px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
            View All Stations
            <svg class="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section py-20 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
      <!-- African Pattern Overlay -->
      <div class="absolute inset-0 opacity-10">
        <div class="african-pattern w-full h-full"></div>
      </div>
      
      <div class="container mx-auto px-4 relative z-10">
        <div class="text-center">
          <h2 class="text-4xl md:text-6xl font-bold text-white mb-6">
            Join the Movement
          </h2>
          <p class="text-xl md:text-2xl text-white opacity-90 max-w-3xl mx-auto mb-12 leading-relaxed">
            Be part of Nigeria's largest fuel intelligence community. Together, we're making fuel discovery smarter, faster, and more reliable.
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              routerLink="/auth" 
              class="px-10 py-5 bg-yellow-400 hover:bg-yellow-500 text-primary-900 font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
              Get Started Free
            </a>
            <a 
              routerLink="/map" 
              class="px-10 py-5 border-2 border-white text-white hover:bg-white hover:text-primary-900 font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105">
              Explore Map
            </a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    /* Hero Section Styles */
    .hero-section {
      position: relative;
    }

    .hero-text-container {
      /* Remove fadeInUp from here if you want words to animate individually */
    }

    .hero-title {
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    .hero-word {
      display: inline-block; /* Or inline-flex if needed for complex content */
      opacity: 0;
      animation: fadeInUpWord 0.8s ease-out forwards;
    }

    /* Stagger the animation for each word */
    .hero-word:nth-child(1) {
      animation-delay: 0.3s;
    }
    .hero-word:nth-child(2) {
      animation-delay: 1.3s; /* 0.3s (start word1) + 0.8s (duration word1) + 0.2s (pause) */
    }
    .hero-word:nth-child(3) {
      animation-delay: 2.3s; /* 1.3s (start word2) + 0.8s (duration word2) + 0.2s (pause) */
    }

    .text-outline-white {
      text-shadow:
        -1px -1px 0 #fff,  
         1px -1px 0 #fff,
        -1px  1px 0 #fff,
         1px  1px 0 #fff;
    }

    .text-outline-black {
      text-shadow:
        -1px -1px 0 #000,  
         1px -1px 0 #000,
        -1px  1px 0 #000,
         1px  1px 0 #000;
    }

    .hero-subtitle {
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      animation: fadeInUp 1.2s ease-out 0.3s both;
    }

    .hero-actions {
      animation: fadeInUp 1.2s ease-out 3.3s both; /* 2.3s (start word3) + 0.8s (duration word3) + 0.2s (pause) */
    }

    .scroll-indicator {
      animation: fadeInUp 1.2s ease-out 0.9s both;
    }

    /* CTA Button Styles */
    .cta-primary {
      box-shadow: 0 10px 25px rgba(0, 135, 81, 0.3);
    }

    .cta-secondary {
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.1);
    }

    /* African Pattern */
    .african-pattern {
      background-image: 
        radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
        radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 2px, transparent 2px);
      background-size: 40px 40px;
      background-position: 0 0, 20px 20px;
    }

    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInUpWord {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .hero-title span:last-child {
        font-size: 3.5rem;
      }
      
      .hero-subtitle {
        font-size: 1.125rem;
      }
    }

    /* Scroll Indicator Animation */
    .scroll-arrow {
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }

    /* Video Hover Effects */
    .video-container video {
      filter: brightness(0.8);
      transition: all 0.3s ease;
    }

    .video-container:hover video {
      filter: brightness(1);
    }

    /* How it Works Section Styles */
    .how-it-works-title-wrapper {
      /* Uses Tailwind for bg and padding */
    }

    .how-it-works-pinned-viewport {
      height: 100vh; /* Full viewport height for the parallax effect */
      width: 100vw;
      overflow: hidden;
      position: relative;
    }

    .flag-background {
      position: absolute;
      inset: 0;
      display: flex;
      z-index: 0; /* Behind the track */
    }
    .flag-stripe-green {
      width: 33.3333%;
      height: 100%;
      background-color: #008751; /* Nigerian Green */
    }
    .flag-stripe-white {
      width: 33.3333%;
      height: 100%;
      background-color: #FFFFFF;
    }

    .how-it-works-track {
      display: flex;
      height: 100%;
      position: relative;
      z-index: 1; /* Above the flag */
      /* Width is set by JS: numPanels * 100vw */
    }

    .how-it-works-panel {
      width: 100vw;
      height: 100%;
      flex-shrink: 0; /* Prevent panels from shrinking */
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem; /* Tailwind p-8 */
    }

    .panel-content-wrapper {
      /* This wrapper helps in centering and constraining the .panel-content box */
       display: flex;
       align-items: center;
       justify-content: center;
       width: 100%;
       height: 100%;
    }

    .panel-content {
      background-color: rgba(255, 255, 255, 0.9); /* Slightly more opaque for readability */
      padding: 2rem; /* Tailwind p-8, md:p-10 */
      border-radius: 0.75rem; /* Tailwind rounded-xl */
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); /* Tailwind shadow-xl */
      max-width: 90vw; /* Responsive max width */
      width: auto; /* Allow content to dictate width up to max-width */
      text-align: center;
    }

    @media (min-width: 768px) {
      .panel-content {
        padding: 2.5rem; /* md:p-10 */
        max-width: 500px; /* Fixed max-width on larger screens */
      }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;
  
  stations$: Observable<Station[]>;
  private subscriptions = new Subscription();
  private videoElement!: HTMLVideoElement;
  private canPlayListener!: () => void;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private geoService: GeoService
  ) {
    this.stations$ = this.store.select(state => state.stations.stations.slice(0, 6));
  }

  ngOnInit(): void {
    this.loadNearbyStations();
    this.setupScrollAnimations();
    gsap.registerPlugin(ScrollTrigger); // Register plugin once
  }

  ngAfterViewInit(): void {
    if (this.heroVideo && this.heroVideo.nativeElement) {
      this.videoElement = this.heroVideo.nativeElement;
      this.videoElement.muted = true; // Crucial for autoplay

      this.canPlayListener = () => {
        const playPromise = this.videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Hero video autoplay was prevented on canplay:', error);
          });
        }
      };

      // HTMLMediaElement.HAVE_FUTURE_DATA is 3, HAVE_ENOUGH_DATA is 4
      if (this.videoElement.readyState >= 3) {
        const playPromise = this.videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Hero video autoplay was prevented (readyState >= 3):', error);
          });
        }
      } else {
        this.videoElement.addEventListener('canplay', this.canPlayListener, { once: true });
      }
    }
    this.setupHowItWorksAnimation();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.videoElement && this.canPlayListener) {
      // Remove listener if component is destroyed before 'canplay' fires
      // Though { once: true } largely handles this, explicit removal is safer.
      this.videoElement.removeEventListener('canplay', this.canPlayListener);
    }
    ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill()); // Kill GSAP ScrollTriggers
  }

  private loadNearbyStations(): void {
    this.geoService.getCurrentPosition().subscribe({
      next: (position) => {
        this.store.dispatch(StationActions.loadStations({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          radiusKm: 15
        }));
      },
      error: (err) => {
        console.warn('Failed to get user location, defaulting to Lagos:', err);
        this.store.dispatch(StationActions.loadStations({ 
          latitude: 6.5244, // Default to Lagos
          longitude: 3.3792,
          radiusKm: 15
        }));
      }
    });
  }

  private setupScrollAnimations(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Potentially add more animations here for other sections
          }
        });
      },
      { threshold: 0.3 } 
    );

    setTimeout(() => {
      // Observe other sections as needed
    }, 100); // Delay to ensure elements are in the DOM
  }

  private setupHowItWorksAnimation(): void {
    const track = document.querySelector('.how-it-works-track') as HTMLElement;
    const panels = gsap.utils.toArray(".how-it-works-panel") as HTMLElement[];
    
    if (track && panels.length > 0) {
      const numPanels = panels.length;
      // Ensure the track is wide enough to hold all panels side-by-side
      gsap.set(track, { width: numPanels * 100 + 'vw' });

      gsap.to(track, {
        xPercent: -100 * (numPanels - 1),
        ease: "none", // Linear movement for scrub
        scrollTrigger: {
          trigger: ".how-it-works-pinned-viewport",
          pin: true,
          scrub: 0.5, // Smooth scrubbing
          // markers: true, // Uncomment for debugging aid
          start: "top top", // Start pinning and animation when top of viewport hits top of trigger
          end: () => "+=" + (track.offsetWidth - window.innerWidth), // End after scrolling the full width of the track minus one viewport width
          snap: {
            snapTo: 1 / (numPanels - 1), // Snap to the start of each panel
            duration: { min: 0.2, max: 0.3 },
            ease: "power1.inOut"
          },
          invalidateOnRefresh: true // Recalculate ScrollTrigger on window resize
        }
      });
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
}
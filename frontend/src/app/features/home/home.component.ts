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
            class="cta-primary px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
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

    <!-- Stats Section -->
    <section class="stats-section py-20 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div class="stat-item" [class.animate-in]="statsVisible">
            <div class="stat-number text-4xl md:text-5xl font-bold text-yellow-400 mb-2">2,500+</div>
            <div class="stat-label text-white text-sm md:text-base opacity-80">Stations Tracked</div>
          </div>
          <div class="stat-item" [class.animate-in]="statsVisible">
            <div class="stat-number text-4xl md:text-5xl font-bold text-yellow-400 mb-2">50K+</div>
            <div class="stat-label text-white text-sm md:text-base opacity-80">Active Users</div>
          </div>
          <div class="stat-item" [class.animate-in]="statsVisible">
            <div class="stat-number text-4xl md:text-5xl font-bold text-yellow-400 mb-2">24/7</div>
            <div class="stat-label text-white text-sm md:text-base opacity-80">Live Updates</div>
          </div>
          <div class="stat-item" [class.animate-in]="statsVisible">
            <div class="stat-number text-4xl md:text-5xl font-bold text-yellow-400 mb-2">98%</div>
            <div class="stat-label text-white text-sm md:text-base opacity-80">Accuracy Rate</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-primary-900 mb-6">
            Intelligent Fuel Discovery
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            Powered by community insights and real-time data to help you find fuel faster across Nigeria.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Real-time Updates -->
          <div class="feature-card group">
            <div class="feature-icon mb-6">
              <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-500 transition-colors duration-300">
                <svg class="w-8 h-8 text-primary-500 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h3 class="text-2xl font-bold text-primary-900 mb-4">Real-time Updates</h3>
            <p class="text-gray-600 leading-relaxed">
              Get instant notifications about fuel availability, prices, and queue lengths from our community of verified users.
            </p>
          </div>

          <!-- Smart Recommendations -->
          <div class="feature-card group">
            <div class="feature-icon mb-6">
              <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-500 transition-colors duration-300">
                <svg class="w-8 h-8 text-primary-500 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <h3 class="text-2xl font-bold text-primary-900 mb-4">Smart Recommendations</h3>
            <p class="text-gray-600 leading-relaxed">
              AI-powered suggestions based on your location, preferences, and real-time traffic to find the best stations for you.
            </p>
          </div>

          <!-- Community Driven -->
          <div class="feature-card group">
            <div class="feature-icon mb-6">
              <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-500 transition-colors duration-300">
                <svg class="w-8 h-8 text-primary-500 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <h3 class="text-2xl font-bold text-primary-900 mb-4">Community Driven</h3>
            <p class="text-gray-600 leading-relaxed">
              Built by Nigerians, for Nigerians. Every report helps fellow citizens save time and avoid empty stations.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Video Showcase Section -->
    <section class="video-showcase-section py-20 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-primary-900 mb-6">
            See NaijaTank in Action
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience how our platform transforms the way Nigerians find and report fuel availability.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Station Discovery Video -->
          <div class="video-card">
            <div class="video-container relative rounded-lg overflow-hidden shadow-lg group">
              <video 
                class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                muted
                loop
                (mouseenter)="playVideo($event)"
                (mouseleave)="pauseVideo($event)">
                <source src="/landing_page/Drone_view.mp4" type="video/mp4">
              </video>
              <div class="video-overlay absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div class="text-white text-center">
                  <h4 class="text-xl font-bold mb-2">Station Discovery</h4>
                  <p class="text-sm">Find stations near you with aerial precision</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Real-time Reporting Video -->
          <div class="video-card">
            <div class="video-container relative rounded-lg overflow-hidden shadow-lg group">
              <video 
                class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                muted
                loop
                (mouseenter)="playVideo($event)"
                (mouseleave)="pauseVideo($event)">
                <source src="/landing_page/Car_gas_station.mp4" type="video/mp4">
              </video>
              <div class="video-overlay absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div class="text-white text-center">
                  <h4 class="text-xl font-bold mb-2">Real-time Reports</h4>
                  <p class="text-sm">Get live updates from the community</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Community Insights Video -->
          <div class="video-card">
            <div class="video-container relative rounded-lg overflow-hidden shadow-lg group">
              <video 
                class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                muted
                loop
                (mouseenter)="playVideo($event)"
                (mouseleave)="pauseVideo($event)">
                <source src="/landing_page/Women_chatting.mp4" type="video/mp4">
              </video>
              <div class="video-overlay absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div class="text-white text-center">
                  <h4 class="text-xl font-bold mb-2">Community Insights</h4>
                  <p class="text-sm">Share experiences and help others</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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

    /* Stats Section */
    .stats-section {
      background: linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%);
    }

    .stat-item {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.6s ease-out;
    }

    .stat-item.animate-in {
      opacity: 1;
      transform: translateY(0);
    }

    .stat-item:nth-child(1).animate-in { transition-delay: 0.1s; }
    .stat-item:nth-child(2).animate-in { transition-delay: 0.2s; }
    .stat-item:nth-child(3).animate-in { transition-delay: 0.3s; }
    .stat-item:nth-child(4).animate-in { transition-delay: 0.4s; }

    /* Feature Cards */
    .feature-card {
      padding: 2rem;
      border-radius: 1rem;
      background: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      border: 1px solid rgba(0, 135, 81, 0.1);
    }

    .feature-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 135, 81, 0.15);
    }

    /* Video Cards */
    .video-card {
      transition: all 0.3s ease;
    }

    .video-card:hover {
      transform: translateY(-4px);
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
  `]
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;
  
  stations$: Observable<Station[]>;
  statsVisible = false;
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
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.videoElement && this.canPlayListener) {
      // Remove listener if component is destroyed before 'canplay' fires
      // Though { once: true } largely handles this, explicit removal is safer.
      this.videoElement.removeEventListener('canplay', this.canPlayListener);
    }
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
            if (entry.target.classList.contains('stats-section')) {
              this.statsVisible = true;
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    setTimeout(() => {
      const statsSection = document.querySelector('.stats-section');
      if (statsSection) {
        observer.observe(statsSection);
      }
    }, 100);
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
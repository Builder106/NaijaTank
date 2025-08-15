import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Mock interfaces for the minimal reproduction
interface Station {
  id: string;
  name: string;
  address: string;
  brand: string;
  latitude: number;
  longitude: number;
  distance?: number;
  hasAvailableFuel?: boolean;
  lastUpdated?: Date;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <!-- Hero Section with Video Background -->
    <section class="hero-section section relative min-h-screen overflow-hidden">
      <!-- Video Background -->
      <div class="absolute inset-0 z-0">
        <div class="w-full h-full bg-gradient-to-br from-blue-600 to-green-600 hero-video-fade-in"></div>
      </div>

      <!-- Hero Content -->
      <div class="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
        <!-- Animated Header Text -->
        <div class="hero-text-container mb-8">
          <h1 class="hero-title text-white mb-6">
            <span class="block text-4xl md:text-5xl lg:text-6xl font-light tracking-wide opacity-90 mb-4">
              <span class="hero-word font-bold text-black mr-6">Fueling</span>
              <span class="hero-word font-bold mr-6">
                <span class="text-green-400">Nig</span><span class="text-white">eri</span><span class="text-green-400">a's</span>
              </span>
              <span class="hero-word font-bold text-black">Future</span>
            </span>
          </h1>
        </div>

        <!-- Quick Search Section -->
        <div class="hero-search-section mb-8 w-full max-w-md">
          <div class="relative">
            <input 
              type="text" 
              [(ngModel)]="searchQuery"
              (input)="onSearchInput($event)"
              placeholder="Search nearby stations..."
              class="w-full px-4 py-3 pl-12 pr-10 bg-white/90 backdrop-blur-sm border border-white/20 rounded-lg text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
              aria-label="Search for fuel stations">
            <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600" 
                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <button *ngIf="searchQuery" 
                    (click)="clearSearch()"
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
                    aria-label="Clear search">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- CTA Buttons -->
        <div class="hero-actions flex flex-col sm:flex-row gap-4 mb-12">
          <button 
            (click)="exploreStations()"
            class="cta-primary px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer"
            aria-label="Explore nearby fuel stations">
            Explore Stations
          </button>
          <button
            class="cta-secondary px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-blue-900 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
            aria-label="Join the NaijaTank community">
            Join Community
          </button>
        </div>

        <!-- Scroll Indicator -->
        <div class="scroll-indicator absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <div class="scroll-text text-white text-sm font-light tracking-widest uppercase mb-4 opacity-80">
            Scroll Down
          </div>
          <div class="scroll-arrow w-6 h-10 border-2 border-white rounded-full flex justify-center" 
               aria-label="Scroll down for more content">
            <div class="scroll-dot w-1 h-3 bg-white rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- How it Works Section-->
    <section class="how-it-works-section section py-20 bg-gradient-to-r from-green-500 to-white">
      <!-- Nigerian Flag Background -->
      <div class="flag-background" aria-hidden="true">
        <div class="flag-stripe-green"></div>
        <div class="flag-stripe-white"></div>
        <div class="flag-stripe-green"></div>
      </div>

      <div class="container mx-auto px-4 relative z-10">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-900 mb-6">
            How it Works
          </h2>
          <p class="text-lg text-gray-700">
            Follow these simple steps to make the most of NaijaTank.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center p-6 bg-white/90 rounded-xl shadow-xl">
            <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">📍</span>
            </div>
            <div class="text-4xl md:text-5xl font-bold text-blue-500 mb-2 opacity-50">1</div>
            <h3 class="text-2xl md:text-3xl font-bold mb-4">Locate</h3>
            <p class="text-gray-600">Find fuel stations near you with real-time data</p>
          </div>

          <div class="text-center p-6 bg-white/90 rounded-xl shadow-xl">
            <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">📝</span>
            </div>
            <div class="text-4xl md:text-5xl font-bold text-blue-500 mb-2 opacity-50">2</div>
            <h3 class="text-2xl md:text-3xl font-bold text-blue-900 mb-4">Report</h3>
            <p class="text-gray-600">Share fuel availability and prices with the community</p>
          </div>

          <div class="text-center p-6 bg-white/90 rounded-xl shadow-xl">
            <div class="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">🤝</span>
            </div>
            <div class="text-4xl md:text-5xl font-bold text-blue-500 mb-2 opacity-50">3</div>
            <h3 class="text-2xl md:text-3xl font-bold text-blue-900 mb-4">Share</h3>
            <p class="text-gray-600">Help others by sharing your fuel station experiences</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Nearby Stations Section -->
    <section class="nearby-stations-section section py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-blue-900 mb-6">
            <span *ngIf="!searchQuery">Stations Near You</span>
            <span *ngIf="searchQuery">Search Results</span>
          </h2>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto">
            <span *ngIf="!searchQuery">Discover fuel stations in your area with real-time availability and community insights.</span>
            <span *ngIf="searchQuery">Found stations matching "{{ searchQuery }}"</span>
          </p>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <div class="ml-4 text-gray-600">Loading nearby stations...</div>
        </div>

        <!-- Stations Content -->
        <ng-container *ngIf="!loading">
          <!-- No Results State -->
          <div *ngIf="filteredStations.length === 0" class="text-center py-12">
            <div class="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
              <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <h3 class="text-xl font-semibold text-gray-800 mb-2">
                <span *ngIf="!searchQuery">No Stations Found</span>
                <span *ngIf="searchQuery">No Results Found</span>
              </h3>
              <p class="text-gray-600 mb-4">
                <span *ngIf="!searchQuery">No stations found in your current area.</span>
                <span *ngIf="searchQuery">Try adjusting your search terms or clear the search to see all stations.</span>
              </p>
              <button 
                *ngIf="searchQuery"
                (click)="clearSearch()"
                class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200">
                Clear Search
              </button>
            </div>
          </div>

          <!-- Stations Grid -->
          <div *ngIf="filteredStations.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div *ngFor="let station of filteredStations; trackBy: trackByStation" 
                 class="station-card bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="flex justify-between items-start mb-4">
                <h3 class="text-lg font-semibold text-gray-900">{{ station.name }}</h3>
                <span class="text-sm px-2 py-1 rounded-full" 
                      [class]="station.hasAvailableFuel ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                  {{ station.hasAvailableFuel ? 'Available' : 'Out of Stock' }}
                </span>
              </div>
              <p class="text-gray-600 text-sm mb-2">{{ station.address }}</p>
              <p class="text-blue-600 font-medium text-sm mb-4">{{ station.brand }}</p>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500" *ngIf="station.distance">
                  {{ station.distance?.toFixed(1) }} km away
                </span>
                <button 
                  (click)="onStationSelected(station)"
                  class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors duration-200">
                  View Details
                </button>
              </div>
            </div>
          </div>

          <!-- View All Stations Link -->
          <div *ngIf="filteredStations.length > 0" class="text-center">
            <button
              class="inline-flex items-center px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              aria-label="View all available fuel stations">
              View All Stations
              <svg class="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </ng-container>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section section py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
      <!-- African Pattern Overlay -->
      <div class="absolute inset-0 opacity-10" aria-hidden="true">
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
            <button
              class="px-10 py-5 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              aria-label="Sign up for free account">
              Get Started Free
            </button>
            <button
              class="px-10 py-5 border-2 border-white text-white hover:bg-white hover:text-blue-900 font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105"
              aria-label="Explore stations on interactive map">
              Explore Map
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    /* Section Pinning Styles */
    .section {
      min-height: 100vh;
      position: relative;
    }

    /* Hero Section Styles */
    .hero-section {
      position: relative;
    }

    .hero-title {
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    /* Hero Search Section */
    .hero-search-section {
      animation: fadeInUp 1.2s ease-out 2.5s both;
      
      input {
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        
        &:focus {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        }
      }
    }

    .hero-word {
      display: inline-block;
      opacity: 0;
      animation: fadeInUpWord 0.8s ease-out forwards;
    }

    /* Stagger the animation for each word */
    .hero-word:nth-child(1) {
      animation-delay: 0.3s;
    }
    .hero-word:nth-child(2) {
      animation-delay: 1.3s;
    }
    .hero-word:nth-child(3) {
      animation-delay: 2.3s;
    }

    .hero-actions {
      animation: fadeInUp 1.2s ease-out 3.8s both;
    }

    .scroll-indicator {
      animation: fadeInUp 1.2s ease-out 0.9s both;
    }

    /* CTA Button Styles */
    .cta-primary {
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
      transition: all 0.3s ease;
      
      &:hover {
        box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4);
      }
    }

    .cta-secondary {
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
      
      &:hover {
        backdrop-filter: blur(15px);
        background: rgba(255, 255, 255, 0.2);
      }
    }

    /* Station Card Animations */
    .station-card {
      transition: all 0.3s ease;
      animation: slideInUp 0.4s ease-out;
      animation-fill-mode: both;
      
      &:nth-child(1) { animation-delay: 0.1s; }
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.3s; }
      &:nth-child(4) { animation-delay: 0.4s; }
      &:nth-child(5) { animation-delay: 0.5s; }
      &:nth-child(6) { animation-delay: 0.6s; }
    }

    /* African Pattern */
    .african-pattern {
      background-image: 
        radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
        radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 2px, transparent 2px);
      background-size: 40px 40px;
      background-position: 0 0, 20px 20px;
    }

    /* How it Works Flag */
    .flag-background {
      position: absolute;
      inset: 0;
      display: flex;
      z-index: 0;
    }
    .flag-stripe-green {
      width: 33.3333%;
      height: 100%;
      background-color: #008751;
    }

    /* Added for video fade-in */
    .hero-video-fade-in {
      opacity: 0;
      animation: fadeInVideo 1s ease-out 0.7s forwards;
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

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInVideo {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
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

    /* Responsive Design */
    @media (max-width: 768px) {
      .hero-title span:last-child {
        font-size: 3.5rem;
      }
      
      /* Mobile search adjustments */
      .hero-search-section input {
        font-size: 16px; /* Prevent zoom on iOS */
      }
      
      /* Optimize mobile animations */
      .station-card {
        animation-delay: 0.1s; /* Reduce stagger on mobile */
      }
    }

    /* Accessibility: Respect user's motion preferences */
    @media (prefers-reduced-motion: reduce) {
      .hero-word,
      .hero-actions,
      .scroll-indicator,
      .hero-video-fade-in,
      .hero-search-section,
      .station-card {
        animation: none;
        opacity: 1;
        transform: none;
      }
      
      .scroll-dot {
        animation: none;
      }
      
      .scroll-arrow {
        animation: none;
      }
      
      input:focus {
        transform: none;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;
  
  // Simple local state instead of NgRx
  stations: Station[] = [];
  filteredStations: Station[] = [];
  loading = false;
  searchQuery = '';

  ngOnInit(): void {
    // Ensure page starts at the top
    if (window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }
    
    this.loadMockStations();
  }

  private loadMockStations(): void {
    this.loading = true;
    
    // Simulate API call with setTimeout
    setTimeout(() => {
      this.stations = [
        {
          id: '1',
          name: 'Total Energies Victoria Island',
          address: 'Plot 1A, Tiamiyu Savage Street, Victoria Island, Lagos',
          brand: 'Total Energies',
          latitude: 6.4281,
          longitude: 3.4219,
          distance: 2.3,
          hasAvailableFuel: true,
          lastUpdated: new Date()
        },
        {
          id: '2',
          name: 'Conoil Lekki',
          address: 'Lekki-Epe Expressway, Lekki Phase 1, Lagos',
          brand: 'Conoil',
          latitude: 6.4474,
          longitude: 3.4553,
          distance: 5.7,
          hasAvailableFuel: false,
          lastUpdated: new Date()
        },
        {
          id: '3',
          name: 'Mobil Ikoyi',
          address: 'Awolowo Road, Ikoyi, Lagos',
          brand: 'Mobil',
          latitude: 6.4398,
          longitude: 3.4348,
          distance: 3.1,
          hasAvailableFuel: true,
          lastUpdated: new Date()
        },
        {
          id: '4',
          name: 'NNPC Mega Station Ikeja',
          address: 'Allen Avenue, Ikeja, Lagos',
          brand: 'NNPC',
          latitude: 6.5974,
          longitude: 3.3515,
          distance: 8.2,
          hasAvailableFuel: true,
          lastUpdated: new Date()
        },
        {
          id: '5',
          name: 'Oando Ajah',
          address: 'Lekki-Epe Expressway, Ajah, Lagos',
          brand: 'Oando',
          latitude: 6.4698,
          longitude: 3.5852,
          distance: 12.1,
          hasAvailableFuel: false,
          lastUpdated: new Date()
        },
        {
          id: '6',
          name: 'Forte Oil Surulere',
          address: 'Adeniran Ogunsanya Street, Surulere, Lagos',
          brand: 'Forte Oil',
          latitude: 6.4969,
          longitude: 3.3570,
          distance: 6.8,
          hasAvailableFuel: true,
          lastUpdated: new Date()
        }
      ];
      
      this.filteredStations = [...this.stations];
      this.loading = false;
    }, 1000);
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const query = target?.value || '';
    this.searchQuery = query;
    this.filterStations();
  }

  private filterStations(): void {
    if (!this.searchQuery.trim()) {
      this.filteredStations = [...this.stations];
      return;
    }
    
    const searchTerm = this.searchQuery.toLowerCase().trim();
    this.filteredStations = this.stations.filter(station => 
      station.name.toLowerCase().includes(searchTerm) ||
      station.address?.toLowerCase().includes(searchTerm) ||
      station.brand?.toLowerCase().includes(searchTerm)
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredStations = [...this.stations];
  }

  exploreStations(): void {
    console.log('Navigate to stations page');
  }

  onStationSelected(station: Station): void {
    console.log('Selected station:', station);
  }

  trackByStation(index: number, station: Station): string {
    return station.id;
  }
} 
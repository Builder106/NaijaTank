import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AnimationOptions } from 'lottie-web';
import { LottieComponent } from 'ngx-lottie';
import { StationsListComponent } from '../../../stations/stations-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [StationsListComponent, LottieComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  showLottie = true;
  options: AnimationOptions = {
    path: '/entrance/entrance.json',
    loop: false,
  };

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  onAnimationComplete() {
    this.showLottie = false;
    this.cdr.detectChanges();
  }

  onGetStarted() {
    this.router.navigate(['/map']);
  }
}


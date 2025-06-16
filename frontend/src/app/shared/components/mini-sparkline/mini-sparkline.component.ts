import { Component, Input, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mini-sparkline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <canvas #sparklineCanvas 
              [width]="width" 
              [height]="height"
              class="block"
              [style.width.px]="width"
              [style.height.px]="height">
      </canvas>
    </div>
  `
})
export class MiniSparklineComponent implements OnInit {
  @Input() data: number[] = [];
  @Input() width: number = 24;
  @Input() height: number = 4;
  @Input() color: string = '#10B981'; // green-500
  @Input() strokeWidth: number = 1;

  @ViewChild('sparklineCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  ngOnInit(): void {
    this.drawSparkline();
  }

  ngOnChanges(): void {
    if (this.canvasRef) {
      this.drawSparkline();
    }
  }

  private drawSparkline(): void {
    if (!this.data || this.data.length === 0) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);

    // Set up drawing properties
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Calculate data bounds
    const minValue = Math.min(...this.data);
    const maxValue = Math.max(...this.data);
    const range = maxValue - minValue || 1; // Avoid division by zero

    // Calculate step size
    const stepX = this.width / (this.data.length - 1);

    // Draw the line
    ctx.beginPath();
    this.data.forEach((value, index) => {
      const x = index * stepX;
      const y = this.height - ((value - minValue) / range) * this.height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }
}
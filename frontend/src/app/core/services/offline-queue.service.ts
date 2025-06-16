import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface QueuedAction {
  id: string;
  type: 'fuel_report' | 'favorite_toggle' | 'station_visit';
  data: any;
  timestamp: string;
  retryCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineQueueService {
  private queue = new BehaviorSubject<QueuedAction[]>([]);
  private isOnline = new BehaviorSubject<boolean>(navigator.onLine);

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.setOnlineStatus(true));
    window.addEventListener('offline', () => this.setOnlineStatus(false));
    
    // Load queued actions from localStorage
    this.loadQueueFromStorage();
    
    // Process queue when coming back online
    this.isOnline.subscribe(online => {
      if (online) {
        this.processQueue();
      }
    });
  }

  get queue$(): Observable<QueuedAction[]> {
    return this.queue.asObservable();
  }

  get isOnline$(): Observable<boolean> {
    return this.isOnline.asObservable();
  }

  queueAction(type: QueuedAction['type'], data: any): void {
    const action: QueuedAction = {
      id: this.generateId(),
      type,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    const currentQueue = this.queue.value;
    this.queue.next([...currentQueue, action]);
    this.saveQueueToStorage();
  }

  private setOnlineStatus(online: boolean): void {
    this.isOnline.next(online);
  }

  private async processQueue(): Promise<void> {
    const currentQueue = this.queue.value;
    if (currentQueue.length === 0) return;

    const processedActions: string[] = [];

    for (const action of currentQueue) {
      try {
        await this.executeAction(action);
        processedActions.push(action.id);
      } catch (error) {
        console.error('Failed to process queued action:', error);
        // Increment retry count
        action.retryCount++;
        
        // Remove action if it has failed too many times
        if (action.retryCount >= 3) {
          processedActions.push(action.id);
        }
      }
    }

    // Remove processed actions from queue
    const updatedQueue = currentQueue.filter(action => !processedActions.includes(action.id));
    this.queue.next(updatedQueue);
    this.saveQueueToStorage();
  }

  private async executeAction(action: QueuedAction): Promise<void> {
    // This would integrate with your existing services
    switch (action.type) {
      case 'fuel_report':
        // Call your report service
        console.log('Processing queued fuel report:', action.data);
        break;
      case 'favorite_toggle':
        // Call your favorites service
        console.log('Processing queued favorite toggle:', action.data);
        break;
      case 'station_visit':
        // Log station visit
        console.log('Processing queued station visit:', action.data);
        break;
    }
  }

  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem('naijatank_offline_queue');
      if (stored) {
        const queue = JSON.parse(stored);
        this.queue.next(queue);
      }
    } catch (error) {
      console.error('Failed to load offline queue from storage:', error);
    }
  }

  private saveQueueToStorage(): void {
    try {
      localStorage.setItem('naijatank_offline_queue', JSON.stringify(this.queue.value));
    } catch (error) {
      console.error('Failed to save offline queue to storage:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
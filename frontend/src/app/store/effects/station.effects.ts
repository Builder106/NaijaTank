import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { StationService } from '../../core/services/station.service';

@Injectable()
export class StationEffects {
  constructor(
    private actions$: Actions,
    private stationService: StationService
  ) {}
}
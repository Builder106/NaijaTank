import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  UrlTree, 
  Router 
} from '@angular/router';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { AppState } from '../../store';
import * as AuthSelectors from '../../store/selectors/auth.selectors';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    return this.store.select(AuthSelectors.selectIsAuthenticated).pipe(
      take(1), // Only take the current value
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        }
        
        // Not authenticated, redirect to login
        // Include the attempted URL as a return URL parameter
        return this.router.createUrlTree(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
      })
    );
  }
} 
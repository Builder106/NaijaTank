import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { AppState } from '../../../../store';
import * as AuthActions from '../../../../store/actions/auth.actions';
import * as AuthSelectors from '../../../../store/selectors/auth.selectors';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading$: Observable<boolean>;
  error$: Observable<any | null>;
  private subscriptions = new Subscription();

  constructor(private fb: FormBuilder, private store: Store<AppState>) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
    this.isLoading$ = this.store.select(AuthSelectors.selectAuthLoading);
    this.error$ = this.store.select(AuthSelectors.selectAuthError);
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.store.dispatch(AuthActions.login({ email, password }));
    }
  }

  onGoogleLogin(): void {
    this.store.dispatch(AuthActions.loginWithGoogle());
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
} 
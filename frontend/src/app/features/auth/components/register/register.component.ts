import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { AppState } from '../../../../store';
import * as AuthActions from '../../../../store/actions/auth.actions';
import * as AuthSelectors from '../../../../store/selectors/auth.selectors';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  isLoading$: Observable<boolean>;
  error$: Observable<any | null>;
  private subscriptions = new Subscription();

  constructor(private fb: FormBuilder, private store: Store<AppState>) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });

    this.isLoading$ = this.store.select(AuthSelectors.selectAuthLoading);
    this.error$ = this.store.select(AuthSelectors.selectAuthError);
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.registerForm.valid) {
      const { email, password } = this.registerForm.value;
      this.store.dispatch(AuthActions.register({ email, password }));
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.registerForm.controls).forEach(field => {
        const control = this.registerForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
    }
  }

  onGoogleSignUp(): void {
    // Google OAuth handles both sign-in and sign-up through the same flow
    this.store.dispatch(AuthActions.loginWithGoogle());
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
} 
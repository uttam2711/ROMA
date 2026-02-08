
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  signupForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  errorMsg = signal('');

  onSubmit() {
    if (this.signupForm.invalid) {
      this.errorMsg.set('Please fill in all fields correctly.');
      return;
    }

    const { fullName, email, password, confirmPassword } = this.signupForm.value;

    if (password !== confirmPassword) {
      this.errorMsg.set('Passwords do not match.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('roma-users') || '[]');
    const userExists = users.some((u: any) => u.email === email);

    if (userExists) {
      this.errorMsg.set('Email is already registered.');
      return;
    }

    const newUser = { fullName, email, password };
    users.push(newUser);
    localStorage.setItem('roma-users', JSON.stringify(users));

    this.router.navigate(['/login']);
  }
}

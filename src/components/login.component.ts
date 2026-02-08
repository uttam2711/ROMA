
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  errorMsg = signal('');

  onSubmit() {
    if (this.loginForm.invalid) {
      this.errorMsg.set('Please enter valid credentials.');
      return;
    }

    const { email, password } = this.loginForm.value;
    const users = JSON.parse(localStorage.getItem('roma-users') || '[]');
    
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (user) {
      localStorage.setItem('roma-auth', user.email);
      this.router.navigate(['/app']);
    } else {
      this.errorMsg.set('Invalid email or password.');
    }
  }
}

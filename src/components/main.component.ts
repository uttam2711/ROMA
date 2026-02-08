
import { Component, inject, signal, ChangeDetectionStrategy, ViewChild, ElementRef, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { LogInputComponent } from './log-input.component';
import { RomaMessageComponent } from './diagnosis-report.component';
import { WelcomeComponent } from './welcome.component';
import { IntroComponent } from './intro.component';
import { GeminiService, RomaResponse } from '../services/gemini.service';

type ViewState = 'welcome' | 'intro' | 'app';

interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'error';
  content?: string;
  data?: RomaResponse;
  image?: string | null;
  timestamp: number;
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent, 
    LogInputComponent, 
    RomaMessageComponent,
    WelcomeComponent,
    IntroComponent
  ],
  templateUrl: './main.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainComponent implements OnInit {
  private geminiService = inject(GeminiService);
  private router = inject(Router);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild(LogInputComponent) logInput!: LogInputComponent;

  viewState = signal<ViewState>('welcome');
  messages = signal<ChatMessage[]>([]);
  isProcessing = signal(false);
  sessionID = Math.floor(1000 + Math.random() * 9000);
  
  // Profile State
  currentUser = signal<{ fullName: string, email: string, password?: string } | null>(null);
  showProfileMenu = signal(false);
  showPassword = signal(false);

  // State Tracking
  lastRobotModel = signal('');
  lastLogs = signal('');
  lastImage = signal<string | null>(null);
  
  constructor() {
    this.messages.set([]);
    
    effect(() => {
        const msgs = this.messages();
        setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    const email = localStorage.getItem('roma-auth');
    if (email) {
        const users = JSON.parse(localStorage.getItem('roma-users') || '[]');
        const user = users.find((u: any) => u.email === email);
        if (user) {
            this.currentUser.set({ 
                fullName: user.fullName, 
                email: user.email,
                password: user.password 
            });
        }
    }
  }

  toggleProfileMenu() {
    this.showProfileMenu.update(v => !v);
    // Reset password visibility when closing/opening menu
    if (!this.showProfileMenu()) {
        this.showPassword.set(false);
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  logout() {
    localStorage.removeItem('roma-auth');
    this.router.navigate(['/login']);
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  finishWelcome() {
    this.viewState.set('intro');
  }

  finishIntro() {
    this.viewState.set('app');
    this.triggerSystemGreeting();
  }

  async triggerSystemGreeting() {
    const apiKey = process.env['API_KEY'] || '';
    if (!apiKey) {
        this.addMessage('error', 'API Key missing. Cannot initialize system.');
        return;
    }

    this.isProcessing.set(true);
    try {
        const response = await this.geminiService.sendMessage(apiKey, "System Startup", null);
        this.addMessage('model', undefined, null, response);
    } catch (err) {
        console.error(err);
        this.addMessage('error', 'Connection to AI Core failed during startup.');
    } finally {
        this.isProcessing.set(false);
    }
  }

  async handleUserMessage(data: { robotModel: string, logs: string, image: string | null }) {
    const apiKey = process.env['API_KEY'] || '';
    if (!apiKey) {
      this.addMessage('error', 'API Configuration Error: Missing API Key.');
      return;
    }

    const isUnlockCommand = data.logs.includes("I confirm all safety checks. Unlock code.");
    
    if (!isUnlockCommand) { 
        this.lastRobotModel.set(data.robotModel);
        this.lastLogs.set(data.logs);
        this.lastImage.set(data.image);
    }

    this.addMessage('user', data.logs, data.image);
    this.isProcessing.set(true);

    try {
      const context = !isUnlockCommand ? data.robotModel : undefined;
      
      // Prepare User Context (Memory)
      const user = this.currentUser();
      let userContext: { name: string, email: string, memory: string } | undefined;
      
      if (user) {
          const memoryKey = `roma-memory-${user.email}`;
          const currentMemory = localStorage.getItem(memoryKey) || '';
          userContext = {
              name: user.fullName,
              email: user.email,
              memory: currentMemory
          };
      }

      const response = await this.geminiService.sendMessage(apiKey, data.logs, data.image, context, userContext);
      
      // Handle Memory Updates
      if (response.sections.userMemoryUpdate && user) {
          const memoryKey = `roma-memory-${user.email}`;
          let currentMemory = localStorage.getItem(memoryKey) || '';
          // Append new fact with a delimiter
          if (currentMemory) {
              currentMemory += ` | ${response.sections.userMemoryUpdate}`;
          } else {
              currentMemory = response.sections.userMemoryUpdate;
          }
          localStorage.setItem(memoryKey, currentMemory);
          console.log('ROMA Memory Updated:', currentMemory);
      }

      this.addMessage('model', undefined, null, response);
      
    } catch (err: any) {
      let errDump = '';
      try { errDump = JSON.stringify(err); } catch {}
      errDump += (err?.message || '') + (err?.error?.message || '') + JSON.stringify(err?.error || {});
      const lowerErr = errDump.toLowerCase();
      
      const isQuota = lowerErr.includes('quota') || lowerErr.includes('plan') || lowerErr.includes('billing');
      const isRateLimit = (lowerErr.includes('429') || lowerErr.includes('resource_exhausted')) && !isQuota;

      let errorMessage = 'Communication failed. Please try again.';
      if (isQuota) errorMessage = '⚠️ API Quota Exceeded. The free tier limit has been reached.';
      else if (isRateLimit) errorMessage = '⚠️ System Busy. Please try again in 30 seconds.';
      
      this.addMessage('error', errorMessage);
    } finally {
      this.isProcessing.set(false);
      this.logInput.reset();
    }
  }

  handleSafetyUnlock() {
    const unlockPhrase = "I confirm all safety checks. Unlock code.";
    this.handleUserMessage({
        robotModel: this.lastRobotModel(),
        logs: unlockPhrase,
        image: null
    });
  }

  private addMessage(role: 'user' | 'model' | 'error', content?: string, image?: string | null, data?: RomaResponse) {
    this.messages.update(msgs => [...msgs, {
      id: crypto.randomUUID(),
      role,
      content,
      image,
      data,
      timestamp: Date.now()
    }]);
  }
}

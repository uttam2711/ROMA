import { Component, output, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome',
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-center transition-opacity duration-700"
         [class.opacity-0]="fadingOut"
         [class.pointer-events-none]="fadingOut">
      
      <div class="space-y-8 transform transition-all duration-700 delay-100" 
           [class.scale-95]="fadingOut" 
           [class.opacity-0]="fadingOut">
        
        <!-- Logo Animation -->
        <div class="relative w-32 h-32 mx-auto">
            <div class="absolute inset-0 bg-cyan-500 rounded-2xl rotate-3 opacity-20 animate-pulse"></div>
            <div class="absolute inset-0 bg-cyan-500 rounded-2xl -rotate-3 opacity-20 animate-pulse" style="animation-delay: 0.5s"></div>
            <div class="relative w-full h-full bg-slate-900 border-2 border-cyan-500/50 rounded-2xl flex items-center justify-center shadow-[0_0_60px_rgba(6,182,212,0.3)]">
                <i class="fa-solid fa-robot text-6xl text-cyan-400"></i>
            </div>
        </div>

        <div>
            <h1 class="text-6xl font-black text-white tracking-tighter mb-4">ROMA</h1>
            <p class="text-xl text-cyan-400/80 font-mono tracking-wide uppercase">Diagnose. Decide. Deploy.</p>
        </div>

        <button (click)="triggerStart()" 
                class="group relative inline-flex items-center gap-3 px-8 py-4 bg-slate-900 border border-slate-700 hover:border-cyan-500 text-white font-bold rounded-full transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]">
            <span>INITIALIZE SYSTEM</span>
            <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform text-cyan-500"></i>
        </button>
      </div>

      <!-- Footer -->
      <div class="absolute bottom-8 text-xs text-slate-600 font-mono">
        v2.1.0-STABLE | POWERED BY GEMINI
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomeComponent implements OnInit {
  onStart = output<void>();
  fadingOut = false;

  ngOnInit() {
    // Auto-dismiss after 10 seconds if no interaction
    setTimeout(() => {
      if (!this.fadingOut) this.triggerStart();
    }, 10000);
  }

  triggerStart() {
    this.fadingOut = true;
    setTimeout(() => {
      this.onStart.emit();
    }, 700); // Match CSS duration
  }
}
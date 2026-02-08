import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RomaResponse } from '../services/gemini.service';

@Component({
  selector: 'app-roma-message',
  imports: [CommonModule],
  template: `
<div class="max-w-4xl mx-auto w-full space-y-6 animate-fade-in">

  <!-- =====================================
       GREETING MODE (SYSTEM ONLINE)
  ====================================== -->
  @if (isGreeting()) {
      <div class="flex items-center gap-4 p-5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
           <div class="w-10 h-10 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 border border-cyan-800">
               <i class="fa-solid fa-robot"></i>
           </div>
           <div>
               <div class="text-xs font-mono text-cyan-600 mb-1">SYSTEM STATUS</div>
               <div class="text-cyan-200 font-mono text-sm tracking-wide">{{ safe(response.sections.rootCause) }}</div>
           </div>
      </div>
  } 
  
  <!-- =====================================
       STATE 2: UNLOCK MODE (CODE ONLY)
       Only triggered if metadata says code is allowed and strictly NO risk level.
  ====================================== -->
  @else if (isCodeOnly()) {
    <div class="rounded-xl bg-slate-900 border border-slate-700 p-6">
      <div class="flex items-center justify-between mb-4">
          <div class="text-xs font-mono text-green-400 font-bold flex items-center gap-2">
              <i class="fa-solid fa-unlock"></i> RECOVERY SEQUENCE UNLOCKED
          </div>
          <button (click)="copyCode()" class="text-xs text-slate-500 hover:text-white transition-colors">
              <i class="fa-regular fa-copy"></i> Copy
          </button>
      </div>
      
      <pre class="bg-black/40 text-green-300 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-slate-800">{{ response.sections.recoveryCode }}</pre>
      
      <div class="mt-4 text-xs text-slate-500 font-mono">
         {{ response.sections.systemStatus }}
      </div>
    </div>
  } 
  
  <!-- =====================================
       STATE 1: DIAGNOSTIC MODE
       Risk Level Present. Code Blocked.
  ====================================== -->
  @else if (response.metadata.riskLevel) {

    <!-- RISK & CONFIDENCE -->
    <div class="rounded-xl bg-slate-900 border border-slate-700 p-6">
        <div class="text-xs font-mono text-slate-400">RISK_LEVEL:</div>
        <div class="text-lg font-mono text-red-400 font-bold">{{ response.metadata.riskLevel }}</div>

        <div class="text-xs font-mono text-slate-400 mt-3">CONFIDENCE:</div>
        <div class="text-lg font-mono text-cyan-400 font-bold">{{ response.metadata.confidence }}</div>
    </div>

    <!-- ROOT CAUSE -->
    @if (safe(response.sections.rootCause)) {
        <div class="rounded-xl bg-slate-900 border border-slate-700 p-6">
        <div class="text-xs font-mono text-slate-400 mb-2">ROOT_CAUSE:</div>
        <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ response.sections.rootCause }}</p>
        </div>
    }

    <!-- FIX STEPS -->
    @if (safe(response.sections.fixSteps)) {
        <div class="rounded-xl bg-slate-900 border border-slate-700 p-6">
        <div class="text-xs font-mono text-slate-400 mb-2">FIX_STEPS:</div>
        <pre class="whitespace-pre-wrap text-sm leading-relaxed font-sans">{{ response.sections.fixSteps }}</pre>
        </div>
    }

    <!-- SAFETY CHECKLIST -->
    @if (safe(response.sections.safetyChecklist)) {
        <div class="rounded-xl bg-slate-900 border border-slate-700 p-6">
        <div class="text-xs font-mono text-slate-400 mb-2">SAFETY_CHECKLIST:</div>
        <pre class="whitespace-pre-wrap text-sm leading-relaxed font-mono text-yellow-100/80">{{ response.sections.safetyChecklist }}</pre>
        </div>
    }

    <!-- RECOVERY CODE (ALWAYS BLOCKED HERE IN STATE 1) -->
    <div class="rounded-xl bg-slate-900 border border-slate-700 p-6">
        <div class="text-xs font-mono text-slate-400 mb-2">RECOVERY_CODE:</div>

        <div class="bg-red-950/20 border border-red-900/30 rounded p-4">
            <p class="text-red-400 font-mono text-sm font-bold flex items-center gap-2">
                <i class="fa-solid fa-lock"></i> BLOCKED BY SAFETY GATE
            </p>
            <p class="text-xs text-slate-500 mt-2 mb-4">You must confirm all safety checks to generate executable code.</p>

            <button (click)="triggerUnlock()"
                    class="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-6 py-3 rounded transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2">
                <i class="fa-solid fa-check-circle"></i> CONFIRM SAFETY & UNLOCK
            </button>
        </div>
    </div>

    <!-- PREVENTION STRATEGY -->
    @if (safe(response.sections.preventionStrategy)) {
        <div class="rounded-xl bg-slate-900 border border-slate-700 p-6">
        <div class="text-xs font-mono text-slate-400 mb-2">PREVENTION_STRATEGY:</div>
        <pre class="whitespace-pre-wrap text-sm leading-relaxed font-sans">{{ response.sections.preventionStrategy }}</pre>
        </div>
    }

    <!-- SYSTEM STATUS -->
    @if (safe(response.sections.systemStatus)) {
        <div class="text-center text-xs text-slate-600 font-mono mt-2">
            {{ response.sections.systemStatus }}
        </div>
    }

  } 
  
  <!-- =====================================
       FALLBACK
  ====================================== -->
  @else if (response.sections.rootCause) {
     <div class="rounded-xl bg-slate-900 border border-slate-700 p-6">
        <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ response.sections.rootCause }}</p>
     </div>
  }
</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RomaMessageComponent {
  @Input() response!: RomaResponse;
  @Output() onUnlock = new EventEmitter<void>();

  isGreeting(): boolean {
      // Must be specific greeting string AND no risk level
      return this.response.sections.rootCause.includes("ROMA online. Provide robot model") && !this.response.metadata.riskLevel;
  }

  isCodeOnly(): boolean {
    // State 2: Code Allowed is True, Risk Level is Null, and we have code.
    return (
      this.response.metadata.codeAllowed === true &&
      this.response.metadata.riskLevel === null &&
      this.response.sections.recoveryCode.length > 0
    );
  }

  triggerUnlock() {
    this.onUnlock.emit();
  }

  copyCode() {
      navigator.clipboard.writeText(this.response.sections.recoveryCode);
  }

  safe(value: string | null | undefined): string {
    return value?.trim() || '';
  }
}
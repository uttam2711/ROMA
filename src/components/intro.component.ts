import { Component, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-intro',
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[90] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-500">
      <div class="max-w-4xl w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        <!-- Sidebar / Visual -->
        <div class="md:w-1/3 bg-slate-900 p-8 flex flex-col justify-between border-r border-slate-800">
            <div>
                <h2 class="text-2xl font-bold text-white mb-2">Capabilities</h2>
                <p class="text-slate-400 text-sm mb-6">ROMA is your AI-powered expert for industrial robotics troubleshooting.</p>
            </div>
            <div class="space-y-4">
                <div class="flex items-center gap-3 text-slate-300">
                    <div class="w-8 h-8 rounded bg-yellow-500/10 flex items-center justify-center text-yellow-500"><i class="fa-solid fa-bolt"></i></div>
                    <span class="text-sm font-medium">Root Cause Analysis</span>
                </div>
                <div class="flex items-center gap-3 text-slate-300">
                    <div class="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center text-green-500"><i class="fa-solid fa-code"></i></div>
                    <span class="text-sm font-medium">ROS2 Code Gen</span>
                </div>
                <div class="flex items-center gap-3 text-slate-300">
                    <div class="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center text-red-500"><i class="fa-solid fa-shield-halved"></i></div>
                    <span class="text-sm font-medium">Safety Validation</span>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="md:w-2/3 p-8 flex flex-col">
            <h3 class="text-lg font-bold text-cyan-400 mb-6 uppercase tracking-wider">How to use ROMA</h3>
            
            <div class="grid grid-cols-1 gap-4 mb-8">
                <div class="bg-slate-900 rounded-lg p-4 border border-slate-800 hover:border-slate-700 transition-colors">
                    <h4 class="text-white font-bold mb-1 flex items-center gap-2">
                        <i class="fa-regular fa-file-lines text-slate-500"></i> Input Data
                    </h4>
                    <p class="text-xs text-slate-400">Paste raw ROS logs, error stacks, or upload status files.</p>
                </div>
                <div class="bg-slate-900 rounded-lg p-4 border border-slate-800 hover:border-slate-700 transition-colors">
                    <h4 class="text-white font-bold mb-1 flex items-center gap-2">
                        <i class="fa-solid fa-camera text-slate-500"></i> Visual Context
                    </h4>
                    <p class="text-xs text-slate-400">Upload workspace images to detect physical obstructions.</p>
                </div>
                <div class="bg-slate-900 rounded-lg p-4 border border-slate-800 hover:border-slate-700 transition-colors">
                    <h4 class="text-white font-bold mb-1 flex items-center gap-2">
                        <i class="fa-solid fa-wrench text-slate-500"></i> Execute Fix
                    </h4>
                    <p class="text-xs text-slate-400">Follow the generated plan and copy the ROS2 recovery script.</p>
                </div>
            </div>

            <div class="mt-auto flex justify-end">
                <button (click)="onFinish.emit()" class="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2">
                    GET STARTED <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
            </div>
        </div>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IntroComponent {
  onFinish = output<void>();
}
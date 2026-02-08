import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  template: `
    <aside class="h-full bg-slate-900 border-r border-slate-700 p-6 flex flex-col gap-8">
      <!-- Branding -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded bg-cyan-500 flex items-center justify-center text-slate-900 font-bold text-xl">
          <i class="fa-solid fa-robot"></i>
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-white">ROMA</h1>
          <p class="text-xs text-cyan-400 font-mono">v5.0.0-PRO</p>
        </div>
      </div>

      <!-- Info Block -->
      <div class="space-y-4">
        <h2 class="text-xs uppercase tracking-wider text-slate-500 font-bold">Capabilities</h2>
        <ul class="space-y-3 text-sm text-slate-300">
          <li class="flex items-start gap-2">
            <i class="fa-solid fa-bolt text-yellow-500 mt-1"></i>
            <span>Log Analysis & Root Cause Detection</span>
          </li>
          <li class="flex items-start gap-2">
            <i class="fa-solid fa-code text-green-500 mt-1"></i>
            <span>ROS2 Recovery Code Generation</span>
          </li>
          <li class="flex items-start gap-2">
            <i class="fa-solid fa-shield-halved text-red-500 mt-1"></i>
            <span>Safety Protocol Validation</span>
          </li>
          <li class="flex items-start gap-2">
            <i class="fa-solid fa-eye text-purple-500 mt-1"></i>
            <span>Visual Workspace Inspection</span>
          </li>
        </ul>
      </div>

      <!-- Supported Robots -->
      <div class="space-y-4">
        <h2 class="text-xs uppercase tracking-wider text-slate-500 font-bold">Supported Models</h2>
        <div class="flex flex-wrap gap-2">
          <span class="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 border border-slate-700">UR5/10/e-Series</span>
          <span class="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 border border-slate-700">Franka Emika</span>
          <span class="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 border border-slate-700">Kuka KR</span>
          <span class="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 border border-slate-700">ABB IRB</span>
          <span class="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 border border-slate-700">Fanuc</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-auto pt-6 border-t border-slate-800 text-xs text-slate-600">
        <p>System Status: <span class="text-green-500">ONLINE</span></p>
        <p>Gemini Engine: <span class="text-cyan-600">v2.5-Flash</span></p>
      </div>
    </aside>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {}
import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-log-input',
  imports: [FormsModule, CommonModule],
  template: `
    <!-- Main Input Bar (Fixed Bottom style) -->
    <div class="bg-slate-900 border-t border-slate-700 p-4 shadow-2xl">
      <div class="max-w-4xl mx-auto flex items-end gap-3">
        
        <!-- Options Toolbar -->
        <div class="flex items-center gap-2 bg-slate-800 rounded-lg p-1.5 border border-slate-700 h-[46px]">
            <button (click)="toggleCodeModal()" 
                    class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
                    title="Type Message / Paste Logs">
                <i class="fa-solid fa-keyboard"></i>
            </button>
            <button (click)="fileInput.click()" 
                    class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-yellow-400 transition-colors"
                    title="Upload Log File">
                <i class="fa-solid fa-file-arrow-up"></i>
            </button>
            <button (click)="imgInput.click()" 
                    class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-purple-400 transition-colors"
                    title="Upload Workspace Image">
                <i class="fa-solid fa-camera"></i>
            </button>
            
            <!-- Hidden File Inputs -->
            <input #fileInput type="file" class="hidden" (change)="handleLogFileUpload($event)" accept=".txt,.log">
            <input #imgInput type="file" class="hidden" (change)="handleImageUpload($event)" accept="image/*">
        </div>

        <!-- Mini Status / Robot Selector -->
        <div class="hidden md:block relative h-[46px]">
             <select 
            [ngModel]="selectedRobot()"
            (ngModelChange)="selectedRobot.set($event)"
            class="h-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg px-3 outline-none focus:border-cyan-500 appearance-none cursor-pointer pr-8">
            <option value="Universal Robots UR5/UR5e">UR5/UR5e</option>
            <option value="Universal Robots UR10/UR10e">UR10/UR10e</option>
            <option value="Kuka LBR iiwa">Kuka LBR iiwa</option>
            <option value="Franka Emika Panda">Franka Panda</option>
            <option value="ABB IRB Series">ABB IRB</option>
            <option value="Fanuc M-Series">Fanuc M</option>
            <option value="Other / Custom">Other Robot</option>
            </select>
            <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none"></i>
        </div>

        <!-- Text Input Trigger -->
        <div class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 flex items-center h-[46px] cursor-text hover:border-slate-600 transition-colors"
             (click)="toggleCodeModal()">
            <span class="text-slate-500 text-sm truncate">
                @if (logs()) {
                    <span class="text-cyan-400"><i class="fa-solid fa-pen mr-1"></i> Message ready ({{logs().length}} chars)</span>
                } @else {
                    Type message, paste logs, or describe fault...
                }
            </span>
        </div>

        <!-- Send Button -->
        <button (click)="submitDiagnosis()"
                [disabled]="isAnalyzing() || !logs()"
                class="h-[46px] px-6 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-cyan-900/20">
            @if (isAnalyzing()) {
                <i class="fa-solid fa-circle-notch fa-spin"></i>
            } @else {
                <i class="fa-solid fa-paper-plane"></i>
            }
            <span class="hidden md:inline">SEND</span>
        </button>
      </div>
      
      <!-- Image Preview Badge -->
      @if (previewImage()) {
          <div class="max-w-4xl mx-auto mt-2 flex justify-end">
             <div class="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full pl-1 pr-3 py-1">
                 <img [src]="previewImage()" class="w-6 h-6 rounded-full object-cover">
                 <span class="text-xs text-slate-300">Image attached</span>
                 <button (click)="clearImage()" class="ml-1 text-slate-500 hover:text-red-400"><i class="fa-solid fa-xmark"></i></button>
             </div>
          </div>
      }
    </div>

    <!-- CODE / LOGS MODAL -->
    @if (showCodeModal()) {
        <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
                <div class="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 class="text-white font-bold flex items-center gap-2">
                        <i class="fa-solid fa-keyboard text-cyan-400"></i> Input Console
                    </h3>
                    <div class="flex gap-2">
                         <button (click)="fillDemoData()" class="text-xs text-cyan-500 hover:text-white px-3 py-1 rounded border border-cyan-900 hover:bg-cyan-900 transition-colors">
                            Load Demo Logs
                        </button>
                        <button (click)="toggleCodeModal()" class="text-slate-400 hover:text-white transition-colors">
                            <i class="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-4 flex-1 overflow-hidden flex flex-col">
                    <textarea 
                        [ngModel]="logs()"
                        (ngModelChange)="logs.set($event)"
                        placeholder="Describe the issue, paste ROS2 logs, or ask questions..."
                        class="w-full flex-1 bg-slate-950 border border-slate-700 text-slate-300 font-mono text-sm rounded-md p-4 focus:ring-1 focus:ring-cyan-500 outline-none resize-none placeholder-slate-700"
                    ></textarea>
                </div>
                
                <div class="p-4 border-t border-slate-800 flex justify-end gap-3">
                    <span class="text-xs text-slate-500 self-center">Press Enter to send not supported in multiline mode</span>
                    <button (click)="toggleCodeModal(); submitDiagnosis()" class="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold transition-colors">
                        Send Message
                    </button>
                </div>
            </div>
        </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogInputComponent {
  selectedRobot = signal('Universal Robots UR5/UR5e');
  logs = signal('');
  previewImage = signal<string | null>(null);
  imageBase64 = signal<string | null>(null);
  isAnalyzing = signal(false);
  showCodeModal = signal(false);

  onDiagnose = output<{ robotModel: string, logs: string, image: string | null }>();

  toggleCodeModal() {
    this.showCodeModal.update(v => !v);
  }

  handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.previewImage.set(result);
        const base64Data = result.split(',')[1];
        this.imageBase64.set(base64Data);
      };
      reader.readAsDataURL(file);
    }
  }

  handleLogFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        this.logs.set(text);
        this.showCodeModal.set(true); // Open modal to show loaded text
      };
      reader.readAsText(file);
    }
  }

  clearImage() {
    this.previewImage.set(null);
    this.imageBase64.set(null);
  }

  submitDiagnosis() {
    if (!this.logs()) {
        this.showCodeModal.set(true);
        return;
    }
    this.onDiagnose.emit({
      robotModel: this.selectedRobot(),
      logs: this.logs(),
      image: this.imageBase64()
    });
  }

  reset() {
    this.logs.set('');
    this.clearImage();
  }

  fillDemoData() {
    this.selectedRobot.set('Universal Robots UR5/UR5e');
    this.logs.set(`[INFO] [16321455.122] [MoveGroup]: Planning request received for MoveGroup action.
[ERROR] [16321455.201] [OMPL]: Graph disconnected.
[ERROR] [16321455.202] [MoveGroup]: PLANNER FAILED: No solution found within 5.0s.
[WARN] [16321455.205] [Controller]: Joint 3 (Elbow) approaching singularity configuration.`);
  }
}

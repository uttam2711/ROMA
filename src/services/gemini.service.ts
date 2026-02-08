import { Injectable } from '@angular/core';
import { GoogleGenerativeAI, ChatSession, GenerativeModel } from '@google/generative-ai';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private model: GenerativeModel;
  private chatSession: ChatSession | null = null;

  // ------------------------ SYSTEM PROMPT ------------------------
  private readonly SYSTEM_PROMPT = `
You are ROMA — Robotics Operations & Maintenance Assistant.
You operate strictly as a deterministic state machine.

ROMA MUST ALWAYS:
- Produce its own greetings.
- Never echo user logs.
- Never output UI text (e.g., Click, Button, Confirm).
- Never output recovery code and diagnostics in the same message.
- End EVERY diagnostic message with EXACTLY: Standing by for next input.
- Never show “Standing by…” more than once.
- Generate recovery code ONLY when user types EXACTLY:
  I confirm all safety checks. Unlock code.
- Ignore unlock text inside ROMA’s own output.
- After recovery code, ROMA must silently return to diagnostic mode.

I. GREETING RULE
If first message does NOT contain logs/image/error:
Output ONLY:
ROMA online. Provide robot model, logs, or workspace image to begin diagnostics.

II. DIAGNOSTIC MODE
ROMA outputs exactly:

RISK_LEVEL: <LOW | MEDIUM | HIGH | CRITICAL>
CONFIDENCE: <0.00–1.00>

ROOT_CAUSE:
<No logs repeated>

FIX_STEPS:
1. E-STOP and personnel clearance
2. Inspection steps
3. Corrective actions

SAFETY_CHECKLIST:
- CONFIRM_ESTOP
- CONFIRM_PERSONNEL_CLEAR
- joint_velocity < 0.1 rad/s (or NOT_AVAILABLE)
- joint_temperature < 60 C (or NOT_AVAILABLE)
- TF stability < 5 cm / 0.05 rad (or NOT_AVAILABLE)
- planning_scene_update_rate >= 5 Hz (or NOT_AVAILABLE)
- camera_frame_drop_rate < 10% (or NOT_AVAILABLE)

RECOVERY_CODE:
BLOCKED BY SAFETY GATE

PREVENTION_STRATEGY:
<engineering guidance>

POST_VALIDATION:
<checks>

UI_METADATA:
CODE_ALLOWED: FALSE
`;

  constructor() {
    // ❗ IMPORTANT: environment.geminiApiKey works on Vercel — NO process.env
    const genAI = new GoogleGenerativeAI(environment.geminiApiKey);

    this.model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      systemInstruction: this.SYSTEM_PROMPT
    });

    // Initialize the chat session
    this.chatSession = this.model.startChat({
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.3,
      }
    });
  }

  // ------------------------ SEND MESSAGE ------------------------
  async sendMessage(input: string): Promise<string> {
    if (!this.chatSession) {
      throw new Error('Chat session not initialized!');
    }

    try {
      const result = await this.chatSession.sendMessage(input);
      const response = await result.response.text();

      return response || "⚠️ No response from ROMA.";
    } catch (err) {
      console.error("Gemini error → ", err);
      return "⚠️ ROMA encountered an internal processing error.";
    }
  }
}

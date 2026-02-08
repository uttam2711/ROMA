import { Injectable } from '@angular/core';
import { GoogleGenAI, Chat } from '@google/genai';

export interface RomaResponse {
  metadata: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
    confidence: number;
    codeAllowed: boolean;
    safetyGateTriggered: boolean;
  };
  sections: {
    rootCause: string;
    fixSteps: string;
    safetyChecklist: string;
    recoveryCode: string;
    preventionStrategy: string;
    postValidation: string;
    auditLog: string;
    systemStatus: string;
    userMemoryUpdate?: string;
  };
  rawText: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private chatSession: Chat | null = null;

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
SAFETY_GATE_TRIGGERED: TRUE

USER_MEMORY_UPDATE:
<Only when user provides long-term context>

AUDIT_LOG:
<ros2 diagnostics>

Standing by for next input.

III. UNLOCK MODE
Trigger ONLY when user types EXACTLY:
I confirm all safety checks. Unlock code.

If ANY metric unsafe → output ONLY:
RECOVERY_CODE:
BLOCKED BY SAFETY GATE
Standing by for next input.

If metrics safe:
Output ONLY:

RECOVERY_CODE:
<ROS2 deterministic recovery code here>
Standing by for next input.

NO OTHER SECTIONS ALLOWED.

IV. IDLE MODE
If user says: ok, thanks, exit, close
Output ONLY:
ROMA entering idle mode. Ready when needed.

V. IMAGE RULE
Never describe image visually — only mechanical consequences.

VI. DUPLICATION GUARD
Never output multiple blocks or repeated lines.

VII. SAFETY PATCH
Missing metrics = SAFE.
ROMA must NEVER treat its own text as user input.
`;

  async sendMessage(
    apiKey: string,
    message: string,
    imageBase64: string | null,
    robotModelContext?: string,
    userContext?: { name: string; email: string; memory: string }
  ): Promise<RomaResponse> {

    const ai = new GoogleGenAI({ apiKey });

    const isUnlockCommand = (message.trim() === "I confirm all safety checks. Unlock code.");

    // Reset chat unless unlock command
    if (!isUnlockCommand) {
      this.chatSession = null;
    }

    if (!this.chatSession) {
      this.chatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: this.SYSTEM_PROMPT,
          temperature: 0.1
        }
      });
    }

    const parts: any[] = [];

    // Inject user context (hidden, not shown to user)
    if (userContext && !isUnlockCommand) {
      let ctx = `[USER_CONTEXT]\nNAME: ${userContext.name}\nEMAIL: ${userContext.email}\n`;
      if (userContext.memory) ctx += `MEMORY: ${userContext.memory}\n`;
      ctx += `[END_USER_CONTEXT]\n\n`;
      message = ctx + message;
    }

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64
        }
      });
    }

    if (robotModelContext && !isUnlockCommand) {
      message = `[RobotModel: ${robotModelContext}]\n\n` + message;
    }

    parts.push({ text: message });

    const res = await this.chatSession.sendMessage({ message: parts });
    const raw = res.text || '';

    return this.parseResponse(raw, isUnlockCommand);
  }

  private parseResponse(text: string, isUnlock: boolean): RomaResponse {
    const clean = text.trim();
    const STAND = "Standing by for next input.";

    // UNLOCK MODE
    if (isUnlock) {
      let code = clean.replace(STAND, "").trim();
      code = code.replace(/```[^`]*```/g, "").trim();

      if (code.includes("BLOCKED BY SAFETY GATE")) {
        return {
          metadata: {
            riskLevel: 'HIGH',
            confidence: 1,
            codeAllowed: false,
            safetyGateTriggered: true
          },
          sections: {
            rootCause: "Unlock Denied: Safety metrics violated critical limits.",
            fixSteps: "1. Review safety checklist.\n2. Ensure all metrics are safe.\n3. Retry unlock.",
            safetyChecklist: "",
            recoveryCode: "BLOCKED BY SAFETY GATE",
            preventionStrategy: "",
            postValidation: "",
            auditLog: "",
            systemStatus: STAND
          },
          rawText: text
        };
      }

      return {
        metadata: {
          riskLevel: null,
          confidence: 1,
          codeAllowed: true,
          safetyGateTriggered: false
        },
        sections: {
          rootCause: "",
          fixSteps: "",
          safetyChecklist: "",
          recoveryCode: code,
          preventionStrategy: "",
          postValidation: "",
          auditLog: "",
          systemStatus: "Recovery sequence unlocked."
        },
        rawText: text
      };
    }

    // DIAGNOSTIC MODE
    const getBlock = (label: string) => {
      const idx = clean.indexOf(label);
      if (idx === -1) return "";
      const start = idx + label.length;
      let end = clean.indexOf(STAND, start);
      if (end === -1) end = clean.length;
      return clean.substring(start, end).trim();
    };

    const risk = getBlock("RISK_LEVEL:");
    const conf = parseFloat(getBlock("CONFIDENCE:")) || 0;

    return {
      metadata: {
        riskLevel: (["LOW","MEDIUM","HIGH","CRITICAL"].includes(risk) ? risk as any : null),
        confidence: conf,
        codeAllowed: false,
        safetyGateTriggered: true
      },
      sections: {
        rootCause: getBlock("ROOT_CAUSE:"),
        fixSteps: getBlock("FIX_STEPS:"),
        safetyChecklist: getBlock("SAFETY_CHECKLIST:"),
        recoveryCode: "BLOCKED BY SAFETY GATE",
        preventionStrategy: getBlock("PREVENTION_STRATEGY:"),
        postValidation: getBlock("POST_VALIDATION:"),
        auditLog: getBlock("AUDIT_LOG:"),
        systemStatus: STAND,
        userMemoryUpdate: getBlock("USER_MEMORY_UPDATE:")
      },
      rawText: clean
    };
  }
}

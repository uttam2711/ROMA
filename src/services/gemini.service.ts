
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
    userMemoryUpdate?: string; // New field for memory persistence
  };
  rawText: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private chatSession: Chat | null = null;

  // ===================================================================
  // ROMA - MASTER SYSTEM PROMPT (STRICT STATE MACHINE)
  // ===================================================================
  private readonly SYSTEM_PROMPT = `You are ROMA — Robotics Operations & Maintenance Assistant.
You are NOT a chatbot. You operate as a strict deterministic state machine for industrial robot diagnostics.

ROMA MUST ALWAYS:
- Produce all greetings itself (UI must NOT send greetings).
- Never output SYSTEM STATUS unless the user explicitly requests it.
- Never quote, restate, summarize, or echo user logs, telemetry, warnings, or errors.
- Never output UI text, UI buttons, or interface messages (e.g., “Confirm Safety & Unlock”, “Click here”, “Press button”).
- Never generate diagnostics and recovery code in the same message.
- End EVERY diagnostic message with EXACTLY:
  Standing by for next input.
- Never output “Standing by…” more than once.
- Never generate recovery code unless the user types EXACTLY:
  I confirm all safety checks. Unlock code.
- After unlock, output ONLY the recovery code block, nothing else.
- After sending recovery code, ROMA must automatically return to DIAGNOSTIC MODE for the NEXT user message.
- NEVER treat ROMA’s own output as new input.
- NEVER react to the unlock phrase if it appeared inside ROMA’s own prior output.
Only react when the USER actually types it.

=====================================================
I. GREETING RULE (MODEL-ONLY)
=====================================================
FIRST USER MESSAGE:
If the first user message does NOT contain logs, error text, robot model, or an image:
Output ONLY:
ROMA online. Provide robot model, logs, or workspace image to begin diagnostics.

Output NOTHING ELSE on the first turn.

=====================================================
II. DIAGNOSTIC MODE (STATE 1)
=====================================================
Triggered when USER provides:
- logs
- robot model
- error text
- an image

ROMA must output EXACTLY ONE diagnostic block:

RISK_LEVEL: <LOW | MEDIUM | HIGH | CRITICAL>
CONFIDENCE: <0.00–1.00>

ROOT_CAUSE:
<Explain the engineering cause. Do NOT repeat logs.>

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
<post-fix verification>

UI_METADATA:
CODE_ALLOWED: FALSE
SAFETY_GATE_TRIGGERED: TRUE

USER_MEMORY_UPDATE:
<Optional: Only if user provides permanent site context/preferences (e.g. 'Use KUKA in Cell 1'). Concise facts.>

AUDIT_LOG:
<ros2/MoveIt diagnostics commands>

Standing by for next input.

ROMA MUST NEVER produce more than one diagnostic block per message.

=====================================================
III. UNLOCK MODE (STATE 2)
=====================================================
Trigger ONLY when the USER INPUT matches EXACTLY:
I confirm all safety checks. Unlock code.

ROMA must ignore this phrase COMPLETELY when it appears inside ROMA’s own previous output.

If ANY available safety metrics violate limits:
RECOVERY_CODE:
BLOCKED BY SAFETY GATE
Standing by for next input.

If ALL metrics are safe OR metrics are "NOT_AVAILABLE":
Output ONLY:

RECOVERY_CODE:
<deterministic ROS2 MoveIt2 recovery code>

Standing by for next input.

NO OTHER SECTIONS.
NO ANALYSIS.
NO ROOT_CAUSE.
NO SAFETY BLOCK.
NO PREVENTION.
NO AUDIT LOG.
NO MEMORY UPDATE.

=====================================================
IV. IDLE MODE
=====================================================
If user says: ok, thanks, exit, close
Output ONLY:
ROMA entering idle mode. Ready when needed.

=====================================================
V. FORBIDDEN UI-TEXT RULE (CRITICAL)
=====================================================
ROMA must NEVER output any UI elements, including:
- “Confirm Safety & Unlock”
- “Click here”
- “Press button”
- “Type message”
- Any UI placeholders

If ROMA accidentally generates any UI text:
ROMA must immediately regenerate the message without UI content.

=====================================================
VI. CODE SUPPRESSION RULE
=====================================================
In DIAGNOSTIC MODE:
RECOVERY_CODE must ALWAYS contain only:
BLOCKED BY SAFETY GATE

NO PYTHON
NO C++
NO imports
NO code-like text

If any code leaks into DIAGNOSTIC MODE:
ROMA must suppress it and regenerate the diagnostic block.

=====================================================
VII. IMAGE DIAGNOSTICS RULE
=====================================================
If an image is provided:
- Identify only engineering consequences (collision risk, singular posture, obstruction, joint limit proximity).
- Never describe visual appearance.
- Never restate visible elements.
- Integrate findings into ROOT_CAUSE.
- Adjust RISK_LEVEL appropriately.

=====================================================
VIII. DUPLICATION GUARD
=====================================================
ROMA must NEVER:
- repeat user logs
- repeat its own previous sections
- output multiple ROOT_CAUSE blocks
- output “Standing by…” more than once
- output recovery code twice
- output greeting more than once

If duplication is detected:
ROMA must regenerate the output with EXACTLY one clean block.

=====================================================
IX. POST-UNLOCK RETURN RULE
=====================================================
After providing recovery code in UNLOCK MODE:
ROMA must automatically revert to DIAGNOSTIC MODE for the next user message.
ROMA must NOT announce this transition.

=====================================================
X. CRITICAL FIX PATCH — ENFORCED BEHAVIOR
=====================================================

1. ROMA must never react to any unlock phrase unless it is typed by the USER.
ROMA must ignore unlock text that appears inside any model-generated message.

2. ROMA must never output SYSTEM STATUS unless the user explicitly requests system status.

3. ROMA must not generate recovery code and diagnostics in the same message.
If this occurs, ROMA must discard the entire output and regenerate according to the state rules.

4. ROMA must not output recovery code more than once per unlock command.

5. ROMA must never output UI labels such as:
“Confirm Safety & Unlock”
“You must confirm all safety checks”
“Copy”
“Press”
“Click”
or any form of UI-oriented text.

6. ROMA must never generate or repeat the unlock confirmation text inside its own output.
ROMA must not show:
“I confirm all safety checks. Unlock code.”
unless it is part of user input.

7. ROMA must treat its own output as non-interactive text.
ROMA must only process USER messages as triggers.

8. ROMA must not print multiple recovery blocks, multiple diagnostic blocks, or multiple “Standing by for next input.”

9. After providing code in unlock mode, ROMA must IMMEDIATELY return to diagnostic mode for the next user message without announcing the mode switch.

=====================================================
XII. CRITICAL SAFETY & UNLOCK FIX PATCH
=====================================================

1. ROMA must NEVER treat any text inside its own generated output as a user command.
ROMA must ONLY accept unlock commands typed directly by the USER.

2. Any metric that is "NOT_AVAILABLE" must be treated as SAFE for unlock purposes.
Safety gate must NOT block unlock solely because a metric is missing or unavailable.

3. During unlock evaluation, ROMA must treat the following as SAFE if not explicitly provided:
- joint_velocity
- joint_temperature
- TF stability
- planning_scene_update_rate
- camera_frame_drop_rate

This ensures ROMA can unlock and generate recovery code even when telemetry is not provided.

4. ROMA must NEVER output:
SYSTEM STATUS
You must confirm all safety checks...
CONFIRM SAFETY & UNLOCK
Type message...
Copy
Press
Click
or any UI label or interface text.

5. ROMA must NEVER repeat the unlock phrase inside its own output.

6. ROMA must generate recovery code ONLY when:
User message == "I confirm all safety checks. Unlock code."
and safety gate = TRUE or metrics unavailable (treated as SAFE).

7. If the user attempts unlock multiple times:
ROMA must NOT repeat diagnostic blocks.
ROMA must ONLY evaluate unlock state.

8. After generating recovery code, ROMA must immediately return to diagnostic mode for the NEXT USER MESSAGE.
ROMA must NOT print additional unlock status messages.

  async sendMessage(
    apiKey: string, 
    message: string, 
    imageBase64: string | null, 
    robotModelContext?: string,
    userContext?: { name: string; email: string; memory: string }
  ): Promise<RomaResponse> {
    const ai = new GoogleGenAI({ apiKey });

    // 1. Session Management
    // If it is NOT an unlock command, we reset the session to ensure fresh context for new logs.
    const isUnlockCommand = message.includes("I confirm all safety checks. Unlock code.");
    
    if (!isUnlockCommand) {
      this.resetChat();
    }

    // 2. Initialize Chat if needed
    if (!this.chatSession) {
      this.chatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: this.SYSTEM_PROMPT,
          temperature: 0.1 // Deterministic
        }
      });
    }

    const parts: any[] = [];

    // Prepend User Context if available (Hidden from user view, but visible to model)
    if (userContext && !isUnlockCommand) {
        let contextBlock = `[SYSTEM: USER CONTEXT]\nNAME: ${userContext.name}\nEMAIL: ${userContext.email}\n`;
        if (userContext.memory) {
            contextBlock += `KNOWN FACTS/MEMORY: ${userContext.memory}\n`;
        }
        contextBlock += `[END USER CONTEXT]\n\n`;
        // We prepend this to the message text for the model to see
        message = contextBlock + message;
    }

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64
        }
      });
    }

    let promptText = message;
    if (robotModelContext && !isUnlockCommand) {
      promptText = `[Context: Robot Model = ${robotModelContext}]\n\n${message}`;
    }
    parts.push({ text: promptText });

    // ================================================================
    // RETRY SYSTEM
    // ================================================================
    let attempt = 0;
    const maxRetries = 3;

    while (true) {
      try {
        const res = await this.chatSession.sendMessage({ message: parts });
        const raw = res.text || '';
        if (!raw) throw new Error('Empty model output');

        return this.parseResponse(raw, isUnlockCommand);

      } catch (err: any) {
        attempt++;
        let errorDump = '';
        try { errorDump = JSON.stringify(err); } catch {}
        errorDump += (err?.message || '') + (err?.error?.message || '');
        const lower = errorDump.toLowerCase();
        
        const isQuota = lower.includes('quota') || lower.includes('billing');
        const isRateLimit = (lower.includes('429') || lower.includes('503')) && !isQuota;

        if (isQuota) throw err;
        if (isRateLimit && attempt <= maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(res => setTimeout(res, delay));
          continue;
        }
        throw err;
      }
    }
  }

  resetChat() {
    this.chatSession = null;
  }

  // ===================================================================
  // PARSER (STRICT STATE MACHINE IMPLEMENTATION)
  // ===================================================================
  private parseResponse(text: string, isUnlockContext: boolean): RomaResponse {
    let clean = text.trim();
    const STANDING_BY = "Standing by for next input.";

    // -------------------------------------------------------------------
    // PATH 1: STATE 2 - UNLOCK MODE
    // -------------------------------------------------------------------
    if (isUnlockContext) {
        // Remove the footer first
        clean = clean.replace(STANDING_BY, '').trim();

        // Extract code using marker or fallback
        let code = '';
        if (clean.includes('RECOVERY_CODE:')) {
            const parts = clean.split('RECOVERY_CODE:');
            code = parts[parts.length - 1].trim();
        } else {
            code = clean;
        }

        // Clean markdown
        code = code.replace(/```python/g, '').replace(/```/g, '').trim();

        // Handle BLOCKED in State 2 (Safety Check Failed during Unlock)
        if (code.includes('BLOCKED BY SAFETY GATE')) {
             return {
                metadata: {
                    riskLevel: 'HIGH', // Force error UI
                    confidence: 1,
                    codeAllowed: false,
                    safetyGateTriggered: true
                },
                sections: {
                    rootCause: "Unlock Denied: Safety metrics violated critical limits.",
                    fixSteps: "1. Review safety checklist.\n2. Ensure all metrics are within limits.\n3. Retry unlock command.",
                    safetyChecklist: "",
                    recoveryCode: "BLOCKED BY SAFETY GATE",
                    preventionStrategy: "",
                    postValidation: "",
                    auditLog: "",
                    systemStatus: STANDING_BY
                },
                rawText: text
            };
        }

        return {
            metadata: {
                riskLevel: null,
                confidence: 1,
                codeAllowed: true, // Only true here
                safetyGateTriggered: false
            },
            sections: {
                rootCause: '', 
                fixSteps: '', 
                safetyChecklist: '', 
                recoveryCode: code,
                preventionStrategy: '', 
                postValidation: '', 
                auditLog: '', 
                systemStatus: "Recovery sequence unlocked."
            },
            rawText: text
        };
    }

    // -------------------------------------------------------------------
    // PATH 2: STATE 1 - DIAGNOSTIC MODE OR GREETING
    // -------------------------------------------------------------------
    
    // Check for greeting exact match
    if (clean.includes("ROMA online. Provide robot model") && !clean.includes('RISK_LEVEL:')) {
         return {
            metadata: {
                riskLevel: null,
                confidence: 1,
                codeAllowed: false,
                safetyGateTriggered: false
            },
            sections: {
                rootCause: "ROMA online. Provide robot model, logs, or workspace image to begin diagnostics.",
                fixSteps: "",
                safetyChecklist: "",
                recoveryCode: "",
                preventionStrategy: "",
                postValidation: "",
                auditLog: "",
                systemStatus: STANDING_BY
            },
            rawText: text
        };
    }

    // Helper for blocks
    const headers = [
      'RISK_LEVEL:', 'CONFIDENCE:', 'ROOT_CAUSE:', 'FIX_STEPS:',
      'SAFETY_CHECKLIST:', 'RECOVERY_CODE:', 'PREVENTION_STRATEGY:',
      'POST_VALIDATION:', 'UI_METADATA:', 'AUDIT_LOG:', 'SYSTEM_STATUS:',
      'USER_MEMORY_UPDATE:' // Added to parser
    ];
    
    // We add "Standing by..." as a pseudo-header to stop the last block capture
    const getBlock = (start: string) => {
      const s = clean.indexOf(start);
      if (s === -1) return '';
      const startAt = s + start.length;
      let end = clean.length;
      
      // Look for next header
      for (const h of headers) {
        const i = clean.indexOf(h, startAt);
        if (i !== -1 && i < end) end = i;
      }
      // Look for footer
      const f = clean.indexOf(STANDING_BY, startAt);
      if (f !== -1 && f < end) end = f;

      return clean.substring(startAt, end).trim();
    };

    const getVal = (key: string, source: string) => {
      const m = new RegExp(`${key}\\s*(.*)`).exec(source);
      return m ? m[1].trim() : '';
    };

    let rootCause = getBlock('ROOT_CAUSE:');
    let fixSteps = getBlock('FIX_STEPS:');
    let safetyChecklist = getBlock('SAFETY_CHECKLIST:');
    let prevention = getBlock('PREVENTION_STRATEGY:');
    let postVal = getBlock('POST_VALIDATION:');
    let audit = getBlock('AUDIT_LOG:');
    let memoryUpdate = getBlock('USER_MEMORY_UPDATE:');
    
    // Risk Parsing
    const riskLevelRaw = getVal('RISK_LEVEL:', clean);
    const validRisks = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const riskLevel = validRisks.includes(riskLevelRaw) ? (riskLevelRaw as any) : null;

    // Safety Gates
    const recoveryCode = "BLOCKED BY SAFETY GATE";
    const codeAllowed = false;
    const safetyGateTriggered = !!riskLevel;

    // Fallback if parsing failed but we have text (e.g. model didn't use headers)
    if (!riskLevel && !rootCause && clean.length > 0) {
        rootCause = clean.replace(STANDING_BY, '').trim();
    }

    return {
      metadata: {
        riskLevel: riskLevel,
        confidence: parseFloat(getVal('CONFIDENCE:', clean)) || 0,
        codeAllowed: codeAllowed,
        safetyGateTriggered: safetyGateTriggered
      },
      sections: {
        rootCause: rootCause,
        fixSteps: fixSteps,
        safetyChecklist: safetyChecklist,
        recoveryCode: recoveryCode,
        preventionStrategy: prevention,
        postValidation: postVal,
        auditLog: audit,
        systemStatus: STANDING_BY,
        userMemoryUpdate: memoryUpdate
      },
      rawText: clean
    };
  }
}

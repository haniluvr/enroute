# Research: Upgrading to NVIDIA PersonaPlex 7B (Full-Duplex S2S)

Current Date: 2026-04-05
Status: **On Hold** (Requested by user)

## 🎯 Goal
Improve the "Dahlia AI Coach" by replacing the cascaded Speech-to-Text -> LLM -> Text-to-Speech pipeline with a unified, full-duplex speech-to-speech model.

## 🚀 Benefits
- **Sub-250ms Latency**: Near-instant response times.
- **Natural Interruptions**: Allows the user and AI to speak simultaneously and handle turn-taking like a real person.
- **Improved Realism**: Handles backchanneling ("uh-huh", "right") and emotion better than separate modules.

## 🏗️ Technical Requirements

### 1. Infrastructure
- **Minimum GPU**: NVIDIA A10G or better (24GB VRAM required for sub-250ms).
- **Hosting Options**:
  - **AWS**: `g5.xlarge` instance (~$1.00/hr). Use Student Credits (~$100-200) for demo.
  - **Lightning AI**: 80 free GPU hours/month (Recommended for testing).

### 2. Architecture Changes
- **Backend**: Shift from standard HTTP/REST to a **WebSocket or gRPC streaming server**.
- **Model Engine**: Use the official NVIDIA Docker container (built on Moshi/Mimi codecs).
- **Frontend (Mobile)**: Update `expo-av` to stream audio buffers in real-time instead of recording files.

## 📝 Implementation Notes
- The current CASCADE (Whisper + Llama 3 + Kokoro) is effectively free via serverless APIs (Groq/Cloudflare/HF).
- PersonaPlex requires a "dedicated" GPU instance to be running, which adds monthly overhead if not using free credits.

---
*This document is for future reference when the project enters the final polishing phase.*

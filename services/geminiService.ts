import { GoogleGenAI } from "@google/genai";
import { cleanVttText } from '../utils/vtt';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const MODEL_ID = 'gemini-3-pro';
const TRANSCRIPTION_PROMPT = `You are a professional multilingual transcription engine with speaker identification capabilities.
Task: Transcribe the audio into the EXACT language being spoken (e.g., if Thai, use Thai).
Identify different speakers and prefix their speech with their name or a speaker label.

DO NOT guess or invent names for the speakers. Use only the format: [Speaker N] followed by the text.
DO NOT translate.

Format: Strictly WebVTT (.vtt).
Timestamps: HH:MM:SS.mmm --> HH:MM:SS.mmm
Speaker Format: [Speaker Name] Text (e.g., [Speaker 1] สวัสดีครับ)

Line Constraints:
- Maximum 100 characters per line.
- If the text exceeds 100 characters, break it into a new timestamp or a new line within the same cue.

Constraints:
- No markdown code blocks (no \`\`\`vtt).
- No introductory text or explanations.
- Start the response immediately with "WEBVTT".`;

export const transcribeAudio = async (
  base64Data: string,
  mimeType: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: TRANSCRIPTION_PROMPT,
          },
        ],
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No transcription generated.");
    }

    // Cleanup potential markdown code blocks if the model adds them despite instructions
    return cleanVttText(text);
  } catch (error) {
    console.error("Gemini Transcription Error:", error);
    throw new Error("Failed to transcribe audio. Please check the file format and try again.");
  }
};
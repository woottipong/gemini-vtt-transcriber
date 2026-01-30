import { GoogleGenAI } from "@google/genai";
import { cleanVttText } from '../utils/vtt';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const MODEL_ID = 'gemini-3-pro-preview';
const TRANSCRIPTION_PROMPT = `You are a professional multilingual transcription engine with high-precision audio synchronization capabilities.
Task: Transcribe the audio into the EXACT language being spoken (e.g., if Thai, use Thai).
Identify different speakers and label them numerically as [Speaker 1], [Speaker 2], etc.


CRITICAL TIMESTAMP RULES
1. Precise Synchronization: Start timestamps must match exactly when the sound begins, and end timestamps must match exactly when the sound stops. Do not estimate.
2. Gap Handling: If there is silence or a pause between sentences, DO NOT extend the timestamp to cover the silence. Leave a gap in the timeline.
3. No Overlaps: Ensure the end time of one cue does not overlap with the start time of the next cue, unless speakers are talking simultaneously.

Format: Strictly WebVTT (.vtt).
Timestamps: HH:MM:SS.mmm --> HH:MM:SS.mmm
Speaker Format: [Speaker N] Text

Line Constraints:
- Maximum 40 characters per line.
- Break lines naturally at pauses or commas to maintain sync.

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
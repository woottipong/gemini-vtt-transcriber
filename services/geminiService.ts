import { GoogleGenAI } from "@google/genai";
import { cleanVttText } from '../utils/vtt';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const MODEL_ID = 'gemini-3-pro-preview';
const TRANSCRIPTION_PROMPT = `### ROLE
You are a High-Precision Audio-to-Text Engine. Your output is used for professional captioning where millisecond accuracy is non-negotiable.

### TRANSCRIPTION RULES
1. NATIVE LANGUAGE: Transcribe in the exact language spoken. Do not translate or paraphrase.
2. SPEAKER DIARIZATION: Identify speakers and label as [Speaker N].
3. LINE CONSTRAINTS: Max 40 characters per line. Break lines at natural linguistic pauses.

### STAMP & GAP LOGIC (STRICT)
1. PHYSICAL SYNC: Timestamps must align with the actual vocal signal. Do not use estimates.
2. 300MS GAP RULE: If a pause between speech exceeds 300ms, you MUST end the current cue and start a new one when speech resumes. Do not bridge silence.
3. NO OVERLAPS: Ensure End_Time < Next_Start_Time unless there is simultaneous talking.
4. FORMAT: HH:MM:SS.mmm --> HH:MM:SS.mmm

### OUTPUT CONSTRAINTS
- FORMAT: Strictly WebVTT (.vtt).
- NO MARKDOWN: Do not wrap the output in code blocks or use backticks.
- NO PREAMBLE: Start the response immediately with "WEBVTT".
- NO EXPLANATIONS: Provide only the raw VTT content.

### TASK
Analyze the audio stream and generate the WebVTT content now.`;

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
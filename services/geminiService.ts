import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const transcribeAudio = async (
  base64Data: string,
  mimeType: string
): Promise<string> => {
  try {
    // Determine model based on complexity, using flash for speed and multimodal capability
    const modelId = "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: `You are a professional multilingual transcription engine.
            Task: Transcribe the audio into the EXACT language being spoken (e.g., if Thai, use Thai).
            DO NOT translate. 
            
            Format: Strictly WebVTT (.vtt).
            Timestamps: HH:MM:SS.mmm --> HH:MM:SS.mmm
            
            Constraints:
            - No markdown code blocks (no \`\`\`vtt).
            - No introductory text or explanations.
            - Start the response immediately with "WEBVTT".`,
          },
        ],
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No transcription generated.");
    }

    // Cleanup potential markdown code blocks if the model adds them despite instructions
    const cleanText = text.replace(/^```vtt\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');

    return cleanText;
  } catch (error) {
    console.error("Gemini Transcription Error:", error);
    throw new Error("Failed to transcribe audio. Please check the file format and try again.");
  }
};
import { FileData } from '../types';

interface YoutubeResponse {
    success: boolean;
    data: FileData;
}

export const fetchYoutubeAudio = async (url: string): Promise<FileData> => {
    const response = await fetch('/api/process-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download video from backend.');
    }

    const result = await response.json() as YoutubeResponse;
    return result.data;
};

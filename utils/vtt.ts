export const cleanVttText = (text: string) => text
    .replace(/^```vtt\n/, '')
    .replace(/^```\n/, '')
    .replace(/\n```$/, '')
    .trim();

export interface VttCue {
    start: number;
    end: number;
    text: string;
}

const parseTimestamp = (timestamp: string) => {
    const match = timestamp.trim().match(/^(\d{2}:)?\d{2}:\d{2}\.\d{3}$/);
    if (!match) return null;

    const parts = timestamp.split(':');
    const [secondsPart, millisPart] = parts[parts.length - 1].split('.');
    const seconds = Number(secondsPart);
    const minutes = Number(parts[parts.length - 2]);
    const hours = parts.length === 3 ? Number(parts[0]) : 0;
    const millis = Number(millisPart);

    return hours * 3600 + minutes * 60 + seconds + millis / 1000;
};

export const parseVtt = (text: string): VttCue[] => {
    if (!text) return [];

    const lines = text.replace(/\r/g, '').split('\n');
    const cues: VttCue[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();
        if (!line || line === 'WEBVTT') {
            i += 1;
            continue;
        }

        let timeLine = line;
        if (!line.includes('-->')) {
            i += 1;
            timeLine = lines[i]?.trim() || '';
        }

        if (!timeLine.includes('-->')) {
            i += 1;
            continue;
        }

        const [startRaw, endRaw] = timeLine.split('-->').map((part) => part.trim().split(' ')[0]);
        const start = parseTimestamp(startRaw);
        const end = parseTimestamp(endRaw);
        if (start === null || end === null) {
            i += 1;
            continue;
        }

        i += 1;
        const textLines: string[] = [];
        while (i < lines.length && lines[i].trim() !== '') {
            textLines.push(lines[i]);
            i += 1;
        }

        cues.push({
            start,
            end,
            text: textLines.join('\n').trim(),
        });

        i += 1;
    }

    return cues;
};

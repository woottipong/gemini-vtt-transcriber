export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type InputMode = 'file' | 'url';

export interface FileData {
  name: string;
  type: string;
  size: number;
  base64: string;
}

export interface TranscriptionResult {
  vttContent: string;
  fileName: string;
}
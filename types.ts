export enum TaskType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
}

export interface Task {
  id: number;
  description: string;
  type: TaskType;
  validationPrompt: string;
  hint?: string;
}

export interface Quest {
  title: string;
  story: string;
  tasks: Task[];
  suggestedTimeInSeconds?: number;
  timeLimitInSeconds?: number;
}

export interface ValidationResult {
  isCorrect: boolean;
  feedback: string;
}

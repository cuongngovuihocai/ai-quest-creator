import { GoogleGenAI, Type } from "@google/genai";
import type { Quest, Task, TaskType, ValidationResult } from '../types';

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Failed to read blob as base64 string"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const generateQuest = async (apiKey: string, topic: string, location: string, objective: string): Promise<Quest> => {
  const ai = new GoogleGenAI({ apiKey });
  const generationPrompt = `
    You are an AI assistant for creating gamified educational quests for 6th-grade math students in Vietnam.
    Based on the following inputs, generate a quest in JSON format.
    ALL TEXT in the final JSON output (title, story, description, hint) MUST BE IN VIETNAMESE.

    Topic: ${topic}
    Location: ${location}
    Learning Objective: ${objective}

    Make the tasks creative, fun, and directly related to the topic and location. Create 2-3 tasks with a variety of types (TEXT, IMAGE, AUDIO).
    For each task, provide a 'hint' that helps the student without giving away the answer.

    IMPORTANT: After creating the tasks, analyze their complexity (e.g., calculation vs. physical movement) and provide a 'suggestedTimeInSeconds' field with a reasonable estimated time in seconds for a student to complete the entire quest.

    - For IMAGE tasks, make the validationPrompt a clear instruction for an AI vision model (in English) describing the object to be found.
    - For TEXT tasks, the validationPrompt MUST BE the single, exact, correct answer (e.g., "954", "3.14"). This will be used for direct comparison.
    - For AUDIO tasks, make the validationPrompt a clear instruction for an AI speech recognition model (in English), describing the key concepts the student should say.
  `;

  try {
    console.log("Generating quest for teacher review...");
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: generationPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    story: { type: Type.STRING },
                    suggestedTimeInSeconds: { type: Type.NUMBER, description: "Estimated time in seconds to complete the quest." },
                    tasks: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                description: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['TEXT', 'IMAGE', 'AUDIO'] },
                                validationPrompt: { type: Type.STRING },
                                hint: { type: Type.STRING },
                            },
                            required: ['description', 'type', 'validationPrompt', 'hint'],
                        },
                    },
                },
                required: ['title', 'story', 'tasks', 'suggestedTimeInSeconds'],
            },
        },
    });
    
    const responseText = response.text.trim();
    if (!responseText) {
        throw new Error("AI returned an empty response.");
    }
    const questData = JSON.parse(responseText);

    if (!questData || !Array.isArray(questData.tasks) || questData.tasks.length === 0) {
        throw new Error("AI response is missing a valid 'tasks' array.");
    }
    
    const tasksWithIds: Task[] = questData.tasks.map((task: Omit<Task, 'id'>, index: number) => ({
        ...task,
        id: index + 1,
    }));
    questData.tasks = tasksWithIds;
    
    console.log("Successfully generated a draft quest for teacher review.");
    return questData as Quest;
      
  } catch (error) {
    console.error(`Error during quest generation:`, error);
    throw new Error("Không thể tạo nhiệm vụ. Vui lòng kiểm tra lại đầu vào hoặc thử lại sau.");
  }
};

export const generateSingleTask = async (
    apiKey: string,
    context: { topic: string; location: string; objective: string; },
    existingTasks: Task[]
): Promise<Task> => {
    const ai = new GoogleGenAI({ apiKey });
    const existingTaskDescriptions = existingTasks.map(t => t.description).join('; ');
    
    const generationPrompt = `
        You are an AI assistant for creating a single, gamified educational task for 6th-grade math students in Vietnam.
        Based on the following context, generate one new task in JSON format.
        ALL TEXT in the final JSON output (description, hint) MUST BE IN VIETNAMESE.

        Context:
        - Topic: ${context.topic}
        - Location: ${context.location}
        - Learning Objective: ${context.objective}
        
        The new task MUST be different from the following existing tasks: "${existingTaskDescriptions}".

        Make the task creative and fun. For the task, also provide a 'hint' that helps the student without giving away the answer. The task type can be TEXT, IMAGE, or AUDIO.
        - For IMAGE tasks, make the validationPrompt a clear instruction for an AI vision model (in English).
        - For TEXT tasks, the validationPrompt MUST BE the single, exact, correct answer.
        - For AUDIO tasks, make the validationPrompt a clear instruction for an AI speech recognition model (in English).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: generationPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['TEXT', 'IMAGE', 'AUDIO'] },
                        validationPrompt: { type: Type.STRING },
                        hint: { type: Type.STRING },
                    },
                    required: ['description', 'type', 'validationPrompt', 'hint'],
                }
            }
        });

        const taskData = JSON.parse(response.text.trim());
        console.log("Successfully generated a single task for review.");
        return { ...taskData, id: 0 }; // ID will be managed by the parent component
    } catch (error) {
        console.error(`Error regenerating single task:`, error);
        throw new Error("Không thể tạo nhiệm vụ mới. Vui lòng thử lại.");
    }
};


const parseValidationResponse = (responseText: string): ValidationResult => {
    const lines = responseText.trim().split('\n');
    const isCorrect = lines[0].toUpperCase().includes('YES');
    const feedback = lines.slice(1).join('\n').trim();
    return { isCorrect, feedback: feedback || (isCorrect ? "Chính xác!" : "Hãy thử lại nhé!") };
};

const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const MAX_DIMENSION = 1024;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height = Math.round(height * (MAX_DIMENSION / width));
                        width = MAX_DIMENSION;
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width = Math.round(width * (MAX_DIMENSION / height));
                        height = MAX_DIMENSION;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas to Blob conversion failed'));
                    }
                }, file.type, 0.9); // 90% quality
            };
            img.onerror = reject;
            if(event.target?.result) {
                img.src = event.target.result as string;
            } else {
                reject(new Error("File could not be read."));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


export const validateImageAnswer = async (apiKey: string, task: Task, imageFile: File): Promise<ValidationResult> => {
  const ai = new GoogleGenAI({ apiKey });
  try {
    const resizedBlob = await resizeImage(imageFile);
    const base64Data = await blobToBase64(resizedBlob);
    const imagePart = { inlineData: { data: base64Data, mimeType: resizedBlob.type } };

    const prompt = `
      You are an image validation AI for a student game. The student was asked to: '${task.validationPrompt}'.
      Does this image satisfy the request?
      First, on a new line, answer only with 'YES' or 'NO'.
      Then, on the next line, provide a brief, encouraging explanation for the student in VIETNAMESE.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
    });
    return parseValidationResponse(response.text);
  } catch (error) {
    console.error("Error validating image:", error);
    throw new Error("Không thể xác thực hình ảnh. Vui lòng thử lại.");
  }
};

export const validateAudioAnswer = async (apiKey: string, task: Task, audioBlob: Blob): Promise<ValidationResult> => {
    const ai = new GoogleGenAI({ apiKey });
    const base64Data = await blobToBase64(audioBlob);
    const audioPart = { inlineData: { data: base64Data, mimeType: audioBlob.type || 'audio/webm' }};

    const prompt = `
      You are an audio validation AI for a student game. The student was asked to say something related to this: '${task.validationPrompt}'.
      Listen to this audio. Does the student's answer correctly address the task?
      First, on a new line, answer only with 'YES' or 'NO'.
      Then, on the next line, provide a brief, encouraging explanation for the student in VIETNAMESE.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, { text: prompt }] },
        });
        return parseValidationResponse(response.text);
    } catch (error) {
        console.error("Error validating audio:", error);
        throw new Error("Không thể xác thực âm thanh. Vui lòng thử lại.");
    }
};

export const validateTextAnswer = async (apiKey: string, task: Task, studentAnswer: string): Promise<ValidationResult> => {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
    You are a text validation AI for a student game. The correct answer is: '${task.validationPrompt}'. The student's answer is: '${studentAnswer}'.
    Is the student's answer correct? Consider minor variations like extra spaces or different capitalization as correct, but the core value/text must match.
    First, on a new line, answer only with 'YES' or 'NO'.
    Then, on the next line, provide a brief, encouraging explanation for the student in VIETNAMESE. If the answer is correct, just say "Chính xác!". If it's incorrect, provide a helpful tip.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return parseValidationResponse(response.text);
    } catch(error) {
        console.error("Error validating text:", error);
        throw new Error("Không thể xác thực câu trả lời. Vui lòng thử lại.");
    }
};
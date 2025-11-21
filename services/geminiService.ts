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
**PERSONA:** You are a fun and creative game designer for kids. Your strength is turning ordinary school subjects into exciting, real-world treasure hunts that are easy to understand, positive, and logically consistent.
    **MISSION:** Generate a complete quest as a single, valid JSON object based on the theme below.
    **THEME:**
    - Topic: ${topic}
    - Location: ${location}
    - Learning Objective: ${objective}
    **EXECUTION GUIDELINES:**
    1.  **NARRATIVE - CLEAR & ENGAGING:**
        - Create a fun, direct, and inspiring `title`.
        - Write a short, captivating `story` that introduces a clear mission (e.g., treasure hunt, helping a character). The students are the main heroes.
        - **Simplicity is Key:** Prioritize simple, direct, and easy-to-understand stories. The goal is excitement and clarity.
        - **Theme of Kindness:** The story must be positive and pro-social (helping, discovering, building).
    2.  **TASKS - LOGICAL & IMMERSIVE:**
        - Each task must flow naturally from the story. The math task must be the DIRECT and LOGICAL key to solving the story's problem.
        - **Clarity is Crucial:** The last sentence of the task `description` must be a direct and unambiguous instruction for the student.
        - **ABSOLUTELY AVOID** dry, instructional phrases like "Nhiệm vụ của em là...".
        - **GOOD Example (Simple, Direct, Logical):** "Tấm Bản Đồ Cổ dẫn đến 'kho báu tri thức' đã bị Thần Gió tinh nghịch xé thành nhiều mảnh! Ngài chỉ để lại một mật thư: 'Ta giấu các mảnh bản đồ ở những nơi có số lượng là **Số Nguyên Tố**'. Hãy nhanh chóng khám phá sân trường, tìm một 'vị trí nguyên tố' (ví dụ: một nhóm có 7 cái ghế), **chụp ảnh lại để chứng minh**, và thu thập mảnh bản đồ đầu tiên!"
    3.  **TASK REQUIREMENTS (Create 2-3 tasks):**
        - **Single Input Type:** Each task must require ONLY ONE input type (`TEXT`, `IMAGE`, or `AUDIO`).
        - For each task, generate `description`, `hint`, and `criteriaDescription` in VIETNAMESE.
        - For each task, generate a `validationPrompt` in ENGLISH with the following specific rules:
            - **For IMAGE tasks,** the `validationPrompt` must be a clear instruction for an AI vision model describing the object(s) to be found (e.g., "A photo containing a group of exactly 7 chairs").
            - **For TEXT tasks,** the `validationPrompt` MUST BE the single, exact, correct numerical or text answer (e.g., "75", "Hình vuông").
            - **For AUDIO tasks,** the `validationPrompt` must be a clear instruction for an AI model, describing the key concepts the student should say (e.g., "The student should explain that a prime number has exactly two divisors: 1 and itself").
    4.  **FINAL JSON STRUCTURE:**
        - The final output must include `title`, `story`, a `tasks` array, and a `suggestedTimeInSeconds` field.
        - ALL user-facing text fields MUST be in VIETNAMESE.
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
        **PERSONA:** You are a fun and creative game designer for 6th-grade math students in Vietnam, creating a single, gamified educational task for an ongoing adventure.
    **MISSION:** Generate ONE new task as a JSON object, based on the context below.
    **CONTEXT:**
    - Topic: ${context.topic}
    - Location: ${context.location}
    - Learning Objective: ${context.objective}
    - Existing Tasks to Avoid: "${existingTaskDescriptions}"
    **EXECUTION GUIDELINES:**
    1.  **Style and Tone:** The new task must be creative, fun, and use immersive language (avoid "Cô giáo yêu cầu..."). It should be positive, pro-social, and logically consistent.
    2.  **Uniqueness:** The new task MUST be different from the existing tasks provided in the CONTEXT.
    3.  **Input & Output Structure:**
        - The task must require ONLY ONE input type (`TEXT`, `IMAGE`, or `AUDIO`).
        - You MUST generate the following fields:
          - `description` (VIETNAMESE): The mission text for the student.
          - `hint` (VIETNAMESE): A helpful clue for the student.
          - `criteriaDescription` (VIETNAMESE): A teacher-friendly explanation of the answer.
          - `validationPrompt` (ENGLISH): This is the machine-readable answer key. Follow these strict rules:
            - **For IMAGE tasks,** make the validationPrompt a clear instruction for an AI vision model (in English) describing the object to be found.
            - **For TEXT tasks,** the validationPrompt MUST BE the single, exact, correct answer (e.g., "954", "3.14").
            - **For AUDIO tasks,** make the validationPrompt a clear instruction for an AI speech recognition model (in English), describing the key concepts the student should say.
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
      You are a friendly and encouraging AI judge in a student's game. Your ONLY job is to verify if the student's submission matches the core requirement.

      **MISSION CONTEXT:**
      - The teacher's grading criteria (in Vietnamese) is: '${task.criteriaDescription}'.
      - The student has submitted an image.

      **YOUR TASK:**
      Analyze the image. Based ONLY on the teacher's criteria, does the image satisfy the request?
      IGNORE any flavor text or story elements from the original task description (like blackboards, trees, etc.) unless they are explicitly part of the teacher's criteria.

      **RESPONSE FORMAT (Strict):**
      1. On the first line, answer ONLY with "YES" or "NO".
      2. On the next lines, provide a brief, positive, and encouraging explanation IN VIETNAMESE.
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
      You are a friendly and encouraging AI judge in a student's game. Your ONLY job is to verify if the student's submission matches the core requirement.

      **MISSION CONTEXT:**
      - The teacher's grading criteria (in Vietnamese) is: '${task.criteriaDescription}'.
      - The student has submitted an audio recording.

      **YOUR TASK:**
      Listen to the audio. Based ONLY on the teacher's criteria, does the student's explanation correctly address the mission?
      IGNORE any flavor text or story elements.

      **RESPONSE FORMAT (Strict):**
      1. On the first line, answer ONLY with "YES" or "NO".
      2. On the next lines, provide a brief, positive, and encouraging explanation for the student IN VIETNAMESE.
         - If YES, praise their understanding (e.g., "Tuyệt vời! Bạn giải thích rất dễ hiểu!").
         - If NO, gently suggest a point they might have missed (e.g., "Gần đúng rồi! Hãy thử nghĩ thêm về tính chất của các góc xem sao.").
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
    You are a friendly and encouraging AI judge in a student's game. Your ONLY job is to verify if the student's submission matches the core requirement.

      **MISSION CONTEXT:**
      - The teacher's grading criteria (in Vietnamese) is: '${task.criteriaDescription}'.
      - The student's answer is: '${studentAnswer}'.

      **YOUR TASK:**
      Based ONLY on the teacher's criteria, is the student's answer correct? Be flexible with minor variations like extra spaces or different capitalization.

      **RESPONSE FORMAT (Strict):**
      1. On the first line, answer ONLY with "YES" or "NO".
      2. On the next lines, provide a brief, positive, and encouraging explanation for the student IN VIETNAMESE.
         - If YES, simply say "Chính xác!".
         - If NO, provide a small, helpful hint without giving away the answer (e.g., "Chưa đúng rồi! Hãy thử tính lại phép cộng xem sao nhé.").
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

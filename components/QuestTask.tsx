import React, { useState, useRef, useEffect } from 'react';
import type { Task, ValidationResult } from '../types';
import { TaskType } from '../types';
import { validateImageAnswer, validateTextAnswer, validateAudioAnswer } from '../services/geminiService';
import CameraIcon from './icons/CameraIcon';
import SparklesIcon from './icons/SparklesIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';


interface QuestTaskProps {
  apiKey: string;
  task: Task;
  onTaskComplete: (feedback: ValidationResult) => void;
  onSkip: () => void;
  disabled?: boolean;
}

const QuestTask: React.FC<QuestTaskProps> = ({ apiKey, task, onTaskComplete, onSkip, disabled = false }) => {
  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<ValidationResult | null>(null);

  // Text state
  const [textAnswer, setTextAnswer] = useState('');

  // Image state
  const [imageAnswer, setImageAnswer] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Hint state
  const [hint, setHint] = useState<string | null>(null);

  // Reset state when task changes
  useEffect(() => {
    // Reset all answer types
    setTextAnswer('');
    setImageAnswer(null);
    setImagePreview(null);
    setAudioBlob(null);
    setAudioUrl(null);
    
    // Reset general state
    setFeedback(null);
    setHint(null);
    setIsLoading(false);

    // Cleanup audio resources
    return () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
    };
  }, [task]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageAnswer(file);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(URL.createObjectURL(file));
      setFeedback(null);
    }
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        setIsRecording(true);
        setAudioBlob(null);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);

        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        const audioChunks: Blob[] = [];
        recorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
        recorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            setAudioBlob(blob);
            setAudioUrl(URL.createObjectURL(blob));
            // Stop mic access
            audioStreamRef.current?.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        };
        recorder.start();
    } catch (err) {
        console.error("Error accessing microphone:", err);
        setFeedback({ isCorrect: false, feedback: "Không thể truy cập micro. Vui lòng cấp quyền và thử lại." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const handleGetHint = () => {
    // The hint is already available in the task prop, just set it to be displayed
    setHint(task.hint || "Không có gợi ý cho nhiệm vụ này.");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((task.type === TaskType.TEXT && !textAnswer) || 
        (task.type === TaskType.IMAGE && !imageAnswer) ||
        (task.type === TaskType.AUDIO && !audioBlob)) {
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      let result: ValidationResult;
      if (task.type === TaskType.IMAGE && imageAnswer) {
        result = await validateImageAnswer(apiKey, task, imageAnswer);
      } else if (task.type === TaskType.TEXT) {
        result = await validateTextAnswer(apiKey, task, textAnswer);
      } else if (task.type === TaskType.AUDIO && audioBlob) {
        result = await validateAudioAnswer(apiKey, task, audioBlob);
      } else {
        throw new Error("Invalid task type or missing answer.");
      }
      
      setFeedback(result);
      if (result.isCorrect) {
        onTaskComplete(result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
      setFeedback({ isCorrect: false, feedback: message });
    } finally {
      setIsLoading(false);
    }
  };

  const isTaskDone = feedback?.isCorrect ?? false;
  
  const renderAudioRecorder = () => (
    <div className="flex flex-col items-center gap-4">
        {!isRecording && !audioUrl && (
            <button type="button" onClick={startRecording} disabled={disabled} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                <MicrophoneIcon className="w-6 h-6" /> Bắt đầu ghi âm
            </button>
        )}
        {isRecording && (
            <button type="button" onClick={stopRecording} disabled={disabled} className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-full font-semibold animate-pulse disabled:bg-gray-400 disabled:cursor-not-allowed">
                <div className="w-4 h-4 bg-white rounded-full"></div> Dừng ghi âm
            </button>
        )}
        {audioUrl && !isRecording && (
            <div className="w-full flex flex-col items-center gap-4">
                <audio src={audioUrl} controls className="w-full" />
                <button type="button" onClick={startRecording} disabled={disabled} className="text-blue-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed">
                    Ghi lại
                </button>
            </div>
        )}
    </div>
  );


  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-500">
      <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6">{task.description}</p>
      
      {!isTaskDone && (
        <form onSubmit={handleSubmit}>
          {task.type === TaskType.TEXT && (
            <textarea
              value={textAnswer}
              onChange={(e) => {
                setTextAnswer(e.target.value);
                setFeedback(null);
              }}
              placeholder="Nhập câu trả lời của bạn ở đây..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              rows={3}
              disabled={isLoading || disabled}
            />
          )}

          {task.type === TaskType.IMAGE && (
            <div className="flex flex-col items-center">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                disabled={isLoading || disabled}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || disabled}
                className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200 cursor-pointer text-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Xem trước" className="max-h-48 rounded-lg object-contain" />
                ) : (
                  <>
                    <CameraIcon className="w-12 h-12 mb-2" />
                    <span className="font-semibold">Chụp hoặc Tải ảnh lên</span>
                  </>
                )}
              </button>
            </div>
          )}

          {task.type === TaskType.AUDIO && renderAudioRecorder()}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                  type="button"
                  onClick={handleGetHint}
                  disabled={isLoading || disabled}
                  className="w-full flex items-center justify-center bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                  Gợi ý / Hỗ trợ
              </button>
              <button
                  type="button"
                  onClick={onSkip}
                  disabled={isLoading || disabled}
                  className="w-full flex items-center justify-center bg-gray-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                  Bỏ qua nhiệm vụ
              </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || disabled || (task.type === TaskType.TEXT && !textAnswer) || (task.type === TaskType.IMAGE && !imageAnswer) || (task.type === TaskType.AUDIO && !audioBlob)}
            className="mt-4 w-full flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang kiểm tra...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 mr-2"/>
                Gửi câu trả lời
              </>
            )}
          </button>
        </form>
      )}

      {feedback && !feedback.isCorrect && (
        <div className={`mt-4 p-4 rounded-lg text-center font-medium transition-all bg-red-100 text-red-800`}>
          {feedback.feedback}
        </div>
      )}

      {hint && (
          <div className="mt-4 p-4 rounded-lg bg-blue-100 text-blue-800">
              <strong className="font-semibold">Gợi ý:</strong> {hint}
          </div>
      )}
    </div>
  );
};

export default QuestTask;
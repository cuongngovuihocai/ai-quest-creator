import React, { useState } from 'react';
import type { Quest, Task } from '../types';
import { generateSingleTask } from '../services/geminiService';
import ArrowPathIcon from './icons/ArrowPathIcon';
import ClockIcon from './icons/ClockIcon';

interface QuestContext {
    topic: string;
    location: string;
    objective: string;
}

interface TeacherReviewViewProps {
  apiKey: string;
  draftQuest: Quest;
  questContext: QuestContext;
  onFinalize: (quest: Quest) => void;
  onCancel: () => void;
}

const TeacherReviewView: React.FC<TeacherReviewViewProps> = ({ apiKey, draftQuest, questContext, onFinalize, onCancel }) => {
    const [editableQuest, setEditableQuest] = useState<Quest>(draftQuest);
    const [regeneratingTaskId, setRegeneratingTaskId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // State for timer
    const [useTimer, setUseTimer] = useState(draftQuest.suggestedTimeInSeconds ? 'suggested' : 'unlimited'); // 'suggested', 'custom', 'unlimited'
    const [customMinutes, setCustomMinutes] = useState(draftQuest.suggestedTimeInSeconds ? Math.ceil(draftQuest.suggestedTimeInSeconds / 60).toString() : '10');


    const handleTaskChange = (taskId: number, field: keyof Task, value: string) => {
        setEditableQuest(prevQuest => ({
            ...prevQuest,
            tasks: prevQuest.tasks.map(task => 
                task.id === taskId ? { ...task, [field]: value } : task
            )
        }));
    };

    const handleRegenerate = async (taskToReplace: Task) => {
        setRegeneratingTaskId(taskToReplace.id);
        setError(null);
        try {
            const existingTasks = editableQuest.tasks.filter(t => t.id !== taskToReplace.id);
            const newTaskData = await generateSingleTask(apiKey, questContext, existingTasks);

            setEditableQuest(prevQuest => ({
                ...prevQuest,
                tasks: prevQuest.tasks.map(t => 
                    t.id === taskToReplace.id ? { ...newTaskData, id: t.id } : t
                )
            }));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Đã có lỗi không xác định xảy ra';
            setError(message);
        } finally {
            setRegeneratingTaskId(null);
        }
    };
    
    const handleFinalize = () => {
        let finalTimeLimit: number | undefined = undefined;
        if (useTimer === 'suggested') {
            finalTimeLimit = editableQuest.suggestedTimeInSeconds;
        } else if (useTimer === 'custom') {
            const minutes = parseInt(customMinutes, 10);
            if (!isNaN(minutes) && minutes > 0) {
                finalTimeLimit = minutes * 60;
            }
        }
        
        onFinalize({
            ...editableQuest,
            timeLimitInSeconds: finalTimeLimit,
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Xem lại & Phê duyệt Nhiệm vụ</h1>
                <p className="text-lg text-gray-600 mt-2">Kiểm tra lại các nhiệm vụ do AI tạo. Bạn có thể chỉnh sửa hoặc yêu cầu làm lại.</p>
            </div>

            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <ClockIcon className="w-6 h-6 mr-2 text-blue-600" />
                    Cài đặt Thời gian
                </h3>
                {draftQuest.suggestedTimeInSeconds && (
                    <p className="mb-4 text-gray-600">AI đề xuất: <span className="font-bold">{Math.ceil(draftQuest.suggestedTimeInSeconds / 60)} phút</span> để hoàn thành nhiệm vụ này.</p>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                    <label className="flex items-center p-3 border rounded-md cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-500">
                        <input type="radio" name="timer-option" value="suggested" checked={useTimer === 'suggested'} onChange={() => setUseTimer('suggested')} className="mr-2" disabled={!draftQuest.suggestedTimeInSeconds} />
                        Dùng thời gian đề xuất
                    </label>
                    <label className="flex items-center p-3 border rounded-md cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-500">
                        <input type="radio" name="timer-option" value="custom" checked={useTimer === 'custom'} onChange={() => setUseTimer('custom')} className="mr-2" />
                        Tùy chỉnh
                    </label>
                    <label className="flex items-center p-3 border rounded-md cursor-pointer has-[:checked]:bg-blue-100 has-[:checked]:border-blue-500">
                        <input type="radio" name="timer-option" value="unlimited" checked={useTimer === 'unlimited'} onChange={() => setUseTimer('unlimited')} className="mr-2" />
                        Không giới hạn
                    </label>
                </div>
                {useTimer === 'custom' && (
                    <div className="mt-4 flex items-center gap-2">
                        <input 
                            type="number" 
                            value={customMinutes} 
                            onChange={(e) => setCustomMinutes(e.target.value)} 
                            className="w-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" 
                            min="1"
                        />
                        <span>phút</span>
                    </div>
                )}
            </div>


            <div className="space-y-6">
                {editableQuest.tasks.map((task, index) => (
                    <div key={task.id} className="p-6 bg-gray-50 rounded-lg border border-gray-200 relative">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Nhiệm vụ {index + 1} ({task.type})</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Thử thách:</label>
                                <textarea
                                    value={task.description}
                                    onChange={(e) => handleTaskChange(task.id, 'description', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gợi ý:</label>
                                <textarea
                                    value={task.hint || ''}
                                    onChange={(e) => handleTaskChange(task.id, 'hint', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Đáp án / Tiêu chí chấm điểm:</label>
                                <textarea
                                    value={task.validationPrompt}
                                    onChange={(e) => handleTaskChange(task.id, 'validationPrompt', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm bg-gray-100 focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => handleRegenerate(task)}
                            disabled={regeneratingTaskId !== null}
                            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition disabled:bg-gray-200 disabled:cursor-not-allowed"
                        >
                            {regeneratingTaskId === task.id ? (
                                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <ArrowPathIcon className="w-5 h-5"/>
                            )}
                            <span>Làm lại</span>
                        </button>
                    </div>
                ))}
            </div>

            {error && <p className="mt-6 text-red-600 text-center bg-red-100 p-3 rounded-lg">{error}</p>}
            
            <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4">
                <button
                    onClick={onCancel}
                    className="w-full sm:w-auto px-8 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition"
                >
                    Huỷ
                </button>
                <button
                    onClick={handleFinalize}
                    className="w-full sm:w-auto px-8 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition"
                >
                    Phê duyệt & Bắt đầu
                </button>
            </div>
        </div>
    );
};

export default TeacherReviewView;
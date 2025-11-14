import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Quest, ValidationResult } from '../types';
import QuestTask from './QuestTask';
import BookOpenIcon from './icons/BookOpenIcon';
import ClockIcon from './icons/ClockIcon';
import Confetti from './Confetti';
import Avatar1Icon from './icons/Avatar1Icon';
import Avatar2Icon from './icons/Avatar2Icon';
import Avatar3Icon from './icons/Avatar3Icon';
import Avatar4Icon from './icons/Avatar4Icon';

interface StudentViewProps {
  apiKey: string;
  quest: Quest;
  onReset: () => void;
}

type TaskStatus = 'pending' | 'completed';
type ViewState = 'onboarding' | 'in_quest' | 'task_complete' | 'quest_finished' | 'time_up';

const avatars = [
    { id: 1, Icon: Avatar1Icon },
    { id: 2, Icon: Avatar2Icon },
    { id: 3, Icon: Avatar3Icon },
    { id: 4, Icon: Avatar4Icon },
];

const genericCongratulations = [
    "Làm tốt lắm!",
    "Tuyệt vời!",
    "Xuất sắc!",
    "Bạn thật thông minh!",
    "Cứ thế phát huy nhé!",
    "Một nhiệm vụ nữa đã được giải quyết!",
];

const StudentView: React.FC<StudentViewProps> = ({ apiKey, quest, onReset }) => {
  const [viewState, setViewState] = useState<ViewState>('onboarding');
  const [studentName, setStudentName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<number | null>(null);

  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>(() => Array(quest.tasks.length).fill('pending'));
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [congratsMessage, setCongratsMessage] = useState('');

  // Timer state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const formatTime = useCallback((totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);
  
  const isQuestFinished = useMemo(() => !taskStatuses.includes('pending'), [taskStatuses]);

  useEffect(() => {
    if (viewState !== 'in_quest' || isQuestFinished || isTimeUp) return;

    if (!startTime) {
        setStartTime(Date.now());
    }
    
    const timer = setInterval(() => {
        const now = Date.now();
        const start = startTime || now;
        const elapsed = Math.floor((now - start) / 1000);
        setElapsedTime(elapsed);

        if (quest.timeLimitInSeconds) {
            const timeLeft = quest.timeLimitInSeconds - elapsed;
            if (timeLeft <= 0) {
                setIsTimeUp(true);
                setViewState('time_up');
                clearInterval(timer);
            }
        }
    }, 1000);

    return () => clearInterval(timer);
  }, [viewState, isQuestFinished, quest.timeLimitInSeconds, startTime, isTimeUp]);


  const timeDisplay = useMemo(() => {
    if (viewState !== 'in_quest') return null;
    if (quest.timeLimitInSeconds) {
        const timeLeft = quest.timeLimitInSeconds - elapsedTime;
        return {
            label: "Thời gian còn lại",
            time: formatTime(timeLeft > 0 ? timeLeft : 0),
            isCountdown: true,
            isEnding: timeLeft <= 60 && timeLeft > 0
        };
    } else {
        return {
            label: "Tổng thời gian",
            time: formatTime(elapsedTime),
            isCountdown: false,
            isEnding: false,
        };
    }
  }, [viewState, elapsedTime, quest.timeLimitInSeconds, formatTime]);


  const findNextPendingTask = (startIndex: number): number => {
    for (let i = 1; i < taskStatuses.length; i++) {
        const checkIndex = (startIndex + i) % taskStatuses.length;
        if (taskStatuses[checkIndex] === 'pending') {
            return checkIndex;
        }
    }
    return taskStatuses.findIndex(status => status === 'pending');
  };

  const handleTaskComplete = (feedback: ValidationResult) => {
    const randomMessage = genericCongratulations[Math.floor(Math.random() * genericCongratulations.length)];
    setCongratsMessage(randomMessage);

    const newStatuses = [...taskStatuses];
    newStatuses[activeTaskIndex] = 'completed';
    setTaskStatuses(newStatuses);
    
    if (!newStatuses.includes('pending')) {
        setViewState('quest_finished');
    } else {
        setViewState('task_complete');
    }
  };

  const handleGoToNextTask = () => {
    const nextPendingIndex = findNextPendingTask(activeTaskIndex);
    if (nextPendingIndex !== -1) {
        setActiveTaskIndex(nextPendingIndex);
    }
    setViewState('in_quest');
  };


  const handleSkip = () => {
    const nextPendingIndex = findNextPendingTask(activeTaskIndex);
    if (nextPendingIndex !== -1) {
      setActiveTaskIndex(nextPendingIndex);
    }
  };
  
  const currentTask = quest.tasks[activeTaskIndex];

  // Render Onboarding View
  if (viewState === 'onboarding') {
    const SelectedAvatarIcon = avatars.find(a => a.id === selectedAvatarId)?.Icon;
    return (
        <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-200 text-center animate-fade-in-up">
            {SelectedAvatarIcon ? 
                <SelectedAvatarIcon className="w-24 h-24 mx-auto text-blue-500 mb-4" /> :
                <BookOpenIcon className="w-24 h-24 mx-auto text-blue-500 mb-4" />
            }
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{quest.title}</h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">{quest.story}</p>
            
            <div className="space-y-4 mb-6 max-w-sm mx-auto">
                <input 
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Nhập tên của bạn..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-center text-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-4 gap-4">
                    {avatars.map(avatar => (
                        <button key={avatar.id} onClick={() => setSelectedAvatarId(avatar.id)} className={`p-2 rounded-full transition-all duration-200 ${selectedAvatarId === avatar.id ? 'bg-blue-500 scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}>
                           <avatar.Icon className="w-full h-full text-gray-600" />
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={() => setViewState('in_quest')}
                disabled={!studentName || !selectedAvatarId}
                className="bg-green-500 text-white font-bold py-3 px-8 rounded-full hover:bg-green-600 transition duration-300 text-lg shadow-lg transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
            >
                Bắt đầu cuộc phiêu lưu!
            </button>
        </div>
    )
  }

  // Render Time's Up View
  if (viewState === 'time_up') {
    const completedCount = taskStatuses.filter(s => s === 'completed').length;
    const totalCount = quest.tasks.length;
    return (
        <div className="w-full max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-200 text-center animate-fade-in-up">
            <ClockIcon className="w-24 h-24 mx-auto text-red-500 mb-4" />
            <h2 className="text-3xl font-bold text-red-600 mb-4">Hết giờ rồi!</h2>
            <p className="text-xl text-gray-700 mb-6">
                <span className="font-bold">{studentName}</span> ơi, đừng buồn nhé! Bạn đã làm rất tốt và hoàn thành được {completedCount} trên {totalCount} nhiệm vụ.
            </p>
            <p className="text-lg text-gray-600 mb-8">Hãy nghỉ ngơi một chút và thử lại sau nhé!</p>
            <button
                onClick={onReset}
                className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition duration-300 text-lg shadow-lg transform hover:scale-105"
            >
                Tạo nhiệm vụ mới
            </button>
        </div>
    )
  }

  // Render Task Complete View
  if (viewState === 'task_complete') {
    return (
        <div className="w-full max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-200 text-center animate-fade-in-up relative overflow-hidden">
            <Confetti />
            <h2 className="text-3xl font-bold text-green-600 mb-4">{congratsMessage}</h2>
            <p className="text-xl text-gray-700 mb-6">Bạn đã hoàn thành một nhiệm vụ!</p>
            <button
                onClick={handleGoToNextTask}
                className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition duration-300 text-lg shadow-lg transform hover:scale-105"
            >
                Nhiệm vụ Tiếp theo
            </button>
        </div>
    )
  }

  // Render Quest Finished View
  if (viewState === 'quest_finished') {
     return (
        <div className="p-8 bg-white rounded-2xl shadow-xl text-center border border-gray-200 animate-fade-in-up relative overflow-hidden">
          <Confetti />
          <h3 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            Chúc mừng!
          </h3>
          <p className="text-2xl text-gray-700 mb-6">
            <span className="font-bold">{studentName}</span>, bạn đã hoàn thành xuất sắc cuộc phiêu lưu "{quest.title}"!
          </p>
          <div className="mb-6 flex items-center justify-center gap-2 text-lg text-gray-600">
              <ClockIcon className="w-6 h-6"/>
              <span>Hoàn thành trong:</span>
              <span className="font-bold">{formatTime(elapsedTime)}</span>
          </div>
          <button 
            onClick={onReset}
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition duration-300 shadow-lg transform hover:scale-105"
          >
            Tạo nhiệm vụ mới
          </button>
        </div>
     )
  }


  // Render Main Quest View
  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <div className="flex flex-col items-center">
            {timeDisplay && (
                <div className={`flex items-center gap-2 p-2 px-4 rounded-full mb-4 ${timeDisplay.isEnding && !isTimeUp ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
                    <ClockIcon className="w-6 h-6" />
                    <span className="font-medium">{timeDisplay.label}:</span>
                    <span className="font-bold text-lg tabular-nums">{timeDisplay.time}</span>
                </div>
            )}
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">{quest.title}</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-2 p-2 bg-gray-100 rounded-full">
            {quest.tasks.map((task, index) => {
                const status = taskStatuses[index];
                let bgColor = 'bg-white hover:bg-gray-200';
                let textColor = 'text-gray-600';
                if (status === 'completed') {
                    bgColor = 'bg-green-500';
                    textColor = 'text-white';
                } else if (index === activeTaskIndex) {
                    bgColor = 'bg-blue-500';
                    textColor = 'text-white';
                }

                return (
                    <button 
                        key={task.id} 
                        onClick={() => setActiveTaskIndex(index)}
                        disabled={status === 'completed' || isTimeUp}
                        className={`w-10 h-10 flex items-center justify-center font-bold rounded-full transition-colors duration-300 shadow-md ${bgColor} ${textColor} disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                        {index + 1}
                    </button>
                );
            })}
        </div>
      </div>
      
        <QuestTask
          apiKey={apiKey}
          key={currentTask.id}
          task={currentTask}
          onTaskComplete={handleTaskComplete}
          onSkip={handleSkip}
          disabled={isTimeUp}
        />
    </div>
  );
};

export default StudentView;
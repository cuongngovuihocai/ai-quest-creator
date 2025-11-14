import React, { useState } from 'react';
import TeacherDashboard from './components/TeacherDashboard';
import StudentView from './components/StudentView';
import TeacherReviewView from './components/TeacherReviewView';
import type { Quest } from './types';

interface QuestContext {
  topic: string;
  location: string;
  objective: string;
}

function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [draftQuest, setDraftQuest] = useState<Quest | null>(null);
  const [questContext, setQuestContext] = useState<QuestContext | null>(null);

  const handleQuestDrafted = (draft: Quest, context: QuestContext, key: string) => {
    setDraftQuest(draft);
    setQuestContext(context);
    setApiKey(key);
    setQuest(null); 
  };
  
  const handleQuestFinalized = (finalQuest: Quest) => {
    setQuest(finalQuest);
    setDraftQuest(null);
    setQuestContext(null);
  }

  const handleReset = () => {
    setQuest(null);
    setDraftQuest(null);
    setQuestContext(null);
    // We keep the apiKey so the teacher doesn't have to re-enter it.
  };
  
  const renderContent = () => {
    if (quest && apiKey) {
        return <StudentView quest={quest} onReset={handleReset} apiKey={apiKey} />;
    }
    if (draftQuest && questContext && apiKey) {
        return <TeacherReviewView 
            draftQuest={draftQuest} 
            questContext={questContext}
            onFinalize={handleQuestFinalized}
            onCancel={handleReset}
            apiKey={apiKey}
        />
    }
    // Pass the existing API key back down so the user doesn't have to re-enter it if they cancel a review.
    return <TeacherDashboard onQuestDrafted={handleQuestDrafted} existingApiKey={apiKey || ''} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans antialiased">
      <main className="w-full">
        {renderContent()}
      </main>
      <footer className="text-center mt-8 text-gray-500 text-sm">
        <p>Powered by Google Gemini API. Created for educational purposes.</p>
      </footer>
    </div>
  );
}

export default App;
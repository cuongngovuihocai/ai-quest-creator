import React, { useState, useEffect } from 'react';
import { generateQuest } from '../services/geminiService';
import type { Quest } from '../types';
import SparklesIcon from './icons/SparklesIcon';

interface QuestContext {
    topic: string;
    location: string;
    objective: string;
}

interface TeacherDashboardProps {
  onQuestDrafted: (quest: Quest, context: QuestContext, apiKey: string) => void;
  existingApiKey: string;
}

const mathTopics = [
    // Tập 1
    "Bài 1: Tập hợp. Phần tử của tập hợp",
    "Bài 2: Cách ghi số tự nhiên",
    "Bài 3: Thứ tự trong tập hợp các số tự nhiên",
    "Bài 4: Phép cộng và phép trừ số tự nhiên",
    "Bài 5: Phép nhân và phép chia số tự nhiên",
    "Bài 6: Lũy thừa với số mũ tự nhiên",
    "Bài 7: Thứ tự thực hiện các phép tính",
    "Bài 8: Quan hệ chia hết và tính chất",
    "Bài 9: Dấu hiệu chia hết",
    "Bài 10: Số nguyên tố",
    "Bài 11: Ước chung và ước chung lớn nhất",
    "Bài 12: Bội chung và bội chung nhỏ nhất",
    "Bài 13: Tập hợp các số nguyên",
    "Bài 14: Thứ tự trong tập hợp các số nguyên",
    "Bài 15: Phép cộng và phép trừ số nguyên",
    "Bài 16: Phép nhân và phép chia hết hai số nguyên",
    "Bài 17: Hình tam giác đều. Hình vuông. Hình lục giác đều",
    "Bài 18: Hình chữ nhật. Hình thoi",
    "Bài 19: Hình bình hành. Hình thang cân",
    "Bài 20: Chu vi và diện tích của một số tứ giác đã học",
    "Bài 21: Hình có trục đối xứng",
    "Bài 22: Hình có tâm đối xứng",
    // Tập 2
    "Bài 23: Mở rộng khái niệm phân số",
    "Bài 24: So sánh phân số. Hỗn số dương",
    "Bài 25: Phép cộng và phép trừ phân số",
    "Bài 26: Phép nhân và phép chia phân số",
    "Bài 27: Hai bài toán về phân số",
    "Bài 28: Số thập phân",
    "Bài 29: So sánh hai số thập phân",
    "Bài 30: Làm tròn và ước lượng",
    "Bài 31: Phép cộng và phép trừ số thập phân",
    "Bài 32: Phép nhân và phép chia số thập phân",
    "Bài 33: Tỉ số. Tỉ số phần trăm",
    "Bài 34: Hai bài toán về tỉ số phần trăm",
    "Bài 35: Điểm và đường thẳng",
    "Bài 36: Góc",
    "Bài 37: Số đo góc",
    "Bài 38: Dữ liệu và thu thập dữ liệu",
    "Bài 39: Bảng thống kê và biểu đồ tranh",
    "Bài 40: Biểu đồ cột, biểu đồ cột kép",
    "Bài 41: Mô hình xác suất trong một số trò chơi và thí nghiệm đơn giản",
    "Bài 42: Kết quả có thể và sự kiện trong trò chơi, thí nghiệm",
    "Bài 43: Xác suất thực nghiệm",
];

const locations = [
    "Trong lớp học",
    "Ngoài sân trường",
    "Thư viện",
    "Sân thể chất",
    "Cầu thang",
    "Nhà ăn",
    "Cổng trường",
    "Vườn trường",
];

const objectivesData: { [key: string]: string[] } = {
    "Bài 1: Tập hợp. Phần tử của tập hợp": ["Nhận biết tập hợp và các phần tử", "Mô tả tập hợp bằng cách liệt kê hoặc chỉ ra tính chất đặc trưng", "Sử dụng đúng kí hiệu ∈, ∉"],
    "Bài 2: Cách ghi số tự nhiên": ["Đọc và viết số tự nhiên trong hệ thập phân", "Phân biệt số và chữ số", "Biểu diễn số tự nhiên thành tổng giá trị các chữ số"],
    "Bài 3: Thứ tự trong tập hợp các số tự nhiên": ["So sánh hai số tự nhiên", "Sắp xếp các số tự nhiên theo thứ tự", "Sử dụng đúng các kí hiệu <, >, ≤, ≥"],
    "Bài 4: Phép cộng và phép trừ số tự nhiên": ["Thực hiện thành thạo phép cộng và trừ", "Áp dụng tính chất giao hoán, kết hợp để tính nhanh", "Giải toán thực tế về phép cộng, trừ"],
    "Bài 5: Phép nhân và phép chia số tự nhiên": ["Thực hiện thành thạo phép nhân và chia", "Áp dụng tính chất phân phối để tính nhanh", "Giải toán thực tế về phép nhân, chia"],
    "Bài 6: Lũy thừa với số mũ tự nhiên": ["Hiểu khái niệm lũy thừa, cơ số, số mũ", "Thực hiện phép tính nâng lên lũy thừa", "Áp dụng các quy tắc nhân, chia hai lũy thừa cùng cơ số"],
    "Bài 7: Thứ tự thực hiện các phép tính": ["Nắm vững quy tắc về thứ tự thực hiện các phép tính", "Vận dụng quy tắc để tính đúng giá trị biểu thức", "Giải quyết các bài toán thực tế cần áp dụng thứ tự phép tính"],
    "Bài 8: Quan hệ chia hết và tính chất": ["Hiểu khái niệm chia hết, ước và bội", "Áp dụng các tính chất chia hết của một tổng"],
    "Bài 9: Dấu hiệu chia hết": ["Nhận biết dấu hiệu chia hết cho 2, 5, 3, 9", "Vận dụng dấu hiệu chia hết để giải toán"],
    "Bài 10: Số nguyên tố": ["Phân biệt số nguyên tố và hợp số", "Phân tích một số ra thừa số nguyên tố"],
    "Bài 11: Ước chung và ước chung lớn nhất": ["Tìm ước chung và ƯCLN của hai hay nhiều số", "Giải các bài toán thực tế liên quan đến ƯCLN"],
    "Bài 12: Bội chung và bội chung nhỏ nhất": ["Tìm bội chung và BCNN của hai hay nhiều số", "Giải các bài toán thực tế liên quan đến BCNN"],
    "Bài 13: Tập hợp các số nguyên": ["Nhận biết số nguyên âm, tập hợp số nguyên", "Biểu diễn số nguyên trên trục số", "Tìm số đối của một số nguyên"],
    "Bài 14: Thứ tự trong tập hợp các số nguyên": ["So sánh hai số nguyên", "Sắp xếp các số nguyên theo thứ tự"],
    "Bài 15: Phép cộng và phép trừ số nguyên": ["Thực hiện thành thạo phép cộng, trừ số nguyên", "Áp dụng các quy tắc và tính chất để tính toán"],
    "Bài 16: Phép nhân và phép chia hết hai số nguyên": ["Thực hiện thành thạo phép nhân, chia hai số nguyên", "Vận dụng tính chất phân phối để tính nhanh"],
    "Bài 17: Hình tam giác đều. Hình vuông. Hình lục giác đều": ["Nhận dạng các hình tam giác đều, hình vuông, hình lục giác đều", "Mô tả các yếu tố cơ bản (cạnh, góc, đường chéo) của các hình"],
    "Bài 18: Hình chữ nhật. Hình thoi": ["Nhận dạng hình chữ nhật, hình thoi", "Vẽ được hình chữ nhật, hình thoi bằng dụng cụ học tập"],
    "Bài 19: Hình bình hành. Hình thang cân": ["Nhận dạng hình bình hành, hình thang cân", "Mô tả các yếu tố cơ bản của các hình này"],
    "Bài 20: Chu vi và diện tích của một số tứ giác đã học": ["Tính chu vi và diện tích hình vuông, chữ nhật, thoi, bình hành", "Giải các bài toán thực tế liên quan đến chu vi, diện tích"],
    "Bài 21: Hình có trục đối xứng": ["Nhận biết trục đối xứng của một hình phẳng", "Tìm các vật thể có trục đối xứng trong thực tế"],
    "Bài 22: Hình có tâm đối xứng": ["Nhận biết tâm đối xứng của một hình phẳng", "Tìm các vật thể có tâm đối xứng trong thực tế"],
    "Bài 23: Mở rộng khái niệm phân số": ["Hiểu khái niệm phân số với tử và mẫu là số nguyên", "Tìm phân số bằng nhau"],
    "Bài 24: So sánh phân số. Hỗn số dương": ["So sánh hai phân số", "Viết phân số dưới dạng hỗn số và ngược lại"],
    "Bài 25: Phép cộng và phép trừ phân số": ["Thực hiện thành thạo phép cộng, trừ phân số", "Áp dụng các tính chất để tính nhanh"],
    "Bài 26: Phép nhân và phép chia phân số": ["Thực hiện thành thạo phép nhân, chia phân số", "Áp dụng các tính chất để tính hợp lí"],
    "Bài 27: Hai bài toán về phân số": ["Giải bài toán tìm giá trị phân số của một số cho trước", "Giải bài toán tìm một số khi biết giá trị phân số của nó"],
    "Bài 28: Số thập phân": ["Nhận biết và đọc, viết số thập phân", "Biểu diễn phân số thập phân dưới dạng số thập phân"],
    "Bài 29: So sánh hai số thập phân": ["So sánh hai số thập phân (dương và âm)", "Sắp xếp các số thập phân theo thứ tự"],
    "Bài 30: Làm tròn và ước lượng": ["Làm tròn số thập phân đến một hàng cho trước", "Ước lượng kết quả các phép tính"],
    "Bài 31: Phép cộng và phép trừ số thập phân": ["Thực hiện thành thạo phép cộng và trừ số thập phân", "Giải các bài toán thực tế liên quan"],
    "Bài 32: Phép nhân và phép chia số thập phân": ["Thực hiện thành thạo phép nhân và chia số thập phân", "Giải các bài toán thực tế liên quan"],
    "Bài 33: Tỉ số. Tỉ số phần trăm": ["Hiểu khái niệm tỉ số và tỉ số phần trăm", "Tính tỉ số và tỉ số phần trăm của hai đại lượng"],
    "Bài 34: Hai bài toán về tỉ số phần trăm": ["Giải bài toán tìm giá trị phần trăm của một số", "Giải bài toán tìm một số khi biết giá trị phần trăm của nó"],
    "Bài 35: Điểm và đường thẳng": ["Nhận biết điểm, đường thẳng, tia", "Hiểu quan hệ điểm thuộc/không thuộc đường thẳng", "Nhận biết ba điểm thẳng hàng"],
    "Bài 36: Góc": ["Nhận biết khái niệm góc, đỉnh, cạnh của góc", "Nhận biết góc bẹt"],
    "Bài 37: Số đo góc": ["Sử dụng thước đo góc để đo góc", "So sánh hai góc dựa vào số đo", "Nhận biết góc vuông, nhọn, tù"],
    "Bài 38: Dữ liệu và thu thập dữ liệu": ["Phân loại dữ liệu (số liệu, không phải số liệu)", "Thu thập và tổ chức dữ liệu"],
    "Bài 39: Bảng thống kê và biểu đồ tranh": ["Đọc và mô tả dữ liệu từ bảng thống kê, biểu đồ tranh", "Biểu diễn dữ liệu vào bảng và biểu đồ tranh"],
    "Bài 40: Biểu đồ cột, biểu đồ cột kép": ["Đọc và phân tích dữ liệu từ biểu đồ cột và cột kép", "Vẽ biểu đồ cột và cột kép"],
    "Bài 41: Mô hình xác suất trong một số trò chơi và thí nghiệm đơn giản": ["Làm quen với các kết quả có thể xảy ra của một thí nghiệm", "Mô tả các kết quả có thể"],
    "Bài 42: Kết quả có thể và sự kiện trong trò chơi, thí nghiệm": ["Phân biệt kết quả có thể và sự kiện", "Kiểm đếm số kết quả thuận lợi cho một sự kiện"],
    "Bài 43: Xác suất thực nghiệm": ["Tính xác suất thực nghiệm của một sự kiện", "Sử dụng xác suất thực nghiệm để dự đoán"],
};


const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onQuestDrafted, existingApiKey }) => {
  const [apiKey, setApiKey] = useState(existingApiKey);
  const [topic, setTopic] = useState(mathTopics[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [location, setLocation] = useState(locations[1]);
  const [customLocation, setCustomLocation] = useState('');
  const [selectedObjective, setSelectedObjective] = useState('');
  const [customObjective, setCustomObjective] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isOtherTopic = topic === 'Other';
  const currentObjectives = isOtherTopic ? [] : objectivesData[topic] || [];

  useEffect(() => {
    if (isOtherTopic) {
        setSelectedObjective('Other');
    } else {
        if (currentObjectives.length > 0) {
            setSelectedObjective(currentObjectives[0]);
        } else {
            setSelectedObjective('');
        }
    }
    // Reset custom objective when topic changes
    setCustomObjective('');
  }, [topic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
        setError("Vui lòng nhập Gemini API Key của bạn.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const finalTopic = isOtherTopic ? customTopic : topic;
      const finalLocation = location === 'Other' ? customLocation : location;
      const finalObjective = (isOtherTopic || selectedObjective === 'Other') ? customObjective : selectedObjective;
      
      const context: QuestContext = { topic: finalTopic, location: finalLocation, objective: finalObjective };

      if (!finalTopic) {
        setError("Vui lòng nhập hoặc chọn chủ đề.");
        setIsLoading(false);
        return;
      }
      if (!finalLocation) {
        setError("Vui lòng nhập hoặc chọn địa điểm.");
        setIsLoading(false);
        return;
      }
       if (!finalObjective) {
        setError("Vui lòng chọn hoặc nhập mục tiêu học tập.");
        setIsLoading(false);
        return;
      }
      const newQuest = await generateQuest(apiKey, finalTopic, finalLocation, finalObjective);
      onQuestDrafted(newQuest, context, apiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi không xác định xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const isOtherLocation = location === 'Other';
  const isOtherObjective = selectedObjective === 'Other';

  return (
    <div className="w-full max-w-3xl mx-auto p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
      <div className="text-center mb-8">
        <SparklesIcon className="w-16 h-16 mx-auto text-blue-500 mb-3" />
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Trình tạo Nhiệm vụ AI</h1>
        <p className="text-lg text-gray-600 mt-2">Biến lớp học thành cuộc phiêu lưu kỳ thú!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
                Gemini API Key
            </label>
            <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Dán API Key của bạn vào đây"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
             <p className="mt-1 text-xs text-gray-500">
                Bạn có thể lấy API key tại{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Google AI Studio
                </a>.
            </p>
        </div>

        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
            1. Chủ đề bài học
          </label>
          <select
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-white"
            required
          >
            {mathTopics.map((topicName) => (
                <option key={topicName} value={topicName}>{topicName}</option>
            ))}
            <option value="Other">Khác...</option>
          </select>
          {isOtherTopic && (
            <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Nhập chủ đề bài học"
                className="mt-2 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                required
            />
          )}
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            2. Bối cảnh (Địa điểm)
          </label>
          <select
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-white"
            required
          >
            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            <option value="Other">Khác...</option>
          </select>
          {isOtherLocation && (
            <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Nhập địa điểm của bạn"
                className="mt-2 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                required
            />
          )}
        </div>

        <div>
          <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-1">
            3. Mục tiêu
          </label>
          {!isOtherTopic && (
            <select
                id="objective"
                value={selectedObjective}
                onChange={(e) => setSelectedObjective(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-white"
                required
                disabled={currentObjectives.length === 0}
            >
                {currentObjectives.length > 0 ? (
                    currentObjectives.map(obj => <option key={obj} value={obj}>{obj}</option>)
                ) : (
                    <option value="" disabled>Vui lòng chọn chủ đề bài học trước</option>
                )}
                <option value="Other">Khác...</option>
            </select>
          )}

          {(isOtherObjective || isOtherTopic) && (
             <textarea
                value={customObjective}
                onChange={(e) => setCustomObjective(e.target.value)}
                placeholder="Nhập mục tiêu của bạn"
                className="mt-2 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                required
                rows={2}
            />
          )}
        </div>

        {error && <p className="text-red-600 text-center bg-red-100 p-3 rounded-lg">{error}</p>}

        <button
          type="submit"
          disabled={isLoading || !apiKey.trim()}
          className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-wait text-lg"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AI đang sáng tạo...
            </>
          ) : (
            'Tạo nhiệm vụ ngay!'
          )}
        </button>
      </form>
    </div>
  );
};

export default TeacherDashboard;
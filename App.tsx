
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import MicButton from './components/MicButton';
import TranscriptionBox from './components/TranscriptionBox';

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refinedText, setRefinedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recordingMimeType, setRecordingMimeType] = useState('');
  const [isHttps, setIsHttps] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Перевірка HTTPS та визначення форматів
  useEffect(() => {
    // Мікрофон працює тільки в захищеному контексті
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setIsHttps(false);
    }

    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/wav',
      'audio/mpeg'
    ];
    
    if (typeof MediaRecorder !== 'undefined') {
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          setRecordingMimeType(type);
          console.log('Using supported format:', type);
          break;
        }
      }
    } else {
      setError('Ваш браузер занадто старий або не підтримує запис голосу.');
    }
  }, []);

  const startRecording = async () => {
    setError(null);
    if (!isHttps) {
      setError('Запис голосу вимагає захищеного з’єднання (HTTPS). Будь ласка, перейдіть на https версію сайту.');
      return;
    }
    
    if (!recordingMimeType) {
      setError('Формат запису не знайдено.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: recordingMimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Запускаємо запис. 1000ms допомагає уникнути порожніх фрагментів на мобільних
      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (err: any) {
      console.error('Mic error:', err);
      setError('Не вдалося отримати доступ до мікрофона. Перевірте дозволи в налаштуваннях телефону.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recordingMimeType });
        console.log('Final Blob:', audioBlob.size, audioBlob.type);
        
        if (audioBlob.size > 1000) {
          await processAudio(audioBlob);
        } else {
          setError('Запис порожній. Спробуйте ще раз і говоріть гучніше.');
          setIsProcessing(false);
        }
      };
      
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const activeKey = process.env.API_KEY;
      
      if (!activeKey) throw new Error('API_KEY_MISSING');

      const ai = new GoogleGenAI({ apiKey: activeKey });
      
      // Мапування типів для Gemini (дуже важливо для iOS)
      let apiMimeType = recordingMimeType.split(';')[0];
      
      // Спеціальні виправлення для iPhone
      if (apiMimeType.includes('mp4') || apiMimeType.includes('aac') || apiMimeType.includes('x-m4a')) {
        apiMimeType = 'audio/mp4'; // Gemini найкраще розуміє mp4 на iOS
      } else if (apiMimeType.includes('webm')) {
        apiMimeType = 'audio/webm';
      }

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: apiMimeType, data: base64Audio } },
            { text: "Транскрибуй цей аудіозапис. Виправ граматику та пунктуацію. Виведи тільки чистий текст українською мовою." }
          ],
        },
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullText += chunk.text;
          setRefinedText(fullText);
        }
      }
      
      if (!fullText) setError('ШІ не розпізнав слів. Спробуйте ще раз.');

    } catch (err: any) {
      console.error('API Error:', err);
      if (err.status === 400) {
        setError('Помилка формату. Спробуйте оновити сторінку або скористатися Safari (для iPhone).');
      } else if (err.status === 429) {
        setError('Забагато спроб. Зачекайте хвилину.');
      } else {
        setError(`Збій: ${err.message || 'перевірте інтернет'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-red-600/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-orange-600/10 rounded-full blur-[100px]"></div>

      {!isHttps && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white p-2 text-center text-xs font-bold z-50 animate-bounce">
          УВАГА: ПОТРІБЕН HTTPS ДЛЯ РОБОТИ МІКРОФОНА
        </div>
      )}

      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
          VocalScript AI
        </h1>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em] font-bold mt-2">
          Mobile Ready • Professional Edition
        </p>
      </header>

      <main className="w-full max-w-2xl flex flex-col items-center space-y-8">
        {error && (
          <div className="w-full p-4 bg-red-950/40 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <MicButton 
          isRecording={isRecording} 
          onClick={() => isRecording ? stopRecording() : startRecording()}
          disabled={isProcessing}
        />

        {isProcessing && (
          <div className="text-orange-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
            Обробка аудіо...
          </div>
        )}

        <TranscriptionBox 
          text={refinedText} 
          onClear={() => setRefinedText('')} 
        />
      </main>

      <footer className="mt-12 text-slate-800 text-[8px] font-bold tracking-[0.5em] uppercase">
        UA Version 2.1 • Gemini Flash Engine
      </footer>
    </div>
  );
};

export default App;


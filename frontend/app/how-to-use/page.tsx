"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Camera, Tag, Truck, CheckCircle2, Volume2, ArrowLeft, VolumeX } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export default function HowToUsePage() {
  const { t, language } = useTranslation();
  const [isPlaying, setIsPlaying] = useState<number | null>(null);

  const steps = [
    {
      id: 1,
      icon: <Camera className="w-20 h-20 text-emerald-600" />,
      title: t.how_to_use.step1_title,
      desc: t.how_to_use.step1_desc,
      color: "bg-emerald-50 border-emerald-200"
    },
    {
      id: 2,
      icon: <Tag className="w-20 h-20 text-amber-500" />,
      title: t.how_to_use.step2_title,
      desc: t.how_to_use.step2_desc,
      color: "bg-amber-50 border-amber-200"
    },
    {
      id: 3,
      icon: <CheckCircle2 className="w-20 h-20 text-blue-500" />,
      title: t.how_to_use.step3_title,
      desc: t.how_to_use.step3_desc,
      color: "bg-blue-50 border-blue-200"
    },
    {
      id: 4,
      icon: <Truck className="w-20 h-20 text-purple-500" />,
      title: t.how_to_use.step4_title,
      desc: t.how_to_use.step4_desc,
      color: "bg-purple-50 border-purple-200"
    }
  ];

  const playAudio = (text: string, id: number) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech not supported in this browser.");
      return;
    }
    
    // Stop any currently playing audio
    window.speechSynthesis.cancel();
    
    if (isPlaying === id) {
      setIsPlaying(null);
      return; // Act as a toggle
    }

    setIsPlaying(id);
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language for TTS
    if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }
    
    utterance.rate = 0.85; // slightly slower for better understanding
    
    utterance.onend = () => {
      setIsPlaying(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="p-2 rounded-full hover:bg-slate-100 text-emerald-900 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-emerald-950 flex-1 text-center">
            {t.how_to_use.title}
          </h1>
          <LanguageSelector />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className={`rounded-3xl border-2 p-6 flex flex-col items-center text-center shadow-sm transition-transform hover:scale-[1.02] ${step.color}`}
          >
            <div className="bg-white p-6 rounded-full shadow-sm mb-6 inline-block">
              {step.icon}
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">{step.title}</h2>
            <p className="text-xl text-gray-700 font-medium mb-8 leading-relaxed max-w-lg">
              {step.desc}
            </p>
            
            <button
              onClick={() => playAudio(`${step.title}. ${step.desc}`, step.id)}
              className={`w-full sm:w-auto px-8 py-5 rounded-2xl flex items-center justify-center gap-3 text-xl font-bold text-white transition-colors shadow-md ${
                isPlaying === step.id 
                  ? 'bg-rose-500 hover:bg-rose-600 animate-pulse' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isPlaying === step.id ? (
                <>
                  <VolumeX className="w-8 h-8" />
                  स्टॉप (Stop)
                </>
              ) : (
                <>
                  <Volume2 className="w-8 h-8" />
                  {t.how_to_use.play_audio}
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

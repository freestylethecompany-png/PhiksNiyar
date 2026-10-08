'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, ArrowRight, Loader2, Volume2 } from 'lucide-react';
import { Language, translations } from '@/lib/i18n/translations';

interface HeroAIInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  selectedArea: string;
  currentLang?: Language;
}

export default function HeroAIInput({
  onSearch,
  isLoading,
  selectedArea,
  currentLang = 'te',
}: HeroAIInputProps) {
  const [query, setQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const t = translations[currentLang];

  // Initialize & update Speech Recognition based on language
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = false;
        reco.interimResults = false;
        reco.lang = currentLang === 'te' ? 'te-IN' : 'en-IN';

        reco.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript);
          setIsRecording(false);
          // Auto search upon voice completion
          onSearch(transcript);
        };

        reco.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsRecording(false);
          setSpeechError(
            currentLang === 'te'
              ? 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది లేదా లభించలేదు. దయచేసి సమస్యను టైప్ చేయండి.'
              : 'Microphone not available or permission denied. Please type your request.'
          );
          setTimeout(() => setSpeechError(null), 4000);
        };

        reco.onend = () => {
          setIsRecording(false);
        };

        setRecognition(reco);
      }
    }
  }, [onSearch, currentLang]);

  const toggleVoiceRecording = () => {
    if (!recognition) {
      alert(
        currentLang === 'te'
          ? 'మీ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ అందుబాటులో లేదు. దయచేసి Chrome లేదా Edge బ్రౌజర్ ఉపయోగించండి.'
          : 'Speech Recognition is not supported on this browser. Please use Chrome, Edge, or an Android browser.'
      );
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        setSpeechError(null);
        recognition.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
        setIsRecording(false);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const teluguPrompts = [
    { text: 'మా AC కూలింగ్ సరిగ్గా లేదు, ఈరోజు సాయంత్రం ఎవరైనా రాగలరా?', label: '❄️ AC కూలింగ్ రిపేర్' },
    { text: 'స్విచ్‌బోర్డులో స్పార్క్ వస్తోంది, అర్జెంట్ ఎలక్ట్రీషియన్ కావాలి', label: '⚡ ఎలక్ట్రీషియన్ / స్పార్క్' },
    { text: 'కిచెన్ సింక్ పైపు లీకేజ్, మోటార్ వాటర్ రావట్లేదు', label: '🚰 ప్లంబర్ / లీకేజ్' },
    { text: 'బైక్ పంచర్ పడింది బైపాస్ రోడ్డు దగ్గర, డోర్‌స్టెప్ మెకానిక్', label: '🏍️ బైక్ మెకానిక్' },
    { text: 'ఫ్రిజ్ ఫ్రీజర్ గడ్డకట్టట్లేదు, రిపేర్ చేయాలి', label: '🧊 ఫ్రిజ్ రిపేర్' },
  ];

  const englishPrompts = [
    { text: 'My AC is not cooling properly, need service today evening', label: '❄️ AC Cooling Issue' },
    { text: 'Switchboard spark in hall, urgent electrician needed', label: '⚡ Electrician / Spark' },
    { text: 'Tap leakage in kitchen sink, water motor problem', label: '🚰 Plumber / Tap Leak' },
    { text: 'Bike breakdown near bypass road, doorstep mechanic', label: '🏍️ Bike Breakdown' },
    { text: 'Refrigerator repair, freezer not freezing', label: '🧊 Refrigerator Repair' },
  ];

  const activePrompts = currentLang === 'te' ? teluguPrompts : englishPrompts;

  return (
    <section className="hero-section">
      <div className="container">
        {/* Market Hyperlocal Pill */}
        <div className="hero-tag">
          <Sparkles size={13} color="var(--primary)" />
          <span>
            {currentLang === 'te'
              ? `${selectedArea}, చిలకలూరిపేటలో లైవ్ AI అసిస్టెంట్`
              : `Hyperlocal AI in ${selectedArea}, Chilakaluripet`}
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="hero-title">
          {t.heroTitleMain} <br />
          <span>{t.heroTitleAccent}</span>
        </h1>

        <p className="hero-subtitle">{t.heroSubtitle}</p>

        {/* Spotlight AI Input Form */}
        <form onSubmit={handleFormSubmit}>
          <div className="ai-input-wrapper">
            <input
              type="text"
              className="ai-input-field"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              disabled={isLoading}
              aria-label="Describe your service request in English or Telugu"
            />

            {/* Voice Mic Button */}
            <button
              type="button"
              className={`mic-btn ${isRecording ? 'recording' : ''}`}
              onClick={toggleVoiceRecording}
              title={isRecording ? 'Listening... click to stop' : t.voiceTooltip}
              aria-label="Voice search with microphone"
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Search Submit Button */}
            <button type="submit" className="submit-ai-btn" disabled={isLoading || !query.trim()}>
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{t.analyzingText}</span>
                </>
              ) : (
                <>
                  <span>{t.findExpertBtn}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Dynamic Voice Recording Waveform Indicator */}
        {isRecording && (
          <div
            style={{
              marginTop: '1rem',
              color: 'var(--danger)',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              padding: '0.4rem 1rem',
              background: 'var(--danger-light)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid #fecaca',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '4px', height: '14px', background: 'var(--danger)', borderRadius: '2px', animation: 'pulse-dot 0.6s infinite alternate' }} />
              <span style={{ width: '4px', height: '20px', background: 'var(--danger)', borderRadius: '2px', animation: 'pulse-dot 0.8s infinite alternate 0.2s' }} />
              <span style={{ width: '4px', height: '10px', background: 'var(--danger)', borderRadius: '2px', animation: 'pulse-dot 0.5s infinite alternate 0.4s' }} />
            </div>
            <span>{t.voiceListening}</span>
          </div>
        )}

        {speechError && (
          <div
            style={{
              marginTop: '0.85rem',
              color: 'var(--danger)',
              fontSize: '0.825rem',
              background: 'var(--danger-light)',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              display: 'inline-block',
              border: '1px solid #fecaca',
            }}
          >
            {speechError}
          </div>
        )}

        {/* Sample Prompt Chips */}
        <div className="sample-prompts">
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {t.tryAsking}
          </span>
          {activePrompts.map((p, index) => (
            <button
              key={index}
              type="button"
              className="prompt-chip telugu"
              onClick={() => {
                setQuery(p.text);
                onSearch(p.text);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}


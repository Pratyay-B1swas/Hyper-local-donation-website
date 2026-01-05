import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { speak, playStartSound, playStopSound } from '@/lib/audio';

// Define the interfaces for the Speech Recognition API
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onend: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}

// Define the interface for the window object to include webkitSpeechRecognition
interface Window {
  SpeechRecognition: new () => ISpeechRecognition;
  webkitSpeechRecognition: new () => ISpeechRecognition;
}

declare let window: Window;

export const VoiceCommandButton: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<ISpeechRecognition | null>(null);
  const navigate = useNavigate();

  const handleCommand = useCallback((command: string) => {
    const lowerCommand = command.toLowerCase();

    // Help Command
    if (lowerCommand.includes('help') || lowerCommand.includes('what can i say') || lowerCommand.includes('commands')) {
        const helpText = "You can say: Go home, Go to profile, Go to messages, Go to my listings, I want to donate, I need help, or search for items like furniture or food.";
        speak(helpText);
        toast.info(helpText);
        return;
    }

    // General Navigation
    if (lowerCommand.includes('home') || lowerCommand.includes('go to start')) {
      navigate('/');
      const msg = "Navigating home";
      toast.success(msg);
      speak(msg);
      return;
    }
    if (lowerCommand.includes('profile')) {
      navigate('/profile');
      const msg = "Navigating to profile";
      toast.success(msg);
      speak(msg);
      return;
    }
    if (lowerCommand.includes('messages') || lowerCommand.includes('inbox')) {
      navigate('/messages');
      const msg = "Navigating to messages";
      toast.success(msg);
      speak(msg);
      return;
    }
    if (lowerCommand.includes('my listings')) {
        navigate('/my-listings');
        const msg = "Navigating to my listings";
        toast.success(msg);
        speak(msg);
        return;
    }

    // Creation Actions
    if (lowerCommand.includes('donate') && (lowerCommand.includes('want to') || lowerCommand.includes('i') || lowerCommand.includes('create'))) {
       // "I want to donate", "create donation"
       // But distinguish from "find donations"
       if (!lowerCommand.includes('find') && !lowerCommand.includes('search') && !lowerCommand.includes('show') && !lowerCommand.includes('see')) {
           navigate('/create-listing');
           const msg = "Opening donation form";
           toast.success(msg);
           speak(msg);
           return;
       }
    }

    if (lowerCommand.includes('request') && (lowerCommand.includes('want to') || lowerCommand.includes('create') || lowerCommand.includes('make') || lowerCommand.includes('need'))) {
         // "I want to request", "make a request", "I need help"
         if (!lowerCommand.includes('find') && !lowerCommand.includes('search') && !lowerCommand.includes('show') && !lowerCommand.includes('see')) {
            navigate('/create-request');
            const msg = "Opening request form";
            toast.success(msg);
            speak(msg);
            return;
         }
    }

    // Feed / Search Logic
    const categories = ['clothes', 'food', 'electronics', 'furniture', 'books', 'toys', 'medical', 'other'];
    const foundCategory = categories.find(cat => lowerCommand.includes(cat));

    // "Is there anything I can donate in the [category] category?" -> Show REQUESTS for that category
    // "Show me furniture requests"
    if ((lowerCommand.includes('can donate') || lowerCommand.includes('requests')) && foundCategory) {
        navigate(`/feed?tab=requests&category=${foundCategory}`);
        const msg = `Showing requests for ${foundCategory}`;
        toast.success(msg);
        speak(msg);
        return;
    }

    // "Show me donations", "Find furniture"
    if ((lowerCommand.includes('donations') || lowerCommand.includes('find') || lowerCommand.includes('show')) && foundCategory) {
         // Default to donations if not specified "requests"
         navigate(`/feed?tab=donations&category=${foundCategory}`);
         const msg = `Showing donations for ${foundCategory}`;
         toast.success(msg);
         speak(msg);
         return;
    }

    // Explicit tab navigation without category
    if (lowerCommand.includes('show requests') || lowerCommand.includes('see requests')) {
        navigate('/feed?tab=requests');
        const msg = "Showing all requests";
        toast.success(msg);
        speak(msg);
        return;
    }

    if (lowerCommand.includes('show donations') || lowerCommand.includes('see donations')) {
        navigate('/feed?tab=donations');
        const msg = "Showing all donations";
        toast.success(msg);
        speak(msg);
        return;
    }

    // Search term fallback
    if (lowerCommand.includes('search for')) {
        const searchTerm = lowerCommand.split('search for')[1].trim();
        if (searchTerm) {
            navigate(`/feed?search=${encodeURIComponent(searchTerm)}`);
            const msg = `Searching for ${searchTerm}`;
            toast.success(msg);
            speak(msg);
            return;
        }
    }

    toast.info(`Command received: "${command}" (No action taken)`);
    speak("I heard that, but I'm not sure what to do. Try saying 'help' for commands.");
  }, [navigate]);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
        playStartSound();
        toast.info("Listening...", { duration: 2000 });
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        // Only play stop sound if it stopped naturally or via toggle, not if it's restarting immediately for continuous (though continuous is false here)
        playStopSound();
      };

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        console.log('Voice command:', transcript);
        handleCommand(transcript);
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        playStopSound(); // Ensure stop sound plays on error too
        if (event.error === 'not-allowed') {
          const msg = "Microphone access denied.";
          toast.error(msg);
          speak(msg);
        } else {
            const msg = "Could not understand.";
            toast.error(msg);
            speak(msg);
        }
      };

      setRecognition(recognitionInstance);
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, [handleCommand]);

  const toggleListening = () => {
    if (!recognition) {
        toast.error("Voice commands not supported in this browser.");
        return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <div className="fixed bottom-20 left-6 z-50">
        <Button
            onClick={toggleListening}
            size="icon"
            className={`w-12 h-12 rounded-full shadow-lg transition-all duration-300 ${
                isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary hover:bg-primary/90'
            }`}
            aria-label={isListening ? "Stop listening" : "Start voice command"}
        >
            {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
        </Button>
    </div>
  );
};

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipForward, Volume2, VolumeX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

// Add TypeScript declarations for YouTube API
interface YouTubePlayer {
  destroy: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
}

// Define sound options
const SOUND_OPTIONS = [
  { id: "firewood", name: "Firewood", type: "local", source: "/sounds/firewood.mp3" },
  { id: "rain", name: "Rain", type: "local", source: "/sounds/rain.mp3" },
  // { id: "classical", name: "Classical Music", type: "youtube", source: "https://www.youtube.com/watch?v=uFlzUaisbig" },
  // { id: "lofi", name: "Lofi Girl", type: "youtube", source: "https://www.youtube.com/watch?v=jfKfPfyJRdk" }
];

// YouTube player API
let youtubePlayer: YouTubePlayer | null = null;

const AudioPlayer: React.FC = () => {
  const [selectedSound, setSelectedSound] = useState(SOUND_OPTIONS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [youtubeReady, setYoutubeReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const youtubeContainerRef = useRef<HTMLDivElement | null>(null);

  // Load YouTube API
  useEffect(() => {
    // Only load the YouTube API once
    if (typeof window !== 'undefined') {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        window.onYouTubeIframeAPIReady = () => {
          setYoutubeReady(true);
        };
      } else if (window.YT) {
        setYoutubeReady(true);
      }
    }

    // Create audio element for local sounds
    audioRef.current = new Audio();
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = volume / 100;
    }

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (youtubePlayer) {
        youtubePlayer.destroy();
        youtubePlayer = null;
      }
    };
  }, []);

  // Initialize or update YouTube player when sound changes
  useEffect(() => {
    if (!youtubeReady || !window.YT || !window.YT.Player) return;

    // If YouTube sound is selected, initialize the player
    if (selectedSound.type === 'youtube' && youtubeContainerRef.current) {
      // Parse YouTube video ID from URL
      const getYoutubeId = (url: string): string | false => {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : false;
      };

      const videoId = getYoutubeId(selectedSound.source);
      if (!videoId) return;

      // Destroy existing player if it exists
      if (youtubePlayer) {
        youtubePlayer.destroy();
        youtubePlayer = null;
      }

      // Create new player
      try {
        youtubePlayer = new window.YT.Player(youtubeContainerRef.current, {
          height: '0',
          width: '0',
          videoId: videoId,
          playerVars: {
            'playsinline': 1,
            'controls': 0,
            'disablekb': 1,
            'iv_load_policy': 3,
            'modestbranding': 1,
            'rel': 0,
            'showinfo': 0
          },
          events: {
            'onReady': (event: any) => {
              event.target.setVolume(volume);
              if (isPlaying) {
                event.target.playVideo();
              }
            },
            'onStateChange': (event: any) => {
              if (window.YT && event.data === window.YT.PlayerState.ENDED) {
                if (isPlaying) {
                  event.target.playVideo(); // Loop the video
                }
              }
            }
          }
        });
      } catch (e) {
        console.error("Error initializing YouTube player:", e);
      }
    }
  }, [selectedSound, youtubeReady, isPlaying, volume]);

  // Handle play/pause
  const togglePlay = () => {
    if (selectedSound.type === 'local') {
      if (isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      } else {
        if (audioRef.current) {
          audioRef.current.src = selectedSound.source;
          audioRef.current.play().catch(error => {
            console.error("Audio play failed:", error);
          });
        }
      }
    } else if (selectedSound.type === 'youtube' && youtubePlayer) {
      if (isPlaying) {
        youtubePlayer.pauseVideo();
      } else {
        youtubePlayer.playVideo();
      }
    }
    setIsPlaying(!isPlaying);
  };

  // Handle next sound
  const playNextSound = () => {
    // Find current index
    const currentIndex = SOUND_OPTIONS.findIndex(
      (option) => option.id === selectedSound.id
    );
    // Calculate next index
    const nextIndex = (currentIndex + 1) % SOUND_OPTIONS.length;
    // Stop current sound
    if (isPlaying) {
      if (selectedSound.type === 'local') {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      } else if (selectedSound.type === 'youtube' && youtubePlayer) {
        youtubePlayer.pauseVideo();
      }
    }
    // Update selected sound
    setSelectedSound(SOUND_OPTIONS[nextIndex]);
    // If we were playing, start playing the new sound
    if (isPlaying) {
      if (SOUND_OPTIONS[nextIndex].type === 'local') {
        if (audioRef.current) {
          audioRef.current.src = SOUND_OPTIONS[nextIndex].source;
          audioRef.current.play().catch(error => {
            console.error("Audio play failed:", error);
          });
        }
      }
      // YouTube will auto-play when the player is initialized
    }
  };

  // Handle sound selection
  const handleSoundSelect = (sound: typeof SOUND_OPTIONS[0]) => {
    // Stop current sound
    if (isPlaying) {
      if (selectedSound.type === 'local') {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      } else if (selectedSound.type === 'youtube' && youtubePlayer) {
        youtubePlayer.pauseVideo();
      }
    }
    // Update selected sound
    setSelectedSound(sound);
    // If we were playing, start playing the new sound
    if (isPlaying) {
      if (sound.type === 'local') {
        if (audioRef.current) {
          audioRef.current.src = sound.source;
          audioRef.current.play().catch(error => {
            console.error("Audio play failed:", error);
          });
        }
      }
      // YouTube will auto-play when the player is initialized
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    if (selectedSound.type === 'local' && audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    } else if (selectedSound.type === 'youtube' && youtubePlayer) {
      youtubePlayer.setVolume(newVolume);
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    if (isMuted) {
      // Unmute - restore previous volume
      if (selectedSound.type === 'local' && audioRef.current) {
        audioRef.current.volume = volume / 100;
      } else if (selectedSound.type === 'youtube' && youtubePlayer) {
        youtubePlayer.unMute();
      }
    } else {
      // Mute
      if (selectedSound.type === 'local' && audioRef.current) {
        audioRef.current.volume = 0;
      } else if (selectedSound.type === 'youtube' && youtubePlayer) {
        youtubePlayer.mute();
      }
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="mt-1 bg-[#131325] rounded-full px-4 py-2 flex items-center w-full relative">
      {/* Sound selection dropdown - Updated to use full width */}
      <div className="flex-grow flex-shrink basis-2/3 mr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 px-3 text-xs text-gray-400 hover:text-white hover:bg-transparent w-full justify-between bg-[#1e1e30]/50 hover:bg-[#1e1e30] rounded-full">
              <span className="truncate mr-2">{selectedSound.name}</span>
              <ChevronDown className="h-3 w-3 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#262638] border-gray-700 text-white">
            {SOUND_OPTIONS.map((sound) => (
              <DropdownMenuItem
                key={sound.id}
                onClick={() => handleSoundSelect(sound)}
                className="cursor-pointer hover:bg-[#333345]"
              >
                {sound.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Player controls */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <button
          className="text-gray-400 hover:text-white flex-shrink-0"
          onClick={togglePlay}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          className="text-gray-400 hover:text-white flex-shrink-0"
          onClick={playNextSound}
        >
          <SkipForward className="h-4 w-4" />
        </button>
        <button
          className="text-gray-400 hover:text-white flex-shrink-0"
          onClick={toggleMute}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <div className="w-20 h-1 bg-gray-700 rounded-full relative flex-shrink-0">
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
          <div
            className="h-1 bg-gray-400 rounded-full"
            style={{ width: `${volume}%` }}
          ></div>
        </div>
      </div>

      {/* Hidden YouTube container */}
      <div className="hidden">
        <div ref={youtubeContainerRef} id="youtube-player"></div>
      </div>
    </div>
  );
};

export default AudioPlayer;
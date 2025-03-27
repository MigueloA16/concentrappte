"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipForward, Volume2, VolumeX, ChevronDown } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Sound Options Configuration
const SOUND_OPTIONS = [
  { id: "firewood", name: "Firewood", source: "/sounds/firewood.mp3" },
  { id: "rain", name: "Rain", source: "/sounds/rain.mp3" }
];

const AudioPlayer: React.FC = () => {
  // State Management
  const [selectedSound, setSelectedSound] = useState(SOUND_OPTIONS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Effect: Initialize Audio
  useEffect(() => {
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
    };
  }, []);

  // Play Sound
  const playSound = useCallback((sound: typeof SOUND_OPTIONS[0]) => {
    if (audioRef.current) {
      audioRef.current.src = sound.source;
      audioRef.current.play().catch(error => {
        console.error("Audio play failed:", error);
      });
    }
  }, []);

  // Pause Sound
  const pauseSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  // Toggle Play/Pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseSound();
    } else {
      playSound(selectedSound);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, selectedSound, playSound, pauseSound]);

  // Play Next Sound
  const playNextSound = useCallback(() => {
    // Find current index
    const currentIndex = SOUND_OPTIONS.findIndex(
      (option) => option.id === selectedSound.id
    );
    // Calculate next index
    const nextIndex = (currentIndex + 1) % SOUND_OPTIONS.length;

    // Stop current sound
    if (isPlaying) {
      pauseSound();
    }

    // Update selected sound
    const nextSound = SOUND_OPTIONS[nextIndex];
    setSelectedSound(nextSound);

    // If we were playing, start playing the new sound
    if (isPlaying) {
      playSound(nextSound);
    }
  }, [isPlaying, selectedSound, pauseSound, playSound]);

  // Handle Sound Selection
  const handleSoundSelect = useCallback((sound: typeof SOUND_OPTIONS[0]) => {
    // Stop current sound
    if (isPlaying) {
      pauseSound();
    }

    // Update selected sound
    setSelectedSound(sound);

    // If we were playing, start playing the new sound
    if (isPlaying) {
      playSound(sound);
    }
  }, [isPlaying, pauseSound, playSound]);

  // Handle Volume Change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  }, []);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (isMuted) {
      // Unmute - restore previous volume
      if (audioRef.current) {
        audioRef.current.volume = volume / 100;
      }
    } else {
      // Mute
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
    }
    setIsMuted(!isMuted);
  }, [isMuted, volume]);

  return (
    <div className="mt-1 bg-[#131325] rounded-full px-4 py-2 flex items-center w-full relative">
      {/* Sound selection dropdown */}
      <div className="flex-grow flex-shrink basis-2/3 mr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 px-3 text-xs text-gray-400 hover:text-white hover:bg-transparent w-full justify-between bg-[#1e1e30]/50 hover:bg-[#1e1e30] rounded-full"
            >
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
    </div>
  );
};

export default AudioPlayer;
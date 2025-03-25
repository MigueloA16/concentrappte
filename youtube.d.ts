interface YT {
    Player: {
      new (
        elementId: string | HTMLElement,
        options: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: Record<string, any>;
          events?: Record<string, any>;
        }
      ): YT.Player;
    };
    PlayerState: {
      ENDED: number;
      PLAYING: number;
      PAUSED: number;
      BUFFERING: number;
      CUED: number;
    };
  }
  
  namespace YT {
    interface Player {
      destroy(): void;
      pauseVideo(): void;
      playVideo(): void;
      setVolume(volume: number): void;
      mute(): void;
      unMute(): void;
      getPlayerState(): number;
    }
  }
  
  interface Window {
    YT?: YT;
    onYouTubeIframeAPIReady?: () => void;
  }
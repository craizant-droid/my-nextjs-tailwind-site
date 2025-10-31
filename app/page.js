"use client"
import { useState, useEffect, useRef } from 'react';

export default function FlappyBird() {
  // Game state
  const [birdY, setBirdY] = useState(250);
  const [birdSpeed, setBirdSpeed] = useState(0);
  const [pipeX, setPipeX] = useState(400);
  const [pipeGap, setPipeGap] = useState(200);
  const [topPipeHeight, setTopPipeHeight] = useState(100);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // ADDED: State to track if the user has interacted with the screen yet (for audio permission)
  const [hasInteracted, setHasInteracted] = useState(false);

  // Audio references
  const musicRef = useRef(null);
  const gameOverRef = useRef(null);

  // Game settings
  const GRAVITY = 0.5;
  const JUMP_POWER = -8;
  const GAME_WIDTH = 400;
  const GAME_HEIGHT = 600;
  const BIRD_SIZE = 90;
  const PIPE_WIDTH = 80;
  const MIN_PIPE_HEIGHT = 30;
  const MAX_PIPE_HEIGHT = 180; // Reduced for easier gameplay
  const INITIAL_GAP = 250; // Increased gap for easier gameplay
  const MIN_GAP = 180; // Larger minimum gap

  // === IMAGE AND AUDIO PATHS - CHANGE THESE EASILY ===
  const BACKGROUND_IMAGE = "/background.jpg";
  const BIRD_IMAGE = "/flappyimg.jpeg";
  const PIPE_IMAGE = "/pipeimg.jpg";
  const GAME_MUSIC = "/game-music.ogg";
  const GAME_OVER_SOUND = "/game-over.ogg";
  // ===================================================

  // Main game loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const interval = setInterval(() => {
      // Make bird fall
      setBirdSpeed(speed => speed + GRAVITY);
      setBirdY(y => y + birdSpeed);

      // Move pipe left
      setPipeX(x => {
        if (x < -PIPE_WIDTH) {
          setScore(s => s + 1);
          
          // Increase difficulty: reduce gap as score increases (max difficulty at score 10)
          const newGap = Math.max(MIN_GAP, INITIAL_GAP - (score * 8));
          setPipeGap(newGap);
          
          // Generate random pipe height
          const maxHeight = GAME_HEIGHT - newGap - MIN_PIPE_HEIGHT;
          setTopPipeHeight(Math.random() * (maxHeight - MIN_PIPE_HEIGHT) + MIN_PIPE_HEIGHT);
          
          return GAME_WIDTH;
        }
        return x - 3;
      });

      // Check if bird hit top or bottom
      if (birdY < 0 || birdY > GAME_HEIGHT - BIRD_SIZE) {
        endGame();
      }

      // Check if bird hit pipe - FIXED COLLISION DETECTION
      const birdLeft = 100;
      const birdRight = 100 + BIRD_SIZE;
      const birdTop = birdY;
      const birdBottom = birdY + BIRD_SIZE;
      
      const pipeLeft = pipeX;
      const pipeRight = pipeX + PIPE_WIDTH;
      const topPipeBottom = topPipeHeight;
      const bottomPipeTop = topPipeHeight + pipeGap;

      if (birdRight > pipeLeft && birdLeft < pipeRight) {
        if (birdTop < topPipeBottom || birdBottom > bottomPipeTop) {
          endGame();
        }
      }
    }, 20);

    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, birdY, birdSpeed, pipeX, topPipeHeight, pipeGap, score]);

  // End game function
  function endGame() {
    setIsGameOver(true);
    stopMusic();
    playGameOverSound();
  }

  // Start or restart game
  function startGame() {
    if (isGameOver) {
      // Reset everything
      setBirdY(250);
      setBirdSpeed(0);
      setPipeX(400);
      setScore(0);
      setPipeGap(INITIAL_GAP);
      setTopPipeHeight(100);
      setIsGameOver(false);
      stopGameOverSound();
    }
    setIsPlaying(true);
    
    // MODIFIED: Only play music if we have confirmed user interaction
    if (hasInteracted) {
        playMusic();
    }
  }

  // Make bird jump
  function jump() {
    // ADDED: This block grants the audio permission on the *first* tap
    if (!hasInteracted) {
        setHasInteracted(true);
        playMusic(); // This play call is directly triggered by the tap/click, so it will work on mobile
    }
    
    if (!isPlaying) {
      startGame();
    } else if (!isGameOver) {
      setBirdSpeed(JUMP_POWER);
    } else {
      startGame();
    }
  }

  // Audio controls
  function playMusic() {
    if (musicRef.current) {
      // NOTE: Using .catch() to silently handle any remaining autoplay errors
      musicRef.current.play().catch(e => console.log('Music error:', e));
    }
  }

  function stopMusic() {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
  }

  function playGameOverSound() {
    if (gameOverRef.current) {
      gameOverRef.current.play().catch(e => console.log('Sound error:', e));
    }
  }

  function stopGameOverSound() {
    if (gameOverRef.current) {
      gameOverRef.current.pause();
      gameOverRef.current.currentTime = 0;
    }
  }

  // Calculate bottom pipe height
  const bottomPipeHeight = GAME_HEIGHT - (topPipeHeight + pipeGap);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-900">
      {/* Audio elements */}
      <audio ref={musicRef} loop>
        <source src={GAME_MUSIC} type="audio/ogg" />
      </audio>
      <audio ref={gameOverRef}>
        <source src={GAME_OVER_SOUND} type="audio/ogg" />
      </audio>

      <div className="text-center w-full max-w-md">
        {/* Game container */}
        <div
          className="relative border-4 border-gray-800 overflow-hidden cursor-pointer mx-auto"
          style={{
            backgroundImage: `url(${BACKGROUND_IMAGE})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: '100%',
            maxWidth: GAME_WIDTH,
            height: 0,
            paddingBottom: '150%',
            maxHeight: '80vh'
          }}
          onClick={jump}
        >
          <div className="absolute inset-0" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
            {/* Bird */}
            <div
              className="absolute"
              style={{ left: 100, top: birdY, width: BIRD_SIZE, height: BIRD_SIZE }}
            >
              <img 
                src={BIRD_IMAGE} 
                alt="bird" 
                className="w-full h-full object-cover rounded-full"
                style={{ imageRendering: 'auto' }}
              />
            </div>

            {/* Top pipe */}
            <div
              className="absolute"
              style={{
                left: pipeX,
                top: 0,
                width: PIPE_WIDTH,
                height: topPipeHeight
              }}
            >
              <img 
                src={PIPE_IMAGE} 
                alt="pipe" 
                className="w-full h-full object-cover" 
                style={{transform: 'rotate(180deg)', imageRendering: 'auto'}} 
              />
            </div>

            {/* Bottom pipe */}
            <div
              className="absolute"
              style={{
                left: pipeX,
                bottom: 0,
                width: PIPE_WIDTH,
                height: bottomPipeHeight
              }}
            >
              <img 
                src={PIPE_IMAGE} 
                alt="pipe" 
                className="w-full h-full object-cover"
                style={{ imageRendering: 'auto' }}
              />
            </div>

            {/* Score display */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-4xl font-bold text-white drop-shadow-lg">
              {score}
            </div>

            {/* Start/Game over screen */}
            {(!isPlaying || isGameOver) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-center text-white">
                  <h1 className="text-4xl font-bold mb-4">
                    {isGameOver ? 'Game Over!' : 'Flappy Bird'}
                  </h1>
                  <p className="text-xl mb-2">
                    {isGameOver ? `Score: ${score}` : 'Click to Start'}
                  </p>
                  <p className="text-sm">Click to Start</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p className="mt-4 text-gray-700 text-sm sm:text-base">Click or tap to make the bird flap!</p>
      </div>
    </div>
  );
}

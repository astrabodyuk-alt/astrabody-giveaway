import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { Participant } from '../supabase';
import confetti from 'canvas-confetti';
import { Sun, Palmtree } from 'lucide-react';
import './Draw.css';

export default function Draw() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [currentTicket, setCurrentTicket] = useState('AST-....');
  
  // Create weighted pool based on entry counts
  const [weightedPool, setWeightedPool] = useState<Participant[]>([]);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('status', 'approved');

    if (error) {
      console.error(error);
    } else if (data) {
      setParticipants(data);
      
      // Build weighted pool
      const pool: Participant[] = [];
      data.forEach(p => {
        const count = p.entries || 1;
        for (let i = 0; i < count; i++) {
          pool.push(p);
        }
      });
      // Shuffle pool for better visual randomization
      setWeightedPool(pool.sort(() => 0.5 - Math.random()));
    }
  };

  const launchConfetti = () => {
    const duration = 15 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#C9A84C', '#E3C161', '#ffffff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#C9A84C', '#E3C161', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const startDraw = () => {
    if (weightedPool.length === 0) {
      alert("No approved participants to draw from!");
      return;
    }

    setIsDrawing(true);
    setWinner(null);

    // Pick winning index beforehand
    const winnerIndex = Math.floor(Math.random() * weightedPool.length);
    const selectedWinner = weightedPool[winnerIndex];

    const duration = 8000; // 8 seconds
    const fps = 60;
    const totalFrames = duration / (1000 / fps);
    let frame = 0;
    
    // Non-linear easing for slow-down effect (Ease Out Expo)
    const easeOutExpo = (x: number): number => {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    };

    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const easedProgress = easeOutExpo(progress);
      
      // Update name based on easing interval
      // The faster it updates early on, the more "blur" we get
      // Towards the end, updates become very rare
      
      const shouldUpdate = Math.random() > easedProgress * 0.95;
      
      if (shouldUpdate) {
        const randomIndex = Math.floor(Math.random() * participants.length);
        setCurrentTicket(participants[randomIndex].ticket_number || 'AST-....');
      }

      if (frame >= totalFrames) {
        clearInterval(interval);
        setCurrentTicket(selectedWinner.ticket_number || 'AST-ERROR');
        setWinner(selectedWinner);
        setIsDrawing(false);
        launchConfetti();
      }
    }, 1000 / fps);
  };

  return (
    <div className="draw-container">
      <div className="bg-sunburst">
        <Sun size={800} strokeWidth={0.5} className="sun-pulse" />
      </div>
      <div className="palm-decor left"><Palmtree size={300} strokeWidth={1} /></div>
      <div className="palm-decor right"><Palmtree size={300} strokeWidth={1} /></div>

      <div className="draw-header">
        <div className="logo">Astra<span>body</span></div>
        <p>Marrakech Weekend Giveaway</p>
      </div>

      <div className="draw-arena">
        {winner ? (
          <div className="winner-display reveal">
            <h2>WINNING TICKET</h2>
            <div className="winner-name">{winner.ticket_number || 'AST-XXXX'}</div>
            <div className="winner-details">
              Tier: {winner.tier?.toUpperCase() || '-'} • Entries Rolled: {winner.entries}
            </div>
          </div>
        ) : (
          <div className={`slot-machine ${isDrawing ? 'spinning' : ''}`}>
            {isDrawing ? (
              <div className="slot-name blurred">{currentTicket}</div>
            ) : (
              <div className="slot-idle">Ready to Draw</div>
            )}
          </div>
        )}
      </div>

      <div className="draw-footer">
        {!isDrawing && !winner && (
          <button className="draw-btn" onClick={startDraw}>LAUNCH DRAW (8s)</button>
        )}
        {winner && (
          <button className="draw-btn btn-outline" onClick={() => setWinner(null)}>Draw Again</button>
        )}
      </div>
    </div>
  );
}

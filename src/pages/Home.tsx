import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import confetti from 'canvas-confetti';
import { differenceInSeconds } from 'date-fns';
import { Sun, Palmtree, MapPin } from 'lucide-react';
import './Home.css';

export default function Home() {
  const targetDate = new Date('2026-04-02T00:00:00'); // Thursday 2nd April 2026

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [selectedTier, setSelectedTier] = useState<'bronze' | 'silver' | 'vip' | ''>('');
  const [issuedTicket, setIssuedTicket] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    googleReview: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diffInSecs = differenceInSeconds(targetDate, now);

      if (diffInSecs <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const d = Math.floor(diffInSecs / (3600 * 24));
        const h = Math.floor((diffInSecs % (3600 * 24)) / 3600);
        const m = Math.floor((diffInSecs % 3600) / 60);
        const s = Math.floor(diffInSecs % 60);
        setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier) {
      setErrorDetails("You must select a qualifying purchase tier to enter the draw.");
      return;
    }

    setIsSubmitting(true);
    setErrorDetails('');

    // Pre-calculate entries
    let baseEntries = 0;
    if (selectedTier === 'bronze') baseEntries = 1;
    if (selectedTier === 'silver') baseEntries = 3;
    if (selectedTier === 'vip') baseEntries = 8;
    const finalEntries = baseEntries + (formData.googleReview ? 1 : 0);

    // Generate 4-digit AST code
    const newTicket = `AST-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const { error } = await supabase.from('participants').insert([
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          ticket_number: newTicket,
          tier: selectedTier,
          entries: finalEntries,
          google_review: formData.googleReview,
          status: 'pending' // As per requirement
        }
      ]);

      if (error) {
        if (error.code === '23505') {
          setErrorDetails("This phone number has already been registered.");
        } else {
          setErrorDetails("An error occurred during registration. Please try again.");
          console.error(error);
        }
        setIsSubmitting(false);
        return;
      }

      // Success
      setIsSuccess(true);
      setIssuedTicket(newTicket);
      
      // Luxury Confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // Gold confetti colors
        const colors = ['#C9A84C', '#E3C161', '#ffffff'];

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors
        });
      }, 250);

    } catch (err) {
      console.error(err);
      setErrorDetails("An unexpected error occurred.");
    } finally {
      if(!isSuccess) {
        setIsSubmitting(false);
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="home-container success-state">
        <div className="success-content">
          <h1>Registration Successful!</h1>
          <div className="ticket-display" style={{ background: 'var(--color-terracotta-dim)', padding: '24px', borderRadius: '12px', border: '1px dashed var(--color-terracotta)', margin: '24px 0' }}>
            <h2 style={{ fontSize: '1.6rem', margin: 0, color: 'var(--color-text)' }}>
              Your ticket number is <br/>
              <span style={{ color: 'var(--color-sunburst)', fontSize: '2.5rem', display: 'block', marginTop: '12px', letterSpacing: '2px' }}>{issuedTicket}</span> 🎟️
            </h2>
          </div>
          <p>Keep this ticket number safe! Our draw machine will select the winner using this exact code to protect your privacy.</p>
          
          <div className="success-tiers">
            <p><strong>Reminder of our Luxury Tiers:</strong></p>
            <ul>
              <li><strong>Bronze:</strong> £150–£299 = <span className="highlight-gold">1 Entry</span></li>
              <li><strong>Silver:</strong> £300–£499 = <span className="highlight-gold">3 Entries</span></li>
              <li><strong>VIP:</strong> £500+ = <span className="highlight-gold">8 Entries</span></li>
            </ul>
          </div>
          <button onClick={() => window.location.reload()} className="btn-outline">Register Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <nav className="navbar container">
        <div className="logo">Astra<span>body</span></div>
        <div className="countdown-mini">
          {String(timeLeft.days).padStart(2, '0')}D : {String(timeLeft.hours).padStart(2, '0')}H : {String(timeLeft.minutes).padStart(2, '0')}M : {String(timeLeft.seconds).padStart(2, '0')}S
        </div>
      </nav>

      <div className="hero-section container">
        <div className="hero-content">
          <div className="location-badge">
            <MapPin size={16} /> Morocco
          </div>
          <h1 className="hero-title">
            A Weekend in <br/>
            <span>Marrakech.</span>
            <Palmtree className="hero-icon" size={48} />
          </h1>
          <p className="hero-subtitle">Enter the exclusive Astrabody giveaway. Next draw: Thursday, April 2nd, 2026.</p>
        </div>

        <div className="form-wrapper">
          <form className="registration-form" onSubmit={handleSubmit}>
            <div style={{textAlign: 'center', marginBottom: '16px', color: 'var(--color-sunburst)'}}>
              <Sun size={40} />
            </div>
            <h2>Register Now</h2>
            <p>Secure your spot in the grand draw.</p>

            {errorDetails && <div className="error-message">{errorDetails}</div>}

            <div className="form-row">
              <div className="form-group half">
                <label className="form-label">First Name</label>
                <input required type="text" name="firstName" className="form-input" value={formData.firstName} onChange={handleChange} placeholder="First Name" />
              </div>
              <div className="form-group half">
                <label className="form-label">Last Name</label>
                <input required type="text" name="lastName" className="form-input" value={formData.lastName} onChange={handleChange} placeholder="Last Name" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input required type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} placeholder="Email" />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input required type="tel" name="phone" className="form-input" value={formData.phone} onChange={handleChange} placeholder="Phone Number" />
            </div>

            <div className="form-group">
              <label className="form-label">Qualifying Purchase Tier</label>
              <div className="tier-cards-selection">
                <div 
                  className={`tier-card-option ${selectedTier === 'bronze' ? 'selected' : ''}`}
                  onClick={() => setSelectedTier('bronze')}
                >
                  <div className="tier-card-header">
                    <h4>Bronze</h4>
                    <span>1 Entry</span>
                  </div>
                  <div className="tier-card-price">£150 - £299</div>
                </div>

                <div 
                  className={`tier-card-option silver-theme ${selectedTier === 'silver' ? 'selected' : ''}`}
                  onClick={() => setSelectedTier('silver')}
                >
                  <div className="tier-card-header">
                    <h4>Silver</h4>
                    <span>3 Entries</span>
                  </div>
                  <div className="tier-card-price">£300 - £499</div>
                </div>

                <div 
                  className={`tier-card-option vip-theme ${selectedTier === 'vip' ? 'selected' : ''}`}
                  onClick={() => setSelectedTier('vip')}
                >
                  <div className="tier-card-header">
                    <h4>VIP</h4>
                    <span>8 Entries</span>
                  </div>
                  <div className="tier-card-price">£500+</div>
                </div>
              </div>
            </div>

            <div className="form-checkbox-group">
              <label className="form-checkbox">
                <input type="checkbox" name="googleReview" checked={formData.googleReview} onChange={handleChange} />
                <span>I left a Google review for Astrabody <br/><small>(Eligible for +1 bonus entry upon verification)</small></span>
              </label>
            </div>

            <button type="submit" className="btn-primary submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Complete Registration'}
            </button>
            <div className="decor-arch-footer"></div>
          </form>
        </div>
      </div>
    </div>
  );
}

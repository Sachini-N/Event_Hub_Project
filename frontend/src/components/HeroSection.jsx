import React, { useState, useEffect } from 'react';
import hero1Img from '../assets/hero 1.jpeg';
import homeImg from '../assets/home.jpeg';

const HERO_SLIDES = [
  {
    image: hero1Img,
    badge: '🎉 TRACE Community Hub Sri Lanka',
    title: 'Where Innovation Meets Community & Culture',
    subtitle: 'From energetic community gatherings like Dust Off to creative meetups, discover and experience unforgettable events powered by TRACE Community.',
    primaryBtn: 'Explore Upcoming Events',
    primaryTab: 'upcoming',
    secondaryBtn: 'View Past Highlights',
    secondaryTab: 'past',
  },
  {
    image: homeImg,
    badge: '🔥 The Shed Series & Sessions',
    title: 'Ignite Ideas, Connect & Share Stories',
    subtitle: 'Be part of engaging Shed discussions, creative workshops, open-mic sessions, and community gatherings designed to connect passionate minds.',
    primaryBtn: 'Explore Upcoming Events',
    primaryTab: 'upcoming',
    secondaryBtn: 'View Past Archives',
    secondaryTab: 'past',
  },
  {
    image: 'https://tracesrilanka.lk/api/media/file/trace-home-1200x630.webp',
    badge: '🚀 Community Gatherings & Celebrations',
    title: 'Celebrate Creativity, Music & Tech at TRACE',
    subtitle: 'Experience landmark community initiatives like Mid Week, live music evenings, collaborative workshops, and vibrant multi-disciplinary showcases.',
    primaryBtn: 'Explore Upcoming Events',
    primaryTab: 'upcoming',
    secondaryBtn: 'Past Event Gallery',
    secondaryTab: 'past',
  },
];

export default function HeroSection({ scrollToEvents }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % HERO_SLIDES.length);
        setFade(true);
      }, 300);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  const goToSlide = (idx) => {
    if (idx === currentSlideIndex) return;
    setFade(false);
    setTimeout(() => {
      setCurrentSlideIndex(idx);
      setFade(true);
    }, 300);
  };

  const currentSlide = HERO_SLIDES[currentSlideIndex];

  return (
    <section className="hero-section" id="hero-section">
      {/* Background Slideshow with Smooth Crossfade */}
      <div className="hero-slideshow-container">
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={`hero-slide ${idx === currentSlideIndex ? 'active' : ''}`}
            style={{
              backgroundImage: `url("${slide.image}")`,
            }}
          />
        ))}
      </div>

      {/* Overlay */}
      <div className="hero-overlay"></div>

      {/* Hero Content */}
      <div className={`hero-content ${fade ? 'fade-in' : 'fade-out'}`}>
        <div className="hero-badge">
          <i className="fa-solid fa-sparkles"></i> {currentSlide.badge}
        </div>
        <h1 className="hero-title">{currentSlide.title}</h1>
        <p className="hero-subtitle">{currentSlide.subtitle}</p>
        <div className="hero-actions">
          <button
            className="btn btn-blue-pill"
            onClick={() => scrollToEvents(currentSlide.primaryTab)}
          >
            {currentSlide.primaryBtn}
          </button>
          <button
            className="btn btn-outline-pill"
            onClick={() => scrollToEvents(currentSlide.secondaryTab)}
          >
            {currentSlide.secondaryBtn}
          </button>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="hero-indicators">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`hero-indicator-dot ${idx === currentSlideIndex ? 'active' : ''}`}
            onClick={() => goToSlide(idx)}
            aria-label={`Switch to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

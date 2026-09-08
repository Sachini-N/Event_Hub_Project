import React, { useState, useEffect } from 'react';
import hero1Img from '../assets/hero 1.jpeg';
import homeImg from '../assets/home.jpeg';

const HERO_SLIDES = [
  {
    image: hero1Img,
    badge: 'TRACE Expert City Sri Lanka',
    title: "Discover & Experience Tech Events at TRACE",
    subtitle: 'Join our vibrant community. Participate in tech events, showcase innovations, and connect with peers to foster professional growth.',
    primaryBtn: 'Explore Upcoming Events',
    primaryTab: 'upcoming',
    secondaryBtn: 'View Past Events',
    secondaryTab: 'past',
  },
  {
    image: homeImg,
    badge: 'Tech Talks & Workshops Showcase',
    title: 'Innovate & Learn with Industry Leaders',
    subtitle: 'Feature expert keynotes, hands-on workshops, and developer meetups hosted at TRACE Expert City Colombo.',
    primaryBtn: 'Explore Upcoming Events',
    primaryTab: 'upcoming',
    secondaryBtn: 'Explore Spaces & Hub',
    secondaryTab: 'venues-page',
  },
  {
    image: 'https://tracesrilanka.lk/api/media/file/trace-home-1200x630.webp',
    badge: 'Premier Hub Venues & Facilities',
    title: 'Explore & Showcase World-Class Event Spaces',
    subtitle: 'Discover auditorium halls, high-tech meeting rooms, and collaborative spaces tailored for technology events.',
    primaryBtn: 'Browse Spaces & Venues',
    primaryTab: 'venues-page',
    secondaryBtn: 'View Past Events',
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



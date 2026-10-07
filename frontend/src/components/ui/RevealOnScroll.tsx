import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number; // Delay in milliseconds
  threshold?: number;
  as?: 'div' | 'section' | 'article' | 'li' | 'header';
}

/**
 * RevealOnScroll
 * High-performance viewport intersection wrapper using IntersectionObserver.
 * Disconnects immediately after first reveal to avoid ongoing CPU cycles.
 * Fully respects prefers-reduced-motion.
 */
export function RevealOnScroll({
  children,
  className = '',
  delay = 0,
  threshold = 0.1,
  as: Component = 'div',
}: RevealOnScrollProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // If reduced-motion is preferred, reveal immediately without observing
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsVisible(true);
      return;
    }

    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Disconnect immediately on intersection
        }
      },
      { threshold, rootMargin: '0px 0px -30px 0px' }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const transitionStyle: CSSProperties = {
    transitionProperty: 'opacity, transform',
    transitionDuration: '800ms',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionDelay: `${delay}ms`,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0px)' : 'translateY(30px)',
  };

  return (
    <Component
      ref={containerRef as any}
      style={transitionStyle}
      className={`reveal-on-scroll ${className}`}
    >
      {children}
    </Component>
  );
}

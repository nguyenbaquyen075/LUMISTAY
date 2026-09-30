import { useEffect } from 'react';

/**
 * Custom hook to trigger bottom-to-top reveal animations on scroll
 * Supports dynamic DOM elements via MutationObserver
 */
export function useScrollReveal() {
  useEffect(() => {
    // Check if IntersectionObserver is supported
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal-up, .reveal-on-scroll').forEach(el => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observedElements = new WeakSet();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -20px 0px',
        threshold: 0.04
      }
    );

    const observeNewElements = () => {
      const targets = document.querySelectorAll('.reveal-up:not(.is-revealed), .reveal-on-scroll:not(.is-revealed)');
      targets.forEach(el => {
        if (!observedElements.has(el)) {
          observedElements.add(el);
          observer.observe(el);
        }
      });
    };

    // Initial observe
    observeNewElements();

    // Listen for DOM changes (e.g. asynchronous API room / review data loaded)
    const mutationObserver = new MutationObserver(() => {
      observeNewElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
}

export default useScrollReveal;

/**
 * Atom Default Theme — Modern JS
 */
(function() {
  'use strict';

  // --- Smooth scroll ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // --- External links ---
  document.querySelectorAll('.post-content a').forEach(link => {
    if (link.hostname && link.hostname !== window.location.hostname) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });

  // --- Code copy buttons ---
  document.querySelectorAll('pre code').forEach(block => {
    const pre = block.parentElement;
    if (!pre) return;

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    pre.style.position = 'relative';
    pre.appendChild(btn);

    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(block.textContent).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 2000);
      }).catch(() => {
        const range = document.createRange();
        range.selectNode(block);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 2000);
      });
    });
  });

  // --- Back to top ---
  const scrollBtn = document.querySelector('.back-top');
  if (scrollBtn) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          scrollBtn.classList.toggle('visible', window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    });
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Scroll animations (Intersection Observer) ---
  const observerOpts = { threshold: 0.1, rootMargin: '0px 0px -40px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOpts);

  document.querySelectorAll('.post-card, .archive-year, .taxonomy-item').forEach(el => {
    observer.observe(el);
  });

  // --- Image lazy load ---
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
    });
  }

})();

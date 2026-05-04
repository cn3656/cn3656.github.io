/**
 * Atom Default Theme — Modern JS
 * Features: theme toggle (light/dark/auto), code copy, scroll animations
 */
(function() {
  'use strict';

  // ============================================================
  // Theme Toggle — light / dark / auto (follows system preference)
  // ============================================================
  var THEME_KEY = 'theme';
  var MODES = ['light', 'auto', 'dark'];
  var root = document.documentElement;

  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY) || 'auto';
  }

  function setTheme(mode) {
    root.setAttribute('data-theme', mode);
    localStorage.setItem(THEME_KEY, mode);
    updateToggleUI(mode);
  }

  function updateToggleUI(mode) {
    document.querySelectorAll('.theme-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });
  }

  // Init toggle UI
  updateToggleUI(getStoredTheme());

  // Bind click events
  document.querySelectorAll('.theme-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      setTheme(this.getAttribute('data-mode'));
    });
  });

  // Listen for system preference changes (when in auto mode)
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', function() {
    if (getStoredTheme() === 'auto') {
      // Re-apply auto to trigger CSS cascade recalculation
      root.setAttribute('data-theme', 'auto');
    }
  });

  // --- Smooth scroll ---
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // --- External links ---
  document.querySelectorAll('.post-content a').forEach(function(link) {
    if (link.hostname && link.hostname !== window.location.hostname) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });

  // --- Code copy buttons ---
  document.querySelectorAll('pre code').forEach(function(block) {
    var pre = block.parentElement;
    if (!pre) return;

    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = '复制';
    pre.style.position = 'relative';
    pre.appendChild(btn);

    btn.addEventListener('click', function() {
      navigator.clipboard.writeText(block.textContent).then(function() {
        btn.textContent = '已复制';
        setTimeout(function() { btn.textContent = '复制'; }, 2000);
      }).catch(function() {
        var range = document.createRange();
        range.selectNode(block);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        btn.textContent = '已复制';
        setTimeout(function() { btn.textContent = '复制'; }, 2000);
      });
    });
  });

  // --- Back to top ---
  var scrollBtn = document.querySelector('.back-top');
  if (scrollBtn) {
    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          scrollBtn.classList.toggle('visible', window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    });
    scrollBtn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Scroll animations (Intersection Observer) ---
  var observerOpts = { threshold: 0.1, rootMargin: '0px 0px -40px 0px' };
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOpts);

  document.querySelectorAll('.post-card, .archive-year, .taxonomy-item').forEach(function(el) {
    observer.observe(el);
  });

  // --- Image lazy load ---
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[data-src]').forEach(function(img) {
      img.src = img.dataset.src;
    });
  }

})();

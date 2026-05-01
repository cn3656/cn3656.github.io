/**
 * Ation Default Theme - JavaScript
 */

(function() {
  'use strict';

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // External links open in new tab (safety net)
  document.querySelectorAll('.post-content a').forEach(link => {
    if (link.hostname !== window.location.hostname) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });

  // Lazy load images (native + fallback)
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
  }

  // Add copy button to code blocks
  document.querySelectorAll('pre code').forEach(block => {
    const button = document.createElement('button');
    button.className = 'copy-btn';
    button.textContent = 'Copy';
    button.style.cssText = 'position:absolute;top:0.5rem;right:0.5rem;padding:0.3rem 0.6rem;font-size:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:4px;color:inherit;cursor:pointer;opacity:0;transition:opacity 0.2s;';
    
    const pre = block.parentElement;
    if (pre) {
      pre.style.position = 'relative';
      pre.appendChild(button);
      
      pre.addEventListener('mouseenter', () => button.style.opacity = '1');
      pre.addEventListener('mouseleave', () => button.style.opacity = '0');
      
      button.addEventListener('click', () => {
        navigator.clipboard.writeText(block.textContent).then(() => {
          button.textContent = 'Copied!';
          setTimeout(() => button.textContent = 'Copy', 2000);
        }).catch(() => {
          // Fallback
          const range = document.createRange();
          range.selectNode(block);
          window.getSelection().removeAllRanges();
          window.getSelection().addRange(range);
          document.execCommand('copy');
          button.textContent = 'Copied!';
          setTimeout(() => button.textContent = 'Copy', 2000);
        });
      });
    }
  });

  // Mobile menu toggle (if nav gets too long)
  const nav = document.querySelector('.nav');
  if (nav && window.innerWidth < 480) {
    const toggle = document.createElement('button');
    toggle.textContent = 'Menu';
    toggle.style.cssText = 'display:block;margin-top:0.5rem;padding:0.3rem 0.8rem;font-size:0.85rem;border:1px solid var(--color-border);border-radius:4px;background:none;color:var(--color-text);cursor:pointer;';
    
    nav.style.display = 'none';
    nav.parentElement.insertBefore(toggle, nav);
    
    toggle.addEventListener('click', () => {
      const isHidden = nav.style.display === 'none';
      nav.style.display = isHidden ? 'flex' : 'none';
      toggle.textContent = isHidden ? 'Close' : 'Menu';
    });
  }

  // Back to top
  const scrollBtn = document.createElement('button');
  scrollBtn.innerHTML = '&uarr;';
  scrollBtn.style.cssText = 'position:fixed;bottom:2rem;right:2rem;width:2.5rem;height:2.5rem;border-radius:50%;border:1px solid var(--color-border);background:var(--color-bg);color:var(--color-text);font-size:1.2rem;cursor:pointer;opacity:0;transition:opacity 0.3s;pointer-events:none;z-index:999;';
  document.body.appendChild(scrollBtn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollBtn.style.opacity = '1';
      scrollBtn.style.pointerEvents = 'auto';
    } else {
      scrollBtn.style.opacity = '0';
      scrollBtn.style.pointerEvents = 'none';
    }
  });

  scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

})();

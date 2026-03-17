const countdownTarget = new Date(2026, 6, 25, 11, 20, 0);
const rsvpDeadline = new Date(2026, 5, 1, 0, 0, 0);

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxENtK6kjpD5fv1qPnLlZ-1N7u9eyruYTb1G74E6hsWZ_zew3omzDAxBgeGW53t9Lk0Kg/exec';

const countdownEls = {
  days: document.querySelector('[data-unit="days"]'),
  hours: document.querySelector('[data-unit="hours"]'),
  minutes: document.querySelector('[data-unit="minutes"]'),
  seconds: document.querySelector('[data-unit="seconds"]'),
};

const rsvpForm = document.getElementById('rsvp-form');
const rsvpClosed = document.getElementById('rsvp-closed');
const rsvpSuccess = document.getElementById('rsvp-success');
const rsvpError = document.getElementById('rsvp-error');
const rsvpRetry = document.getElementById('rsvp-retry');
const parallaxLayers = Array.from(document.querySelectorAll('.bg-layer'));

function pad(num) {
  return String(num).padStart(2, '0');
}

function tick(el, value) {
  if (!el) return;
  if (el.textContent === value) return;
  el.textContent = value;
  el.classList.add('tick');
  window.setTimeout(() => el.classList.remove('tick'), 260);
}

function updateCountdown() {
  const now = new Date();
  const diff = countdownTarget - now;

  if (diff <= 0) {
    tick(countdownEls.days, '0');
    tick(countdownEls.hours, '00');
    tick(countdownEls.minutes, '00');
    tick(countdownEls.seconds, '00');
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  tick(countdownEls.days, String(days));
  tick(countdownEls.hours, pad(hours));
  tick(countdownEls.minutes, pad(minutes));
  tick(countdownEls.seconds, pad(seconds));
}

function showOnly(target) {
  if (rsvpForm) rsvpForm.hidden = target !== 'form';
  if (rsvpSuccess) rsvpSuccess.hidden = target !== 'success';
  if (rsvpError) rsvpError.hidden = target !== 'error';
  if (rsvpClosed) rsvpClosed.hidden = target !== 'closed';
}

function applyRsvpDeadline() {
  const now = new Date();
  if (now >= rsvpDeadline) {
    showOnly('closed');
    return true;
  }
  showOnly('form');
  return false;
}

function setupReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  reveals.forEach(el => observer.observe(el));
}

function collectFormData(form) {
  const data = new FormData(form);
  const alcohol = data.getAll('alcohol').join(', ') || '—';

  return {
    name: data.get('name')?.trim() || '',
    registry: data.get('registry') || '',
    banquet: data.get('banquet') || '',
    alcohol,
    allergy: data.get('allergy')?.trim() || '—',
  };
}

async function sendRsvp(payload) {
  // Use form-encoded payload to avoid CORS preflight, especially for file:// origin.
  const body = new URLSearchParams(payload);

  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body,
  });

  // With no-cors we can't read the response; if fetch resolves, assume success.
  return response;
}

function setupForm() {
  if (!rsvpForm) return;

  rsvpForm.addEventListener('submit', async event => {
    event.preventDefault();

    if (!rsvpForm.checkValidity()) {
      rsvpForm.reportValidity();
      return;
    }

    const button = rsvpForm.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = true;
      button.textContent = 'Отправляем...';
    }

    try {
      const payload = collectFormData(rsvpForm);
      await sendRsvp(payload);
      showOnly('success');
    } catch (error) {
      showOnly('error');
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'Отправить';
      }
    }
  });

  if (rsvpRetry) {
    rsvpRetry.addEventListener('click', () => {
      showOnly('form');
    });
  }
}

function setupParallax() {
  if (!parallaxLayers.length) return;
  let frame = null;

  const onMove = event => {
    if (frame) return;
    const { innerWidth, innerHeight } = window;
    const x = (event.clientX / innerWidth - 0.5) * 2;
    const y = (event.clientY / innerHeight - 0.5) * 2;

    frame = window.requestAnimationFrame(() => {
      parallaxLayers.forEach((layer, index) => {
        const depth = (index + 1) * 6;
        layer.style.transform = `translate3d(${x * depth}px, ${y * depth}px, 0) scale(1.04)`;
      });
      frame = null;
    });
  };

  window.addEventListener('mousemove', onMove, { passive: true });
}

updateCountdown();
applyRsvpDeadline();
setupReveal();
setupForm();
setupParallax();

window.setInterval(updateCountdown, 1000);
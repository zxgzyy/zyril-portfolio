const startupScreen = document.querySelector(".startup-screen");
const startupProgress = document.querySelector(".startup-progress");
const startupPercent = document.querySelector("#startup-percent");
const startupBar = document.querySelector("#startup-bar");
const startupSoundButton = document.querySelector("#startup-sound");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.body.classList.add("intro-active");

const finishStartup = () => {
  startupProgress.setAttribute("aria-valuenow", "100");
  startupScreen.classList.add("is-done");
  document.body.classList.remove("intro-active");
};

const updateStartup = (percent) => {
  const value = String(percent).padStart(2, "0");
  startupPercent.textContent = `${value}%`;
  startupBar.style.width = `${percent}%`;
  startupProgress.setAttribute("aria-valuenow", String(percent));
};

const AudioContextConstructor = window.AudioContext;
let startupAudioContext;
let startupMasterGain;
let startupSoundEnabled = false;
let startupSoundAttempt = 0;

const playStartupSound = () => {
  const startAt = startupAudioContext.currentTime + 0.04;
  const addTone = (frequency, delay, duration, volume, type = "sine", endFrequency = frequency) => {
    const oscillator = startupAudioContext.createOscillator();
    const envelope = startupAudioContext.createGain();
    const toneStart = startAt + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, toneStart);
    if (endFrequency !== frequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, toneStart + duration);
    }
    envelope.gain.setValueAtTime(0.0001, toneStart);
    envelope.gain.exponentialRampToValueAtTime(volume, toneStart + duration * 0.16);
    envelope.gain.exponentialRampToValueAtTime(0.0001, toneStart + duration);
    oscillator.connect(envelope);
    envelope.connect(startupMasterGain);
    oscillator.start(toneStart);
    oscillator.stop(toneStart + duration + 0.02);
  };

  addTone(55, 0, 3.6, 0.2, "sine", 110);
  addTone(110, 0.55, 2.8, 0.075, "triangle");
  addTone(164.81, 0.55, 2.8, 0.065, "triangle");
  addTone(220, 0.55, 2.8, 0.055, "triangle");
  addTone(440, 2.15, 1.1, 0.08, "sine");
  addTone(659.25, 2.55, 1.25, 0.06, "sine");
  addTone(880, 2.95, 1.35, 0.045, "sine");
};

if (!AudioContextConstructor) {
  startupSoundButton.disabled = true;
  startupSoundButton.textContent = "Sound unavailable";
} else {
  const startStartupSound = async (automatic = false) => {
    const attempt = ++startupSoundAttempt;
    if (!startupAudioContext) {
      startupAudioContext = new AudioContextConstructor();
      startupMasterGain = startupAudioContext.createGain();
      startupMasterGain.gain.value = 0;
      startupMasterGain.connect(startupAudioContext.destination);
    }

    startupSoundButton.disabled = !automatic;
    startupSoundButton.textContent = automatic ? "Starting audio" : "Starting sound";
    try {
      const resume = startupAudioContext.resume().then(() => true);
      const resumed = await Promise.race([
        resume,
        new Promise((resolve) => window.setTimeout(() => resolve(false), 350))
      ]);
      if (attempt !== startupSoundAttempt) return;
      if (!resumed || startupAudioContext.state !== "running") {
        startupSoundButton.textContent = "♫ Tap for audio";
        startupSoundButton.disabled = false;
        return;
      }
    } catch (error) {
      if (attempt !== startupSoundAttempt) return;
      startupSoundButton.textContent = "♫ Tap for audio";
      startupSoundButton.disabled = false;
      if (!automatic) console.error("Could not start the portfolio intro sound.", error);
      return;
    }

    startupMasterGain.gain.setTargetAtTime(1, startupAudioContext.currentTime, 0.04);
    playStartupSound();
    startupSoundEnabled = true;
    startupSoundButton.disabled = false;
    startupSoundButton.setAttribute("aria-pressed", "true");
    startupSoundButton.textContent = "Mute sound";
    window.setTimeout(() => {
      if (!startupSoundEnabled) return;
      startupSoundEnabled = false;
      startupSoundButton.setAttribute("aria-pressed", "false");
      startupSoundButton.textContent = "Sound played";
      startupSoundButton.disabled = true;
    }, 4400);
  };

  startupSoundButton.addEventListener("click", () => {
    if (startupSoundEnabled) {
      startupMasterGain.gain.setTargetAtTime(0, startupAudioContext.currentTime, 0.025);
      startupSoundEnabled = false;
      startupSoundAttempt += 1;
      startupSoundButton.setAttribute("aria-pressed", "false");
      startupSoundButton.textContent = "Sound muted";
      startupSoundButton.disabled = true;
      return;
    }
    startStartupSound();
  });

  if (!reducedMotion) window.setTimeout(() => startStartupSound(true), 0);
}

if (reducedMotion) {
  updateStartup(100);
  window.setTimeout(finishStartup, 180);
} else {
  const startupDuration = 4400;
  const startedAt = performance.now();

  const animateStartup = (now) => {
    const progress = Math.min((now - startedAt) / startupDuration, 1);
    const easedProgress = 1 - (1 - progress) ** 2;
    updateStartup(Math.max(1, Math.floor(easedProgress * 100)));

    if (progress < 1) {
      window.requestAnimationFrame(animateStartup);
    } else {
      window.setTimeout(finishStartup, 250);
    }
  };

  window.requestAnimationFrame(animateStartup);
}

const navWrap = document.querySelector(".nav-wrap");
const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelector(".nav-links");
const siteProgress = document.querySelector(".site-progress");

window.addEventListener("scroll", () => {
  navWrap.classList.toggle("scrolled", window.scrollY > 20);
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollProgress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
  siteProgress.style.width = `${scrollProgress}%`;
}, { passive: true });

menuButton.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const delay = Number(entry.target.dataset.delay || 0);
    window.setTimeout(() => entry.target.classList.add("visible"), delay);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const portraitFrame = document.querySelector("#portrait-frame");
const idRig = document.querySelector("#id-rig");

const idPose = { angle: 0, angularVelocity: 0, twist: 0, twistVelocity: 0 };
let idDrag = null;
let idSpringFrame = 0;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const renderIdPose = () => {
  idRig.style.transform = `rotate(${idPose.angle}rad)`;
  portraitFrame.style.transform = `perspective(900px) rotateY(${idPose.twist}rad)`;
};

const settleId = () => {
  if (idSpringFrame) window.cancelAnimationFrame(idSpringFrame);
  if (reducedMotion) {
    Object.assign(idPose, { angle: 0, angularVelocity: 0, twist: 0, twistVelocity: 0 });
    idRig.style.transform = "";
    portraitFrame.style.transform = "";
    idRig.classList.remove("is-swinging");
    idSpringFrame = 0;
    return;
  }

  const gravity = 9.81;
  const lanyardLength = 0.65;
  const damping = 1.35;
  const twistStiffness = 38;
  const twistDamping = 8;
  idRig.classList.add("is-swinging");
  let previousTime = performance.now();
  const animate = (now) => {
    const elapsed = Math.min((now - previousTime) / 1000, 0.032);
    previousTime = now;
    const angularAcceleration = -(gravity / lanyardLength) * Math.sin(idPose.angle) - damping * idPose.angularVelocity;
    idPose.angularVelocity += angularAcceleration * elapsed;
    idPose.angle += idPose.angularVelocity * elapsed;
    const twistAcceleration = -twistStiffness * idPose.twist - twistDamping * idPose.twistVelocity;
    idPose.twistVelocity += twistAcceleration * elapsed;
    idPose.twist += idPose.twistVelocity * elapsed;

    if (
      Math.abs(idPose.angle) < 0.002 &&
      Math.abs(idPose.angularVelocity) < 0.015 &&
      Math.abs(idPose.twist) < 0.002 &&
      Math.abs(idPose.twistVelocity) < 0.015
    ) {
      Object.assign(idPose, { angle: 0, angularVelocity: 0, twist: 0, twistVelocity: 0 });
      idRig.style.transform = "";
      portraitFrame.style.transform = "";
      idRig.classList.remove("is-swinging");
      idSpringFrame = 0;
      return;
    }

    renderIdPose();
    idSpringFrame = window.requestAnimationFrame(animate);
  };

  idSpringFrame = window.requestAnimationFrame(animate);
};

portraitFrame.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || event.target.closest("input, button, a")) return;
  if (idSpringFrame) window.cancelAnimationFrame(idSpringFrame);
  idSpringFrame = 0;
  idRig.classList.remove("is-swinging");
  const rect = portraitFrame.getBoundingClientRect();
  const normalizedX = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
  idDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    lastTime: performance.now(),
    baseAngle: idPose.angle
  };
  idPose.angularVelocity = 0;
  idPose.twist = -normalizedX * 0.36;
  idPose.twistVelocity = 0;
  idRig.classList.add("is-dragging");
  renderIdPose();
  portraitFrame.setPointerCapture(event.pointerId);
  event.preventDefault();
});

portraitFrame.addEventListener("pointermove", (event) => {
  if (!idDrag || event.pointerId !== idDrag.pointerId) return;
  const now = performance.now();
  const elapsed = Math.max(now - idDrag.lastTime, 1) / 1000;
  const deltaX = event.clientX - idDrag.startX;
  const deltaY = event.clientY - idDrag.startY;
  const moveX = event.clientX - idDrag.lastX;
  const moveY = event.clientY - idDrag.lastY;
  const radiansPerPixel = Math.PI / 720;
  const angularMovement = moveX * radiansPerPixel + moveY * 0.0006;
  const instantAngularVelocity = angularMovement / elapsed;
  const rect = portraitFrame.getBoundingClientRect();
  const normalizedX = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
  const targetTwist = -normalizedX * 0.36;
  const twistMovement = (targetTwist - idPose.twist) / elapsed;

  idPose.angle = clamp(idDrag.baseAngle + deltaX * radiansPerPixel + deltaY * 0.0006, -0.75, 0.75);
  idPose.angularVelocity = clamp(idPose.angularVelocity * 0.55 + instantAngularVelocity * 0.45, -5.5, 5.5);
  idPose.twistVelocity = clamp(idPose.twistVelocity * 0.55 + twistMovement * 0.45, -2.5, 2.5);
  idPose.twist = targetTwist;
  idDrag.lastX = event.clientX;
  idDrag.lastY = event.clientY;
  idDrag.lastTime = now;
  renderIdPose();
});

const finishIdDrag = (event) => {
  if (!idDrag || event.pointerId !== idDrag.pointerId) return;
  idDrag = null;
  idRig.classList.remove("is-dragging");
  settleId();
};

portraitFrame.addEventListener("pointerup", finishIdDrag);
portraitFrame.addEventListener("pointercancel", finishIdDrag);

if (window.matchMedia("(pointer: fine)").matches) {
  window.addEventListener("pointermove", (event) => {
    document.body.classList.add("cursor-active");
    document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
  }, { passive: true });

  portraitFrame.addEventListener("mousemove", (event) => {
    if (idDrag || idSpringFrame) return;
    const rect = portraitFrame.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    portraitFrame.style.transform = `perspective(800px) rotateY(${x * 5}deg) rotateX(${y * -5}deg)`;
  });
  portraitFrame.addEventListener("mouseleave", () => {
    if (idDrag || idSpringFrame) return;
    portraitFrame.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg)";
  });
}

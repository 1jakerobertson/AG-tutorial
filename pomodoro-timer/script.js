const timeDisplay = document.getElementById('time-display');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const progressCircle = document.getElementById('progress-circle');
const timeInput = document.getElementById('time-input');

let workTime = parseInt(timeInput.value, 10) * 60 || (25 * 60);
let timeLeft = workTime;
let timerId = null;
let isRunning = false;

// Set up SVG progress circle perimeter
const radius = progressCircle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;
progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
progressCircle.style.strokeDashoffset = 0;

function setProgress(percent) {
    // 100% means 0 offset, 0% means full offset
    const offset = circumference - (percent / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update SVG progress ring
    const percent = (timeLeft / workTime) * 100;
    setProgress(percent);
}

// Generate an elegant notification chime using the Web Audio API
function playNotificationSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Sweet, bell-like tone
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);    // A5
    osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.2); // C6

    // Envelope for a smooth fade out
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5); // Slow decay

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.6);
}

function toggleTimer() {
    if (isRunning) {
        // Pause timer
        clearInterval(timerId);
        startBtn.textContent = 'Start';
        isRunning = false;
    } else {
        // Start timer

        // Ensure AudioContext can be initialized or resumed on user interaction
        if (window.AudioContext || window.webkitAudioContext) {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
        }

        timerId = setInterval(() => {
            timeLeft--;
            updateDisplay();

            if (timeLeft <= 0) {
                // Time is up
                clearInterval(timerId);
                isRunning = false;
                startBtn.textContent = 'Start';

                // Set to 0 strictly and play sound
                timeLeft = 0;
                updateDisplay();
                playNotificationSound();
            }
        }, 1000);

        startBtn.textContent = 'Pause';
        isRunning = true;
    }
}

function resetTimer() {
    clearInterval(timerId);
    isRunning = false;
    workTime = parseInt(timeInput.value, 10) * 60;
    if (isNaN(workTime) || workTime <= 0) workTime = 25 * 60;
    timeLeft = workTime;
    startBtn.textContent = 'Start';

    // Disable transition temporarily to avoid unwinding animation delay
    progressCircle.style.transition = 'none';
    updateDisplay();
    // Re-enable transition on the next frame
    setTimeout(() => {
        progressCircle.style.transition = 'stroke-dashoffset 1s linear';
    }, 50);
}

// Event Listeners
startBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);
timeInput.addEventListener('change', () => {
    if (!isRunning) {
        resetTimer();
    }
});

// Initialize timer display state
updateDisplay();

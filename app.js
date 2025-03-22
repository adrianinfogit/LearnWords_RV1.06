let deck = [];
let hardQueue = []; // Each item: { card, target }
let newWordCount = 0;
let currentCard = null;
let totalCards = 0;
let correctCount = 0;

// Load the words from the JSON file and shuffle them
function loadCards() {
  fetch('words.json')
    .then(response => response.json())
    .then(data => {
      deck = data;
      totalCards = deck.length;
      shuffle(deck);
      showNextCard();
      updateStats();
    })
    .catch(error => {
      document.getElementById("original-word").textContent = "Error loading cards.";
      console.error("Error loading JSON:", error);
    });
}

// Display the next flashcard, checking if any "hard" cards should be reinserted.
function showNextCard() {
  document.getElementById("user-answer").value = "";
  document.getElementById("feedback").textContent = "";
  document.getElementById("translated-word").style.display = "none";
  document.getElementById("submit-btn").style.display = "inline-flex";
  document.getElementById("show-btn").style.display = "inline-flex";
  document.getElementById("hard-btn").style.display = "inline-flex";
  document.getElementById("easy-btn").style.display = "inline-flex";

  hardQueue = hardQueue.filter(item => {
    if (newWordCount >= item.target) {
      deck.push(item.card);
      return false;
    }
    return true;
  });

  if (deck.length === 0) {
    document.getElementById("flashcard").innerHTML = `
      <h2>Session complete!</h2>
      <p>You've completed all the flashcards.</p>
      <p>Correct answers: ${correctCount}/${totalCards}</p>
      <button onclick="window.location.reload()">Start Over</button>
    `;
    return;
  }

  currentCard = deck.shift();
  newWordCount++;

  const wordElement = document.getElementById("original-word");
  wordElement.style.opacity = 0;
  setTimeout(() => {
    wordElement.textContent = currentCard.original;
    wordElement.style.opacity = 1;
  }, 200);

  document.getElementById("translated-word").textContent = currentCard.translated;

  updateProgress();

  setTimeout(() => {
    document.getElementById("user-answer").focus();
  }, 300);

  updateStats();
}

function checkAnswer() {
  const userInput = document.getElementById("user-answer").value.trim().toLowerCase();
  const correctAnswer = currentCard.translated.trim().toLowerCase();
  const feedbackElement = document.getElementById("feedback");

  if (userInput === correctAnswer) {
    feedbackElement.textContent = "Correct! 🎉";
    feedbackElement.style.color = "var(--correct-color)";
    feedbackElement.style.backgroundColor = "rgba(76, 175, 80, 0.1)";
    correctCount++;
  } else {
    feedbackElement.textContent = "Incorrect. Try again or click 'Show Translation'.";
    feedbackElement.style.color = "var(--incorrect-color)";
    feedbackElement.style.backgroundColor = "rgba(244, 67, 54, 0.1)";
  }

  feedbackElement.style.padding = "10px";
  feedbackElement.style.borderRadius = "8px";
  feedbackElement.classList.add("pulse");

  setTimeout(() => {
    feedbackElement.classList.remove("pulse");
  }, 500);
}

function markAsHard() {
  const target = newWordCount + 10;
  hardQueue.push({ card: currentCard, target: target });

  const feedbackElement = document.getElementById("feedback");
  feedbackElement.textContent = "Marked as hard. Will reappear later.";
  feedbackElement.style.color = "var(--hard-color)";
  feedbackElement.style.backgroundColor = "rgba(255, 152, 0, 0.1)";
  feedbackElement.style.padding = "10px";
  feedbackElement.style.borderRadius = "8px";

  updateStats();
}

function updateProgress() {
  const progressBar = document.getElementById("progress-bar");
  const progress = (newWordCount / totalCards) * 100;
  progressBar.style.width = `${progress}%`;
}

function updateStats() {
  document.getElementById("remaining-count").textContent = `Cards remaining: ${deck.length}`;
  document.getElementById("hard-count").textContent = `Hard cards: ${hardQueue.length}`;
}

document.getElementById("submit-btn").addEventListener("click", checkAnswer);

document.getElementById("user-answer").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // prevent form submission or unexpected behavior
    checkAnswer();
  }
});

document.getElementById("show-btn").addEventListener("click", () => {
  const translatedElement = document.getElementById("translated-word");
  translatedElement.style.display = "block";
  translatedElement.classList.add("pulse");
  setTimeout(() => {
    translatedElement.classList.remove("pulse");
  }, 500);
});

document.getElementById("hard-btn").addEventListener("click", markAsHard);

document.getElementById("easy-btn").addEventListener("click", markAsEasy);

document.getElementById("next-btn").addEventListener("click", showNextCard);

function markAsEasy() {
  const cardInHardQueue = hardQueue.findIndex(item =>
    item.card.original === currentCard.original &&
    item.card.translated === currentCard.translated
  );

  const feedbackElement = document.getElementById("feedback");

  if (cardInHardQueue !== -1) {
    hardQueue.splice(cardInHardQueue, 1);
    feedbackElement.textContent = "Card removed from hard queue! ✓";
  } else {
    feedbackElement.textContent = "Card marked as easy ✓";
  }

  feedbackElement.style.color = "var(--correct-color)";
  feedbackElement.style.backgroundColor = "rgba(76, 175, 80, 0.1)";
  feedbackElement.style.padding = "10px";
  feedbackElement.style.borderRadius = "8px";
  feedbackElement.classList.add("pulse");
  setTimeout(() => {
    feedbackElement.classList.remove("pulse");
  }, 500);

  updateStats();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

window.onload = loadCards;


// Save progress to localStorage
function saveProgress() {
  localStorage.setItem("flashcard_deck", JSON.stringify(deck));
  localStorage.setItem("hard_queue", JSON.stringify(hardQueue));
  localStorage.setItem("new_word_count", newWordCount);
  localStorage.setItem("correct_count", correctCount);
}

// Load progress from localStorage if available
function loadProgress() {
  const savedDeck = localStorage.getItem("flashcard_deck");
  const savedHardQueue = localStorage.getItem("hard_queue");
  const savedNewWordCount = localStorage.getItem("new_word_count");
  const savedCorrectCount = localStorage.getItem("correct_count");

  if (savedDeck && savedHardQueue) {
    deck = JSON.parse(savedDeck);
    hardQueue = JSON.parse(savedHardQueue);
    newWordCount = parseInt(savedNewWordCount) || 0;
    correctCount = parseInt(savedCorrectCount) || 0;
    totalCards = deck.length + hardQueue.length;
    showNextCard();
    updateStats();
    return true;
  }
  return false;
}

// Clear saved progress
function resetProgress() {
  localStorage.removeItem("flashcard_deck");
  localStorage.removeItem("hard_queue");
  localStorage.removeItem("new_word_count");
  localStorage.removeItem("correct_count");
  window.location.reload();
}

// Hook saveProgress into existing functions
function wrapWithSaveProgress(fn) {
  return function(...args) {
    fn.apply(this, args);
    saveProgress();
  };
}

// Hook key functions
checkAnswer = wrapWithSaveProgress(checkAnswer);
markAsHard = wrapWithSaveProgress(markAsHard);
markAsEasy = wrapWithSaveProgress(markAsEasy);
showNextCard = wrapWithSaveProgress(showNextCard);

// Run load or fallback
window.onload = () => {
  if (!loadProgress()) {
    loadCards();
  }
};

// Add reset button behavior
document.addEventListener("DOMContentLoaded", () => {
  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetProgress);
  }
});

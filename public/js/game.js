document.addEventListener("DOMContentLoaded", () => {
  const gameContainer = document.getElementById("game-container");

  async function loadGame() {
    gameContainer.innerHTML =
      '<p class="text-center">Завантаження питання...</p>';

    try {
      const response = await fetch("/api/game-words?count=4");
      if (!response.ok) {
        throw new Error(
          "Не вдалося завантажити слова. Спробуйте додати слова у словник."
        );
      }

      const words = await response.json();

      if (words.length < 4) {
        showError("Потрібно щонайменше 4 слова у словнику, щоб почати гру.");
        return;
      }

      const correctWord = words[0];
      const options = shuffleArray(words);

      renderGameUI(correctWord, options);
    } catch (error) {
      showError(error.message);
    }
  }

  function renderGameUI(correctWord, options) {
    const optionsHtml = options
      .map((word) => {
        return `
          <button class="btn btn-outline-primary w-100 mb-2 game-option" 
                  data-word-eng="${word.english}">
            ${word.ukrainian}
          </button>
        `;
      })
      .join("");

    gameContainer.innerHTML = `
        <h3 class="text-center mb-4">Який переклад слова:</h3>
        <h2 class="text-center display-5 mb-4">${correctWord.english}</h2>
        
        <div id="options-container">
          ${optionsHtml}
        </div>
        
        <div id="result-container" class="mt-3"></div>
        
        <button classid="btn btn-success w-100 mt-3 d-none" id="next-button">
          Наступне питання
        </button>
      `;

    addGameListeners(correctWord);
  }

  function addGameListeners(correctWord) {
    const optionsContainer = document.getElementById("options-container");
    const resultContainer = document.getElementById("result-container");
    const nextButton = document.getElementById("next-button");
    const allOptionButtons = document.querySelectorAll(".game-option");

    optionsContainer.addEventListener("click", (e) => {
      if (!e.target.classList.contains("game-option")) {
        return;
      }

      allOptionButtons.forEach((btn) => (btn.disabled = true));

      const clickedButton = e.target;
      const selectedEngWord = clickedButton.dataset.wordEng;

      if (selectedEngWord === correctWord.english) {
        clickedButton.classList.remove("btn-outline-primary");
        clickedButton.classList.add("btn-success");
        resultContainer.innerHTML =
          '<div class="alert alert-success">Правильно!</div>';
      } else {
        clickedButton.classList.remove("btn-outline-primary");
        clickedButton.classList.add("btn-danger");
        resultContainer.innerHTML = `
            <div class="alert alert-danger">
              Неправильно. Правильний переклад: <strong>${correctWord.ukrainian}</strong>
            </div>
          `;

        allOptionButtons.forEach((btn) => {
          if (btn.dataset.wordEng === correctWord.english) {
            btn.classList.remove("btn-outline-primary");
            btn.classList.add("btn-success");
          }
        });
      }

      nextButton.classList.remove("d-none");
    });

    nextButton.addEventListener("click", () => {
      loadGame();
    });
  }

  function showError(message) {
    gameContainer.innerHTML = `
        <div class="alert alert-warning">
          <strong>Помилка:</strong> ${message}
        </div>
        <a href="/" class="btn btn-primary">Додати слова</a>
      `;
  }

  function shuffleArray(array) {
    let currentIndex = array.length,
      randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    return array;
  }

  loadGame();
});

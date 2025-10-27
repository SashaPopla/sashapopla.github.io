document.addEventListener("DOMContentLoaded", () => {
  const uploadForm = document.getElementById("uploadForm");
  const fileInput = document.getElementById("fileInput");
  const statusMessage = document.getElementById("statusMessage");
  const uploadButton = document.getElementById("uploadButton");

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!fileInput.files || fileInput.files.length === 0) {
      showMessage("Будь ласка, виберіть файл.", "danger");
      return;
    }

    uploadButton.disabled = true;
    uploadButton.textContent = "Обробка...";
    showMessage(
      "Завантаження та обробка файлу... Це може зайняти хвилину.",
      "info"
    );

    const formData = new FormData();
    formData.append("wordFile", fileInput.files[0]);

    try {
      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Сталася помилка на сервері.");
      }

      showMessage(`Успішно додано ${result.wordsAdded} нових слів!`, "success");
      uploadForm.reset();
    } catch (error) {
      console.error("Помилка відправки:", error);
      showMessage(`Помилка: ${error.message}`, "danger");
    } finally {
      uploadButton.disabled = false;
      uploadButton.textContent = "Завантажити та Обробити";
    }
  });

  function showMessage(message, type = "info") {
    statusMessage.innerHTML = `
        <div class="alert alert-${type}" role="alert">
          ${message}
        </div>
      `;
  }
});

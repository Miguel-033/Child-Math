let questions = [];
let currentQuestion = 0;
let results = [];
let extraTasks = [];
let textTasks = [];
let totalPoints = 0;
let redeemedRewards = []; // Хранение информации о полученных наградах

const botToken = "6336840308:AAFyOLTbq6eimWOyCStkqtPXCLJHGoFcrb4";
const chatId = "5895553185";

// Загрузка баллов из базы данных
fetch("/points")
  .then((response) => response.json())
  .then((data) => {
    totalPoints = data.points;
    document.getElementById("current-points").innerText = totalPoints;
    displayRewards(); // Отображаем награды после загрузки баллов
  });

const rewards = [
  { name: "Наклейки", points: 50 },
  { name: "Время на просмотр любимых мультфильмов (1- час)", points: 13 },
  { name: "Специальные мероприятия", points: 55 },
  { name: "Деньги  1- евро", points: 90 },
];

fetch("tasks.json")
  .then((response) => response.json())
  .then((data) => {
    extraTasks = getRandomItems(data.extraTasks, 4); // Берем 4 случайные задачи
    textTasks = getRandomItems(data.textTasks, 2); // Берем 2 случайные текстовые задачи
    generateQuestions();
    showQuestion();
  })
  .catch((error) => console.error("Error loading tasks:", error));

function getRandomItems(array, numItems) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numItems);
}

function generateQuestions() {
  for (let i = 0; i < 10; i++) {
    const num1 = Math.floor(Math.random() * 16);
    const num2 = Math.floor(Math.random() * 16);
    const isAddition = Math.random() > 0.5;
    const question = {
      num1: num1,
      num2: num2,
      isAddition: isAddition,
      answer: isAddition ? num1 + num2 : num1 - num2,
    };
    questions.push(question);
  }
}

function showQuestion() {
  if (currentQuestion < questions.length) {
    const question = questions[currentQuestion];
    const operation = question.isAddition ? "+" : "-";
    document.getElementById(
      "question"
    ).innerText = `${question.num1} ${operation} ${question.num2} = ?`;
  } else {
    showExtraTasks(0);
  }
}

function checkAnswer() {
  const userAnswer = document.getElementById("answer").value.trim();
  const correctAnswer = questions[currentQuestion].answer;
  const result = {
    question: `${questions[currentQuestion].num1} ${
      questions[currentQuestion].isAddition ? "+" : "-"
    } ${questions[currentQuestion].num2}`,
    userAnswer: userAnswer,
    correctAnswer: correctAnswer,
    isCorrect: parseInt(userAnswer) === correctAnswer,
  };
  results.push(result);
  if (result.isCorrect) {
    totalPoints += 1; // Один правильный ответ - один балл
    updatePointsDisplay();
  }
  currentQuestion++;
  document.getElementById("answer").value = "";
  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    showExtraTasks(0);
  }
}

function showExtraTasks(taskIndex) {
  if (taskIndex < extraTasks.length) {
    const task = extraTasks[taskIndex];
    const [text, question] = task.question.split(" Вопрос: ");
    document.getElementById("question").innerHTML = `
            <div class="text-task">
                <strong>Прочитайте следующий текст и ответьте на вопрос.</strong>
                <div style="padding-bottom: 25px;">
                    ${text}
                </div>
            </div>`;
    document.querySelector("button").onclick = function () {
      checkExtraTaskAnswer(taskIndex);
    };
  } else {
    showTextTask(0);
  }
}

function checkExtraTaskAnswer(taskIndex) {
  const userAnswer = document.getElementById("answer").value.trim();
  const correctAnswer = extraTasks[taskIndex].answer;
  const result = {
    question: extraTasks[taskIndex].question,
    userAnswer: userAnswer,
    correctAnswer: correctAnswer,
    isCorrect: userAnswer === correctAnswer,
  };
  results.push(result);
  if (result.isCorrect) {
    totalPoints += 1; // Один правильный ответ - один балл
    updatePointsDisplay();
  }
  document.getElementById("answer").value = "";
  showExtraTasks(taskIndex + 1);
}

function showTextTask(taskIndex) {
  if (taskIndex < textTasks.length) {
    const task = textTasks[taskIndex];
    const [text, question] = task.question.split(" Вопрос: ");
    document.getElementById("question").innerHTML = `
            <div class="text-task">
                <strong>Прочитайте следующий текст и ответьте на вопрос.</strong>
                <div style="padding-bottom: 25px;">
                    <em>Текст:</em><br>
                    ${text}
                </div>
                <em>Вопрос:</em><br>
                ${question}
            </div>`;
    document.querySelector("button").onclick = function () {
      checkTextTaskAnswer(taskIndex);
    };
  } else {
    showFinalResults();
  }
}

function checkTextTaskAnswer(taskIndex) {
  const userAnswer = document.getElementById("answer").value.trim();
  const correctAnswer = textTasks[taskIndex].answer;
  const result = {
    question: textTasks[taskIndex].question,
    userAnswer: userAnswer,
    correctAnswer: correctAnswer,
    isCorrect: userAnswer.toLowerCase() === correctAnswer,
  };
  results.push(result);
  if (result.isCorrect) {
    totalPoints += 1; // Один правильный ответ - один балл
    updatePointsDisplay();
  }
  document.getElementById("answer").value = "";
  showTextTask(taskIndex + 1);
}

function showFinalResults() {
  let resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<h2>Результаты</h2>";
  results.forEach((result) => {
    let resultElement = document.createElement("div");
    resultElement.innerText = `${result.question} = ${result.userAnswer}`;
    if (!result.isCorrect) {
      resultElement.classList.add("incorrect");
      resultElement.innerText += ` (Correct: ${result.correctAnswer})`;
    }
    resultsDiv.appendChild(resultElement);
  });

  resultsDiv.innerHTML += `<p>Общее количество баллов: ${totalPoints}</p>`;
  resultsDiv.innerHTML += `<p>Заработано баллов: ${
    results.filter((r) => r.isCorrect).length
  }</p>`;
  savePoints(totalPoints);
  sendResultsToTelegram();
  document.getElementById("question").style.display = "none";
  document.getElementById("answer").style.display = "none";
  document.querySelector("button").style.display = "none";
  document.getElementById("restart-button").classList.remove("hidden");
}

function sendResultsToTelegram() {
  let message = `Math Practice Results:\n\nTotal Points: ${totalPoints}\n\n`;
  results.forEach((result) => {
    message += `${result.question} = ${result.userAnswer}`;
    if (!result.isCorrect) {
      message += ` (Correct: ${result.correctAnswer})`;
    }
    message += "\n\n"; // Добавляем двойной разрыв строки для улучшения читаемости
  });

  if (redeemedRewards.length > 0) {
    message += "\nRedeemed Rewards:\n";
    redeemedRewards.forEach((reward) => {
      message += `${reward.name} - ${reward.points} points\n`;
    });
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(
    message
  )}`;
  fetch(url).then((response) => {
    if (response.ok) {
      console.log("Results sent to Telegram");
    } else {
      console.error("Error sending results to Telegram");
    }
  });
}

function savePoints(points) {
  fetch("/points", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ points }),
  });
}

function updatePointsDisplay() {
  document.getElementById("current-points").innerText = totalPoints;
  savePoints(totalPoints);
  displayRewards(); // Обновляем отображение наград при изменении баллов
}

function restart() {
  location.reload();
}

function openRewards() {
  document.getElementById("rewardsModal").style.display = "block";
}

function closeRewards() {
  document.getElementById("rewardsModal").style.display = "none";
}

function displayRewards() {
  const rewardsList = document.getElementById("rewards-list");
  rewardsList.innerHTML = "";
  rewards.forEach((reward) => {
    const rewardItem = document.createElement("li");
    rewardItem.innerText = `${reward.name} - ${reward.points} баллов`;
    const redeemButton = document.createElement("button");
    redeemButton.innerText = "Redeem";
    redeemButton.disabled = totalPoints < reward.points;
    redeemButton.onclick = function () {
      redeemReward(reward);
    };
    rewardItem.appendChild(redeemButton);
    rewardsList.appendChild(rewardItem);
  });
}

function redeemReward(reward) {
  if (totalPoints >= reward.points) {
    totalPoints -= reward.points;
    updatePointsDisplay();
    redeemedRewards.push(reward); // Добавляем информацию о награде пользователя
    alert(`You have redeemed ${reward.name}!`);
    displayRewards(); // Обновляем отображение наград после обмена
    sendResultsToTelegram(); // Отправляем обновленные результаты в Telegram
  } else {
    alert("Not enough points to redeem this reward.");
  }
}

// 宣告變數
let questionsTable; // 儲存 CSV 資料的 p5.Table 物件
let questions = [];   // 儲存格式化後的題目陣列
let currentQuestionIndex = 0; // 當前題目索引
let score = 0;        // 學生分數
let quizState = 'QUIZ'; // 測驗狀態: 'QUIZ' (作答中), 'RESULT' (結果顯示)
let selectedOption = null; // 當前選取的選項 (a, b, c)
let buttonLayout = {}; // 將按鈕佈局設為全域，以便 mousePressed 存取

// 用於游標和選項特效的變數
let cursorSize = 10;
let feedbackAnimationTimer = 0; // 動畫計時器
let feedbackMessage = "";

// --- 1. 資料載入 ---
function preload() {
  // 載入 CSV 檔案。'csv' 表示逗號分隔，'header' 表示第一行是標題。
  // 必須放在 preload() 中以確保在 setup() 之前載入完成。
  questionsTable = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  
  // 將 p5.Table 資料轉換為更易於使用的 JavaScript 物件陣列
  for (let r = 0; r < questionsTable.getRowCount(); r++) {
    questions.push({
      id: questionsTable.getString(r, 'id'),
      question: questionsTable.getString(r, 'question'),
      options: {
        a: questionsTable.getString(r, 'option_a'),
        b: questionsTable.getString(r, 'option_b'),
        c: questionsTable.getString(r, 'option_c')
      },
      correct: questionsTable.getString(r, 'correct_answer')
    });
  }
}

// --- 2. 主繪圖迴圈 ---
function draw() {
  background(240);

  if (quizState === 'QUIZ') {
    drawQuizScreen();
    drawCursorEffect(); // 游標特效
  } else if (quizState === 'RESULT') {
    drawResultScreen();
  }
}

// --- 3. 測驗畫面繪製 ---
function drawQuizScreen() {
  if (currentQuestionIndex >= questions.length) {
    // 所有題目回答完畢
    quizState = 'RESULT';
    return;
  }

  let q = questions[currentQuestionIndex];
  
  // --- 題目繪製 (已修改) ---
  // 動態調整文字大小
  let baseFontSize = min(width, height) * 0.04; //  
  textSize(baseFontSize * 0.7);
  fill(50);
  textAlign(CENTER, CENTER); // 標題置中
  text(`第 ${q.id} 題 / 共 ${questions.length} 題`, width / 2, height * 0.08);
  
  text(`第 ${q.id} 題 / 共 ${questions.length} 題`, width * 0.1, height * 0.05); // 調整標題位置到左上角
  
  textSize(baseFontSize);
  textAlign(CENTER, TOP); // 將題目文字設為靠左、靠上對齊
  // 在一個矩形區域內繪製題目，讓長文字可以自動換行
  text(q.question, width * 0.1, height * 0.15, width * 0.8, height * 0.3);

  // --- 選項繪製與互動區域 (已修改) ---
  let options = ['a', 'b', 'c'];
  // 按鈕佈局參數 (改為相對單位)
  const btnWidth = width * 0.25;
  const btnHeight = height * 0.1;
  const horizontalSpacing = width * 0.02;
  const singleRowY = height * 0.65;
  const totalWidth = (btnWidth * 3) + (horizontalSpacing * 2); // 計算總寬度
  const startX = (width - totalWidth) / 2; // 計算起始 X 座標以使其置中

  // 更新全域的 buttonLayout 物件
  buttonLayout = {
    'a': { x: startX + btnWidth / 2, y: singleRowY, w: btnWidth, h: btnHeight },
    'b': { x: startX + btnWidth + horizontalSpacing + btnWidth / 2, y: singleRowY, w: btnWidth, h: btnHeight },
    'c': { x: startX + (btnWidth + horizontalSpacing) * 2 + btnWidth / 2, y: singleRowY, w: btnWidth, h: btnHeight }
  };

  for (const optionKey of options) {
    const layout = buttonLayout[optionKey];
    // 檢查滑鼠是否在選項上 (注意：rectMode 是 CENTER)
    const isHover = mouseX > layout.x - layout.w / 2 && mouseX < layout.x + layout.w / 2 &&
                    mouseY > layout.y - layout.h / 2 && mouseY < layout.y + layout.h / 2;

    // 設定選項顏色和特效
    if (selectedOption === optionKey) {
      fill(150, 200, 255); // 選取時
    } else if (isHover) {
      fill(200); // 懸停時
    } else {
      fill(220); // 預設
    }

    stroke(50);
    rect(layout.x, layout.y, layout.w, layout.h, 10); // 繪製圓角矩形

    // 繪製選項文字
    fill(50);
    textSize(baseFontSize * 0.6);
    textAlign(CENTER, CENTER); // 選項文字置中
    text(`${optionKey.toUpperCase()}. ${q.options[optionKey]}`, layout.x, layout.y);
  }

  // 顯示選取選項的即時反饋動畫 (如果有)
  if (feedbackAnimationTimer > 0) {
    drawFeedbackAnimation();
  }
}

// --- 4. 結果畫面繪製與成績動畫 ---
function drawResultScreen() {
  let percentage = (score / questions.length) * 100;
  textSize(40);
  fill(50);
  text("測驗結果", width / 2, 100);
  
  textSize(60);
  text(`分數: ${score} / ${questions.length}`, width / 2, 200);
  
  // 根據成績顯示不同的動畫
  if (percentage >= 80) {
    // 稱讚的動畫
    drawPraiseAnimation(percentage);
  } else if (percentage >= 50) {
    // 鼓勵的動畫 (中等成績)
    drawEncouragementAnimation(percentage);
  } else {
    // 繼續努力的動畫 (低分)
    drawTryAgainAnimation(percentage);
  }
}

// --- 5. 互動與視窗大小調整 ---
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  if (quizState !== 'QUIZ') return;

  for (const optionKey in buttonLayout) {
    const layout = buttonLayout[optionKey];
    if (mouseX > layout.x - layout.w / 2 && mouseX < layout.x + layout.w / 2 &&
        mouseY > layout.y - layout.h / 2 && mouseY < layout.y + layout.h / 2) {
      selectedOption = optionKey; // 標記選取的選項
      checkAnswer(); // 檢查答案並進入下一題
      return;
    }
  }
}

// --- 6. 邏輯與狀態轉換 ---
function checkAnswer() {
  if (selectedOption === null) return;
  
  let q = questions[currentQuestionIndex];
  let isCorrect = selectedOption === q.correct;

  if (isCorrect) {
    score++;
    feedbackMessage = "✅ 答對了！";
  } else {
    feedbackMessage = `❌ 答錯了！正確答案是 ${q.correct.toUpperCase()}`;
  }

  // 啟動選項反饋動畫
  feedbackAnimationTimer = 100; // 設置一個計時器 (例如 100 幀)
  
  // 等待一段時間後進入下一題
  setTimeout(() => {
    selectedOption = null;
    currentQuestionIndex++;
  }, 1000); // 延遲 1 秒
}

// --- 7. 特效和動畫函式 ---

// 游標特效：跟隨滑鼠的閃爍/大小變化效果
function drawCursorEffect() {
  noStroke();
  let mappedSize = map(sin(frameCount * 0.1), -1, 1, 10, 25); // 讓大小律動
  fill(255, 150, 0, 150); // 半透明橙色
  ellipse(mouseX, mouseY, mappedSize, mappedSize);
  
  fill(255, 255, 255, 100); // 白色閃光
  ellipse(mouseX, mouseY, cursorSize, cursorSize);
}

// 選項選取時的即時反饋動畫
function drawFeedbackAnimation() {
  feedbackAnimationTimer--;
  let alpha = map(feedbackAnimationTimer, 0, 100, 0, 255); // 逐漸淡出

  push();
  textSize(30);
  fill(0, 150, 0, alpha); // 綠色 (答對) 或紅色 (答錯)
  if (feedbackMessage.includes('❌')) {
      fill(255, 0, 0, alpha);
  }
  text(feedbackMessage, width / 2, height - 50);
  pop();
}

// 成績動畫範例：稱讚 (高分)
function drawPraiseAnimation(percentage) {
  // 滿天星或爆炸的紙屑效果
  let starCount = map(percentage, 80, 100, 5, 50);
  randomSeed(1); // 保持星星位置穩定

  for (let i = 0; i < starCount; i++) {
    let x = random(width);
    let y = random(height);
    let size = random(5, 15);
    
    // 讓星星閃爍
    let flash = map(sin(frameCount * 0.1 + i), -1, 1, 0, 255);
    fill(255, 255, 0, flash);
    star(x, y, size * 0.4, size, 5); // 繪製五角星
  }

  textSize(50);
  fill(255, 150, 0);
  text("🎊 太棒了！你是 p5.js 大師！ 🎊", width / 2, 350);
}

// 成績動畫範例：鼓勵 (中等分數)
function drawEncouragementAnimation(percentage) {
  // 溫和的波浪線或進度條
  push();
  noFill();
  stroke(0, 100, 200); // 藍色
  strokeWeight(5);
  beginShape();
  for (let x = 0; x <= width; x += 10) {
    let y = 350 + sin(x * 0.02 + frameCount * 0.05) * 30;
    vertex(x, y);
  }
  endShape();
  pop();
  
  textSize(40);
  fill(0, 100, 200);
  text("👍 表現不錯！再接再厲！", width / 2, 350);
}

// 成績動畫範例：繼續努力 (低分)
function drawTryAgainAnimation(percentage) {
  // 一個緩慢旋轉的箭頭指示前進
  push();
  translate(width / 2, 350);
  rotate(frameCount * 0.02);
  fill(200, 50, 0); // 紅色
  triangle(-20, 0, 20, 0, 0, -50); // 簡單的箭頭
  pop();
  
  textSize(40);
  fill(200, 50, 0);
  text("💪 繼續努力！下次會更好！", width / 2, 450);
}


// 輔助函式：繪製五角星 (用於稱讚動畫)
function star(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}
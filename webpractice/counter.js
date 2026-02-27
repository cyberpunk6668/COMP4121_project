// counter.js
// 独立的 JavaScript 文件：负责计数器的交互逻辑

'use strict';

// 使用 defer 加载时，脚本会在 DOM 解析完成后执行

// 1. 获取HTML元素
const counterElement = document.getElementById('counter');
const incrementBtn = document.getElementById('increment-btn');
const decrementBtn = document.getElementById('decrement-btn');
const resetBtn = document.getElementById('reset-btn');
const historyList = document.getElementById('history-list');

// 2. 初始化计数器
let count = 0;

// 3. 更新显示的函数
function updateDisplay() {
    counterElement.textContent = count;

    // 根据数值改变颜色
    if (count > 0) {
        counterElement.style.color = '#4CAF50'; // 绿色
    } else if (count < 0) {
        counterElement.style.color = '#f44336'; // 红色
    } else {
        counterElement.style.color = '#2575fc'; // 蓝色
    }
}

// 4. 添加历史记录
function addHistory(action) {
    const timestamp = new Date().toLocaleTimeString();
    const historyItem = document.createElement('li');
    historyItem.textContent = `${timestamp}: ${action} -> 当前值: ${count}`;
    historyList.prepend(historyItem); // 添加到列表顶部

    // 保持最多10条历史记录
    if (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
}

// 5. 为按钮添加事件监听器
incrementBtn.addEventListener('click', function () {
    count++;
    updateDisplay();
    addHistory('增加了1');
});

decrementBtn.addEventListener('click', function () {
    count--;
    updateDisplay();
    addHistory('减少了1');
});

resetBtn.addEventListener('click', function () {
    count = 0;
    updateDisplay();
    addHistory('重置为0');
});

// 6. 初始显示
updateDisplay();
addHistory('初始值为0');

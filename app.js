const CONVERSION_RATES = { special: 150, first: 50, second: 10, third: 1 };
const RANK_LABELS = { special: '特等功', first: '一等功', second: '二等功', third: '三等功' };
const DEFAULT_TASKS = [
    { id: 't1', name: '铲屎', reward: 2 }, { id: 't2', name: '倒垃圾', reward: 2 },
    { id: 't3', name: '梳毛', reward: 1 }, { id: 't4', name: '晾衣服', reward: 2 },
    { id: 't5', name: '收衣服', reward: 1 }, { id: 't6', name: '做饭', reward: 2 },
    { id: 't7', name: '洗碗', reward: 2 }, { id: 't8', name: '电动车充电', reward: 2 },
    { id: 't9', name: '扫地', reward: 2 }, { id: 't10', name: '洗厕所', reward: 3 },
    { id: 't11', name: '喂药', reward: 1 }, { id: 't12', name: '训猫', reward: 1 },
    { id: 't13', name: '收拾整理', reward: 2 }, { id: 't14', name: '拿快递', reward: 1 }
];

let state = { tasks: [], history: [], editingId: null };

function init() {
    // 尝试加载当前版本的存储数据
    let currentTasks = localStorage.getItem('housework_tasks');
    let currentHistory = localStorage.getItem('housework_history');

    if (currentTasks) {
        state.tasks = JSON.parse(currentTasks);
    }
    if (currentHistory) {
        state.history = JSON.parse(currentHistory);
    }

    // 如果当前数据为空，尝试从旧版本迁移数据
    if ((!state.tasks || state.tasks.length === 0) || (!state.history || state.history.length === 0)) {
        const legacyV2 = localStorage.getItem('houseworkApp_v2');
        if (legacyV2) {
            try {
                const parsed = JSON.parse(legacyV2);
                if ((!state.tasks || state.tasks.length === 0) && parsed.tasks) {
                    state.tasks = parsed.tasks;
                }
                if ((!state.history || state.history.length === 0) && parsed.history) {
                    // 转换历史记录格式以保持兼容
                    state.history = parsed.history.map(item => ({
                        id: item.id || Date.now().toString() + Math.random(),
                        name: item.taskName || item.name,
                        reward: item.rewardAmount || item.reward,
                        timestamp: item.timestamp || Date.now()
                    }));
                }
            } catch (e) {
                console.warn('从旧版本迁移数据失败:', e);
            }
        }
    }

    // 兜底默认任务
    if (!state.tasks || state.tasks.length === 0) {
        state.tasks = [...DEFAULT_TASKS];
    }
    if (!state.history) {
        state.history = [];
    }

    updateStorage();
    initScale();
    renderDashboard();
}

function updateStorage() {
    localStorage.setItem('housework_tasks', JSON.stringify(state.tasks));
    localStorage.setItem('housework_history', JSON.stringify(state.history));
    renderDashboard();
}

function calculateRanks() {
    let total = state.history.reduce((sum, item) => sum + item.reward, 0);
    let remaining = total;
    const special = Math.floor(remaining / 150); remaining %= 150;
    const first = Math.floor(remaining / 50); remaining %= 50;
    const second = Math.floor(remaining / 10); remaining %= 10;
    const third = remaining;
    return { special, first, second, third, total };
}

function renderDashboard() {
    const ranks = calculateRanks();
    document.getElementById('total-merits').textContent = ranks.total;
    document.getElementById('count-special').textContent = ranks.special;
    document.getElementById('count-first').textContent = ranks.first;
    document.getElementById('count-second').textContent = ranks.second;
    document.getElementById('count-third').textContent = ranks.third;

    document.getElementById('progress-first').textContent = `差 ${3 - ranks.first} 个 可兑特等功`;
    document.getElementById('progress-second').textContent = `差 ${5 - ranks.second} 个 可兑一等功`;
    document.getElementById('progress-third').textContent = `差 ${10 - ranks.third} 个 可兑二等功`;

}

function initScale() {
    const savedScale = localStorage.getItem('housework_scale') || '100';
    setAppScale(savedScale);
}

function setAppScale(value) {
    const scale = Math.min(110, Math.max(70, parseInt(value, 10) || 100));
    document.documentElement.style.setProperty('--app-scale', scale / 100);
    document.getElementById('scaleValue').textContent = `${scale}%`;
    localStorage.setItem('housework_scale', String(scale));
}

function adjustAppScale(delta) {
    const currentScale = parseInt(localStorage.getItem('housework_scale') || '100', 10);
    setAppScale(currentScale + delta);
}

function renderTaskList() {
    document.getElementById('taskList').innerHTML = state.tasks.map(task => `
        <div class="list-item" onclick="completeTask('${task.id}')">
            <div class="item-name">${task.name}</div>
            <div class="item-reward">+${task.reward}</div>
        </div>
    `).join('');
}

function renderHistory() {
    document.getElementById('historyList').innerHTML = [...state.history].reverse().map((item, idx) => {
        const date = new Date(item.timestamp);
        const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        const isNegative = item.reward < 0;
        return `
            <div class="list-item">
                <div>
                    <div class="item-name">${isNegative ? '<span style="color:var(--danger-color);font-weight:900">[兑换] </span>' : ''}${item.name}</div>
                    <div class="item-time">${timeStr}</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="item-reward ${isNegative ? 'negative' : ''}">${isNegative ? '' : '+'}${item.reward}</div>
                    <button class="btn-icon delete" onclick="deleteHistory(${state.history.length - 1 - idx})">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderManageList() {
    document.getElementById('manageTaskList').innerHTML = state.tasks.map((task, idx) => `
        <div class="list-item">
            <div><div class="item-name">${task.name}</div><div style="font-size:12px;color:var(--success-color)">${task.reward} 个三等功</div></div>
            <div style="display:flex;">
                <button class="btn-icon edit" onclick="editTask('${task.id}')">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
                <button class="btn-icon delete" onclick="deleteTask(${idx})">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            </div>
        </div>
    `).join('');
}

function completeTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    recordTaskCompletion(task);
    closeModal('completeTaskModal');
    showToast();
}

function recordTaskCompletion(task) {
    state.history.push({ id: Date.now().toString(), name: task.name, reward: task.reward, timestamp: Date.now() });
    updateStorage();
}

function getTaskRewardValue() {
    const input = document.getElementById('newTaskReward');
    const reward = parseInt(input.value, 10);
    return Number.isNaN(reward) ? 1 : Math.max(1, reward);
}

function setTaskRewardValue(value) {
    document.getElementById('newTaskReward').value = Math.max(1, parseInt(value, 10) || 1);
}

function showToast(msg) {
    const praises = [
        '辛苦了那位猪猪宝，快去抱抱TA！',
        '去给辛苦的猪猪倒杯水吧',
        '快去真诚地感谢TA的付出',
        'TA太能干了，奖励一个大么么',
        '辛苦啦！给辛苦的猪猪捏捏肩膀',
        '快去夸夸TA是家务全能冠军',
        '有TA在真好，快去贴贴鼓励一下',
        '猪猪宝辛苦了，你是最棒的！',
        '快去捕捉这只勤劳的小蜜蜂',
        '给家里的小太阳一个熊抱吧',
        '辛苦劳动的TA，值得一个大奖章',
        '发现一个超级英雄，快去致敬',
        '快跟TA说：有你真的太幸福啦',
        '快去给勤劳的TA揉揉腰',
        '今天的家务勋章必须颁给TA！',
        'TA默默付出了这么多，快去表扬',
        '又是被照顾的一天，快去撒个娇',
        '辛苦啦，快给TA准备个小惊喜',
        'TA是家里的定海神针，没TA真不行！',
        '那位猪猪真是家里的顶梁柱！',
        '快去给辛苦的猪猪切个水果盘',
        '家里的整洁全靠TA，快去点个赞',
        'TA干活的样子真帅，快去偷亲一口',
        '快去给TA一个充满爱意的摸摸头',
        '家里有你真温馨，辛苦我的宝了',
        '快去告诉TA，你是我的超级骄傲',
        '快带勤劳的猪猪去休息休息',
        'TA是家里的清洁小能手，比心！',
        '快去给忙碌的TA递个热毛巾',
        '有TA动手，家里瞬间焕然一新，厉害！',
        '辛苦了，快去给TA一个大大的充电抱抱',
        'TA是家里的劳模，快去领赏啦',
        '快去跟TA说，辛苦了我的大功臣',
        '家务活辛苦啦，你是最可爱的人',
        '快去奖励辛苦的TA一个甜蜜的吻',
        'TA是家里的魔法师，把家里变这么干净！',
        '辛苦TA啦，快去帮TA分担一下剩下的事',
        '有TA在的每一天，家里都闪闪发光'
    ];
    const toast = document.getElementById('toast');
    toast.textContent = msg || praises[Math.floor(Math.random() * praises.length)];
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 1500); 
}

function deleteHistory(idx) { if (confirm('确定删除记录？')) { state.history.splice(idx, 1); updateStorage(); renderHistory(); } }
function clearAllHistory() { if (confirm('确定要清空所有历史记录吗？此操作不可撤销！')) { state.history = []; updateStorage(); renderHistory(); } }
function deleteTask(idx) { if (confirm('确定删除配置？')) { state.tasks.splice(idx, 1); updateStorage(); renderManageList(); } }

function editTask(id) {
    const task = state.tasks.find(t => t.id === id);
    state.editingId = id;
    document.getElementById('newTaskName').value = task.name;
    setTaskRewardValue(task.reward);
    document.getElementById('saveTaskBtn').textContent = '更新任务';
    document.getElementById('saveAndRecordTaskBtn').textContent = '更新并记录';
    document.getElementById('form-title').textContent = '修改家务';
}

function saveNewOrEditedTask() {
    return persistTask();
}

function saveAndRecordTask() {
    const savedTask = persistTask();
    if (!savedTask) return;
    recordTaskCompletion(savedTask);
    showToast('已保存并记录完成');
}

function persistTask() {
    const name = document.getElementById('newTaskName').value.trim();
    const reward = getTaskRewardValue();
    if (!name) return null;
    let task;
    if (state.editingId) {
        task = state.tasks.find(t => t.id === state.editingId);
        task.name = name; task.reward = reward;
        state.editingId = null;
    } else {
        task = { id: Date.now().toString(), name, reward };
        state.tasks.push(task);
    }
    updateStorage(); resetTaskForm(); renderManageList();
    return task;
}

function resetTaskForm() {
    state.editingId = null;
    document.getElementById('newTaskName').value = '';
    setTaskRewardValue(2);
    document.getElementById('saveTaskBtn').textContent = '保存';
    document.getElementById('saveAndRecordTaskBtn').textContent = '保存并记录';
    document.getElementById('form-title').textContent = '添加新家务';
}

function adjustReward(delta) {
    setTaskRewardValue(getTaskRewardValue() + delta);
}

function showModal(id) {
    if (id === 'completeTaskModal') renderTaskList();
    if (id === 'historyModal') renderHistory();
    if (id === 'manageModal') renderManageList();
    document.getElementById(id).classList.add('active');
}

function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function exportHistory() {
    const blob = new Blob([JSON.stringify(state.history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `历史记录.json`; a.click();
    URL.revokeObjectURL(url);
}

function exportTasks() {
    const blob = new Blob([JSON.stringify(state.tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `家务配置.json`; a.click();
    URL.revokeObjectURL(url);
}

let currentImportType = '';
function triggerImport(type) { currentImportType = type; document.getElementById('importInput').click(); }

document.getElementById('importInput').onchange = function (e) {
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (currentImportType === 'history') {
                // 去重：基于 id
                const existingIds = new Set(state.history.map(item => item.id));
                const newItems = data.filter(item => !existingIds.has(item.id));
                state.history = [...state.history, ...newItems];
                updateStorage();
                renderHistory();
            } else {
                // 去重：基于任务名称或 id（如果存在）
                const existingMap = new Map();
                state.tasks.forEach(t => existingMap.set(t.name, t));
                data.forEach(t => {
                    if (!existingMap.has(t.name)) {
                        state.tasks.push(t);
                        existingMap.set(t.name, t);
                    }
                });
                updateStorage();
                renderManageList();
            }
            showToast('同步并去重完成');
        } catch (err) { alert('文件格式有误'); }
        e.target.value = ''; // 清除选择，以便下次触发
    };
    reader.readAsText(e.target.files[0]);
};

let redeemRank = null;
let redeemCount = 1;
function openRedeem() {
    const total = calculateRanks().total;
    if (total <= 0) return alert('当前没有可用的功勋');
    redeemRank = getDefaultRedeemRank(total);
    redeemCount = 1;
    renderRedeemOptions();
    document.getElementById('redeemContent').value = '';
    showModal('redeemModal');
}

function getDefaultRedeemRank(total) {
    return Object.keys(CONVERSION_RATES).find(rank => total >= CONVERSION_RATES[rank]) || null;
}

function selectRedeemRank(rank) {
    const total = calculateRanks().total;
    if (total < CONVERSION_RATES[rank]) return;
    redeemRank = rank;
    redeemCount = Math.min(redeemCount, getMaxRedeemCount(rank, total));
    renderRedeemOptions();
}

function renderRedeemOptions() {
    const total = calculateRanks().total;
    if (redeemRank) {
        redeemCount = Math.min(Math.max(1, redeemCount), getMaxRedeemCount(redeemRank, total));
    }
    document.getElementById('redeemInfo').textContent = redeemRank
        ? `当前军功总值 ${total}，本次折算消耗 ${redeemCount} 个${RANK_LABELS[redeemRank]}`
        : `当前军功总值 ${total}`;
    document.getElementById('redeemCount').textContent = redeemCount;
    document.getElementById('redeemRankOptions').innerHTML = Object.keys(CONVERSION_RATES).map(rank => {
        const disabled = total < CONVERSION_RATES[rank];
        const active = rank === redeemRank ? ' active' : '';
        return `
            <button class="redeem-rank-btn${active}" ${disabled ? 'disabled' : ''} onclick="selectRedeemRank('${rank}')">
                ${RANK_LABELS[rank]} - ${CONVERSION_RATES[rank]} 分/个
            </button>
        `;
    }).join('');
}

function getMaxRedeemCount(rank, total = calculateRanks().total) {
    return Math.floor(total / CONVERSION_RATES[rank]);
}

function adjustRedeemCount(delta) {
    if (!redeemRank) return;
    const maxCount = getMaxRedeemCount(redeemRank);
    redeemCount = Math.min(maxCount, Math.max(1, redeemCount + delta));
    renderRedeemOptions();
}

function confirmRedeem() {
    const content = document.getElementById('redeemContent').value.trim();
    if (!redeemRank) return alert('请选择要消耗的功勋类型');
    if (!content) return alert('请输入兑换奖励的内容');
    const cost = CONVERSION_RATES[redeemRank] * redeemCount;
    if (calculateRanks().total < cost) return alert('当前功勋不足');
    state.history.push({
        id: Date.now().toString(),
        name: `${redeemCount} 个${RANK_LABELS[redeemRank]}兑换：${content}`,
        reward: -cost,
        timestamp: Date.now()
    });
    updateStorage();
    closeModal('redeemModal');
    showToast('兑换成功！已从军功中扣除');
}

window.onload = init;

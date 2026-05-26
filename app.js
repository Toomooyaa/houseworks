const CONVERSION_RATES = { special: 150, first: 50, second: 10, third: 1 };
const RANK_LABELS = { special: '特等功', first: '一等功', second: '二等功', third: '三等功' };
const DEFAULT_TASKS = [
    { id: 't1', name: '铲屎', reward: 2, icon: '🐱' },
    { id: 't2', name: '倒垃圾', reward: 2, icon: '🗑️' },
    { id: 't3', name: '梳毛', reward: 1, icon: '🐱' },
    { id: 't4', name: '晾衣服', reward: 2, icon: '👕' },
    { id: 't5', name: '收衣服', reward: 1, icon: '👚' },
    { id: 't6', name: '做饭', reward: 2, icon: '🍳' },
    { id: 't7', name: '洗碗', reward: 2, icon: '🥣' },
    { id: 't8', name: '电动车充电', reward: 2, icon: '🔌' },
    { id: 't9', name: '扫地', reward: 2, icon: '🧹' },
    { id: 't10', name: '洗厕所', reward: 3, icon: '🚽' },
    { id: 't11', name: '喂药', reward: 1, icon: '💊' },
    { id: 't12', name: '训猫', reward: 1, icon: '🐱' },
    { id: 't13', name: '收拾整理', reward: 2, icon: '🛋️' },
    { id: 't14', name: '拿快递', reward: 1, icon: '📦' },
    { id: 't15', name: '艰难开车', reward: 3, icon: '🚗' },
    { id: 't16', name: '清洗扫地机', reward: 2, icon: '🤖' },
    { id: 't17', name: '运送物资', reward: 2, icon: '🚚' },
    { id: 't18', name: '清洗冰箱', reward: 3, icon: '❄️' }
];

const PRESET_ICONS = [
    '🧹', '🗑️', '🧼', '🧽', '🪣', '🧴', '🛋️', '🪟',
    '🍳', '🍲', '🥣', '🍽️', '🍴', '🔪', '☕', '🍉',
    '🧺', '👕', '🔌', '📦', '🔑', '🚗', '🛵', '🛒',
    '🐱', '🐶', '🐟', '🐹', '🌱', '🪴', '💧', '🌸',
    '🧸', '🎮', '💊', '📚', '💻', '💡', '⏰', '❤️'
];

let state = {
    tasks: [],
    history: [],
    editingId: null,
    selectedIcon: PRESET_ICONS[0]
};

let heroName = '猪猪宝';

function init() {
    // 1. 初始化主题
    initTheme();

    // 2. 加载大功臣昵称
    const savedHeroName = localStorage.getItem('housework_hero_name');
    if (savedHeroName) {
        heroName = savedHeroName;
    }
    document.getElementById('heroNameDisplay').textContent = heroName;

    // 3. 尝试加载当前版本的存储数据
    let currentTasks = localStorage.getItem('housework_tasks');
    let currentHistory = localStorage.getItem('housework_history');

    if (currentTasks) {
        state.tasks = JSON.parse(currentTasks);
    }
    if (currentHistory) {
        state.history = JSON.parse(currentHistory);
    }

    // 4. 旧版本数据向新版本迁移
    if ((!state.tasks || state.tasks.length === 0) || (!state.history || state.history.length === 0)) {
        const legacyV2 = localStorage.getItem('houseworkApp_v2');
        if (legacyV2) {
            try {
                const parsed = JSON.parse(legacyV2);
                if ((!state.tasks || state.tasks.length === 0) && parsed.tasks) {
                    state.tasks = parsed.tasks;
                }
                if ((!state.history || state.history.length === 0) && parsed.history) {
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

    // 兼容补全缺失图标 (Icon) 的老数据
    state.tasks.forEach(task => {
        if (!task.icon) {
            task.icon = autoMatchIcon(task.name);
        }
    });

    // 5. 初始化礼花粒子系统
    initConfetti();

    // 6. 初始化缩放
    initScale();

    // 7. 更新存储与渲染页面
    updateStorage();
    renderIconSelector();
}

function updateStorage() {
    localStorage.setItem('housework_tasks', JSON.stringify(state.tasks));
    localStorage.setItem('housework_history', JSON.stringify(state.history));
    renderDashboard();
}

// 自动根据名字进行 Emoji 图标匹配
function autoMatchIcon(name) {
    if (name.includes('猫') || name.includes('狗') || name.includes('宠') || name.includes('毛') || name.includes('屎')) return '🐱';
    if (name.includes('垃圾') || name.includes('倒')) return '🗑️';
    if (name.includes('做饭') || name.includes('饭') || name.includes('厨') || name.includes('菜') || name.includes('煮')) return '🍳';
    if (name.includes('洗碗') || name.includes('碗') || name.includes('盘') || name.includes('餐')) return '🥣';
    if (name.includes('扫地机') || name.includes('扫地机器人')) return '🤖';
    if (name.includes('扫') || name.includes('拖') || name.includes('地') || name.includes('尘')) return '🧹';
    if (name.includes('晾衣服') || name.includes('晾')) return '👕';
    if (name.includes('收衣服') || name.includes('收')) return '👚';
    if (name.includes('洗衣服') || name.includes('洗衣') || name.includes('洗') || name.includes('衣')) return '🧺';
    if (name.includes('运送物资') || name.includes('物资') || name.includes('运送') || name.includes('快') || name.includes('邮') || name.includes('包') || name.includes('箱')) return '📦';
    if (name.includes('厕') || name.includes('马桶') || name.includes('洗漱') || name.includes('浴') || name.includes('镜')) return '🚽';
    if (name.includes('充') || name.includes('电') || name.includes('灯')) return '🔌';
    if (name.includes('药') || name.includes('喂')) return '💊';
    if (name.includes('花') || name.includes('草') || name.includes('浇')) return '🌱';
    if (name.includes('整理') || name.includes('收拾') || name.includes('叠') || name.includes('柜')) return '🛋️';
    if (name.includes('开车') || name.includes('驾') || name.includes('车')) return '🚗';
    if (name.includes('冰箱')) return '❄️';
    return '🧹';
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

    document.getElementById('progress-first').textContent = `差 ${3 - ranks.first} 个一等功 可兑特等功`;
    document.getElementById('progress-second').textContent = `差 ${5 - ranks.second} 个二等功 可兑一等功`;
    document.getElementById('progress-third').textContent = `差 ${10 - ranks.third} 个三等功 可兑二等功`;
}

/* --- 主题与缩放控制 --- */
function initTheme() {
    const savedTheme = localStorage.getItem('housework_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const activeTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', activeTheme);
    updateThemeIcon(activeTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('housework_theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    if (theme === 'dark') {
        btn.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
            </svg>
        `;
    } else {
        btn.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.01c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
            </svg>
        `;
    }
}

function initScale() {
    const savedScale = localStorage.getItem('housework_scale') || '100';
    setAppScale(savedScale);
}

function setAppScale(value) {
    const scale = Math.min(150, Math.max(70, parseInt(value, 10) || 100));
    document.documentElement.style.setProperty('--app-scale', scale / 100);
    const valEl = document.getElementById('scaleValue');
    if (valEl) valEl.textContent = `${scale}%`;
    localStorage.setItem('housework_scale', String(scale));
}

function adjustAppScale(delta) {
    const currentScale = parseInt(localStorage.getItem('housework_scale') || '100', 10);
    setAppScale(currentScale + delta);
}

// 修改功臣昵称（恢复为直接弹窗输入）
function editHeroName() {
    const newName = prompt('请输入你要记录的大功臣昵称 (如：老公、媳妇、宝儿)：', heroName);
    if (newName !== null && newName.trim() !== '') {
        heroName = newName.trim();
        localStorage.setItem('housework_hero_name', heroName);
        document.getElementById('heroNameDisplay').textContent = heroName;
        showToast(`大功臣的昵称已成功修改为 [${heroName}]`);
    }
}

/* --- 列表渲染逻辑 --- */

function renderTaskList() {
    const listEl = document.getElementById('taskList');
    if (!listEl) return;
    if (state.tasks.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                <p>配置中还没有家务，快去“家务配置”里添加几项吧！</p>
            </div>
        `;
        return;
    }
    listEl.innerHTML = state.tasks.map(task => `
        <div class="list-item" onclick="completeTask('${task.id}')">
            <div class="item-left-area">
                <div class="item-icon-box">${task.icon || '🧹'}</div>
                <div class="item-detail">
                    <div class="item-name">${task.name}</div>
                </div>
            </div>
            <div class="item-reward">+${task.reward}</div>
        </div>
    `).join('');
}

function renderHistory() {
    const listEl = document.getElementById('historyList');
    if (!listEl) return;
    if (state.history.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.14.72-1.21-3.5-1.75V8H12z" /></svg>
                <p>还没有获得过军功哦，点击“完成家务”开始吧！</p>
            </div>
        `;
        return;
    }
    listEl.innerHTML = [...state.history].reverse().map((item, idx) => {
        const date = new Date(item.timestamp);
        const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        const isNegative = item.reward < 0;

        // 根据历史记录匹配当前任务 Emoji 图标，如果没有则用默认分类
        let icon = '🎁';
        if (!isNegative) {
            const matchedTask = state.tasks.find(t => t.name === item.name);
            icon = matchedTask ? (matchedTask.icon || '🧹') : autoMatchIcon(item.name);
        }

        return `
            <div class="list-item">
                <div class="item-left-area">
                    <div class="item-icon-box">${icon}</div>
                    <div class="item-detail">
                        <div class="item-name">${isNegative ? '<span style="color:var(--danger-color);font-weight:700">[已兑] </span>' : ''}${item.name}</div>
                        <div class="item-time">${timeStr}</div>
                    </div>
                </div>
                <div class="item-right-area">
                    <div class="item-reward ${isNegative ? 'negative' : ''}">${isNegative ? '' : '+'}${item.reward}</div>
                    <button class="btn-icon delete" onclick="deleteHistory(${state.history.length - 1 - idx})" aria-label="删除历史记录">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderManageList() {
    const listEl = document.getElementById('manageTaskList');
    if (!listEl) return;
    if (state.tasks.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                <p>配置库空空如也，来建第一个家务任务吧！</p>
            </div>
        `;
        return;
    }
    listEl.innerHTML = state.tasks.map((task, idx) => `
        <div class="list-item">
            <div class="item-left-area">
                <div class="item-icon-box">${task.icon || '🧹'}</div>
                <div class="item-detail">
                    <div class="item-name">${task.name}</div>
                    <div style="font-size:11px;color:var(--text-secondary); margin-top:2px;">奖励 ${task.reward} 个三等功积分</div>
                </div>
            </div>
            <div class="item-right-area" style="gap: 6px;">
                <!-- 手动排序上移/下移 -->
                <button class="btn-icon sort-up" onclick="moveTask(${idx}, -1)" ${idx === 0 ? 'disabled' : ''} aria-label="上移" style="width: 32px; height: 32px; border-radius: 8px;">
                    <svg viewBox="0 0 24 24" style="width: 16px; height: 16px;"><path d="M7 14l5-5 5 5z"/></svg>
                </button>
                <button class="btn-icon sort-down" onclick="moveTask(${idx}, 1)" ${idx === state.tasks.length - 1 ? 'disabled' : ''} aria-label="下移" style="width: 32px; height: 32px; border-radius: 8px;">
                    <svg viewBox="0 0 24 24" style="width: 16px; height: 16px;"><path d="M7 10l5 5 5-5z"/></svg>
                </button>
                <button class="btn-icon edit" onclick="editTask('${task.id}')" aria-label="编辑" style="width: 32px; height: 32px; border-radius: 8px;">
                    <svg viewBox="0 0 24 24" style="width: 16px; height: 16px;"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
                <button class="btn-icon delete" onclick="deleteTask(${idx})" aria-label="删除" style="width: 32px; height: 32px; border-radius: 8px;">
                    <svg viewBox="0 0 24 24" style="width: 16px; height: 16px;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            </div>
        </div>
    `).join('');
}

// 任务手动排序位置交换方法
function moveTask(idx, direction) {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= state.tasks.length) return;
    const temp = state.tasks[idx];
    state.tasks[idx] = state.tasks[targetIdx];
    state.tasks[targetIdx] = temp;
    updateStorage();
    renderManageList();
}

function renderIconSelector() {
    const container = document.getElementById('iconSelector');
    if (!container) return;
    container.innerHTML = PRESET_ICONS.map(icon => {
        const isActive = icon === state.selectedIcon ? ' active' : '';
        return `
            <div class="icon-selector-item${isActive}" onclick="selectIcon('${icon}')">${icon}</div>
        `;
    }).join('');
}

function selectIcon(icon) {
    state.selectedIcon = icon;
    renderIconSelector();
}

/* --- 业务交互控制 --- */

function completeTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    recordTaskCompletion(task);
    closeModal('completeTaskModal');
    triggerConfetti(); // 燃放礼花
    showToast();
}

function recordTaskCompletion(task) {
    state.history.push({
        id: Date.now().toString() + Math.random(),
        name: task.name,
        reward: task.reward,
        timestamp: Date.now()
    });
    updateStorage();
}

function getTaskRewardValue() {
    const input = document.getElementById('newTaskReward');
    if (!input) return 2;
    const reward = parseInt(input.value, 10);
    return Number.isNaN(reward) ? 1 : Math.max(1, reward);
}

function setTaskRewardValue(value) {
    const input = document.getElementById('newTaskReward');
    if (input) {
        input.value = Math.max(1, parseInt(value, 10) || 1);
    }
}

// 个性化大功臣赞美 Toast
function showToast(msg) {
    const praises = [
        `辛苦了我的${heroName}，快去给TA一个充电抱抱！`,
        `去给辛苦的${heroName}倒杯温水润润喉吧~`,
        `快去真诚地感谢${heroName}的温柔付出！`,
        `${heroName}太能干了，奖励一个香香的大么么~`,
        `辛苦啦！给辛劳的${heroName}捏捏小肩膀吧`,
        `快去夸夸${heroName}是全宇宙最无敌家务全能王`,
        `有${heroName}在身边真好，快去黏人贴贴奖励一下`,
        `${heroName}辛苦了，你简直是世界的守护天使！`,
        `快去捕捉${heroName}这只勤劳可爱的小蜜蜂`,
        `给家里的小太阳${heroName}来一个超长的大熊抱`,
        `辛苦劳动的${heroName}，今天值得一朵红花和最崇高的致敬！`,
        `捕捉到一只野生超级家务英雄，快去抱抱TA`,
        `快跟${heroName}说：谢谢你，有你我的世界超甜超幸福！`,
        `辛苦啦，今天快给${heroName}揉揉小腰`,
        `今天的特等家务功勋奖章必须全票颁给${heroName}！`,
        `${heroName}默默默默包揽了这一切，快去热烈赞美！`,
        `又是被${heroName}细心照顾的一天，快去向TA撒个娇~`,
        `大功臣辛苦啦，快给${heroName}制造点神秘小零食惊喜`,
        `${heroName}就是这个小家的定海神针，完全离不开你！`,
        `哇塞，${heroName}干活的姿势未免也太帅太好看了吧`,
        `快去给辛苦的${heroName}削个甜甜的大苹果`,
        `小家的窗明几净全靠${heroName}，赞美是必须的！`,
        `家里因为有${heroName}而变得闪烁温暖，真的辛苦啦`,
        `快去给忙碌的${heroName}盖上被子，带TA去休息休息~`,
        `${heroName}绝对是家务魔法界的魔法大师，无处不整洁！`,
        `辛苦了！真想把一整天的快乐全都打包送给${heroName}`
    ];
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg || praises[Math.floor(Math.random() * praises.length)];
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2200); // 适当增加至2.2秒以便看清赞美词
}

function deleteHistory(idx) {
    if (confirm('确定要删除这笔军功记录吗？积分将同步调整。')) {
        state.history.splice(idx, 1);
        updateStorage();
        renderHistory();
    }
}

function clearAllHistory() {
    if (confirm('警告：确定要清空所有历史军功记录吗？此操作将使积分归零且不可撤销！')) {
        state.history = [];
        updateStorage();
        renderHistory();
        showToast('所有历史明细已清空');
    }
}

function deleteTask(idx) {
    if (confirm('确定要删除这个家务配置吗？已获取的积分不会丢失。')) {
        state.tasks.splice(idx, 1);
        updateStorage();
        renderManageList();
    }
}

function editTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    state.editingId = id;
    document.getElementById('newTaskName').value = task.name;
    setTaskRewardValue(task.reward);
    state.selectedIcon = task.icon || PRESET_ICONS[0];
    renderIconSelector();
    document.getElementById('saveTaskBtn').textContent = '更新任务';
    document.getElementById('saveAndRecordTaskBtn').textContent = '更新并记录';
    document.getElementById('form-title').textContent = '修改家务配置';
    
    // 平滑滚动至表单区域
    document.querySelector('.add-task-form').scrollIntoView({ behavior: 'smooth' });
}

function saveNewOrEditedTask() {
    return persistTask();
}

function saveAndRecordTask() {
    const savedTask = persistTask();
    if (!savedTask) return;
    recordTaskCompletion(savedTask);
    triggerConfetti();
    showToast('任务配置已保存并立即记入历史！');
}

function persistTask() {
    const nameInput = document.getElementById('newTaskName');
    const name = nameInput ? nameInput.value.trim() : '';
    const reward = getTaskRewardValue();
    const icon = state.selectedIcon;
    if (!name) {
        alert('请输入家务名称');
        return null;
    }
    let task;
    if (state.editingId) {
        task = state.tasks.find(t => t.id === state.editingId);
        if (task) {
            task.name = name;
            task.reward = reward;
            task.icon = icon;
        }
        state.editingId = null;
    } else {
        task = { id: Date.now().toString() + Math.random(), name, reward, icon };
        state.tasks.push(task);
    }
    updateStorage();
    resetTaskForm();
    renderManageList();
    return task;
}

function resetTaskForm() {
    state.editingId = null;
    const nameInput = document.getElementById('newTaskName');
    if (nameInput) nameInput.value = '';
    setTaskRewardValue(2);
    state.selectedIcon = PRESET_ICONS[0];
    renderIconSelector();
    document.getElementById('saveTaskBtn').textContent = '保存任务';
    document.getElementById('saveAndRecordTaskBtn').textContent = '保存并记录';
    document.getElementById('form-title').textContent = '添加新家务';
}

function adjustReward(delta) {
    setTaskRewardValue(getTaskRewardValue() + delta);
}

/* --- 抽屉模态框管理 --- */
function showModal(id) {
    if (id === 'completeTaskModal') renderTaskList();
    if (id === 'historyModal') renderHistory();
    if (id === 'manageModal') {
        resetTaskForm();
        renderManageList();
    }
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

/* --- 数据导出/导入同步与去重 --- */
function exportHistory() {
    const blob = new Blob([JSON.stringify(state.history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `家务军功明细_${heroName}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportTasks() {
    const blob = new Blob([JSON.stringify(state.tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `家务配置库_${heroName}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

let currentImportType = '';
function triggerImport(type) {
    currentImportType = type;
    const input = document.getElementById('importInput');
    if (input) input.click();
}

document.getElementById('importInput').onchange = function (e) {
    if (!e.target.files || e.target.files.length === 0) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
        try {
            const data = JSON.parse(evt.target.result);
            if (currentImportType === 'history') {
                // 基于 id 过滤去重，如无 id 则基于时间戳与名称混合生成哈希
                const existingIds = new Set(state.history.map(item => item.id || (item.timestamp + '_' + item.name)));
                const newItems = data.filter(item => {
                    const uniqueKey = item.id || (item.timestamp + '_' + item.name);
                    return !existingIds.has(uniqueKey);
                });
                state.history = [...state.history, ...newItems];
                updateStorage();
                renderHistory();
                showToast(`已成功同步合并 ${newItems.length} 条军功记录！`);
            } else {
                // 去重合并家务配置（基于名称）
                const existingNames = new Set(state.tasks.map(t => t.name));
                let importCount = 0;
                data.forEach(t => {
                    if (!existingNames.has(t.name)) {
                        if (!t.icon) t.icon = autoMatchIcon(t.name);
                        if (!t.id) t.id = Date.now().toString() + Math.random();
                        state.tasks.push(t);
                        importCount++;
                    }
                });
                updateStorage();
                renderManageList();
                showToast(`已导入合并 ${importCount} 个新家务！`);
            }
        } catch (err) {
            alert('文件解析失败，请检查是否是正确的 JSON 格式');
        }
        e.target.value = ''; // 清除选择
    };
    reader.readAsText(e.target.files[0]);
};

/* --- 兑换军功奖励控制逻辑 --- */
let redeemRank = null;
let redeemCount = 1;

function openRedeem() {
    const total = calculateRanks().total;
    if (total <= 0) {
        alert(`当前大功臣 ${heroName} 积分仍为 0，快去干家务赚取第一枚勋章吧！`);
        return;
    }
    redeemRank = getDefaultRedeemRank(total);
    redeemCount = 1;
    renderRedeemOptions();
    const contentInput = document.getElementById('redeemContent');
    if (contentInput) contentInput.value = '';
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
    const infoEl = document.getElementById('redeemInfo');
    if (infoEl) {
        infoEl.innerHTML = redeemRank
            ? `大功臣 <strong>${heroName}</strong> 当前军功总值 ${total}<br>本次折算扣减：${redeemCount} 个 [${RANK_LABELS[redeemRank]}]`
            : `大功臣 <strong>${heroName}</strong> 当前军功总值 ${total}`;
    }
    const countEl = document.getElementById('redeemCount');
    if (countEl) countEl.textContent = redeemCount;

    const optEl = document.getElementById('redeemRankOptions');
    if (optEl) {
        optEl.innerHTML = Object.keys(CONVERSION_RATES).map(rank => {
            const disabled = total < CONVERSION_RATES[rank];
            const active = rank === redeemRank ? ' active' : '';
            return `
                <button class="redeem-rank-btn${active}" ${disabled ? 'disabled' : ''} onclick="selectRedeemRank('${rank}')">
                    ${RANK_LABELS[rank]} (${CONVERSION_RATES[rank]}分)
                </button>
            `;
        }).join('');
    }
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
    const contentInput = document.getElementById('redeemContent');
    const content = contentInput ? contentInput.value.trim() : '';
    if (!redeemRank) {
        alert('请选择要消耗的功勋级别');
        return;
    }
    if (!content) {
        alert('请输入想要兑换的心愿内容');
        return;
    }
    const cost = CONVERSION_RATES[redeemRank] * redeemCount;
    if (calculateRanks().total < cost) {
        alert('当前余额不足，无法兑换该项目');
        return;
    }
    state.history.push({
        id: Date.now().toString() + Math.random(),
        name: `${redeemCount}个${RANK_LABELS[redeemRank]}兑换：${content}`,
        reward: -cost,
        timestamp: Date.now()
    });
    updateStorage();
    closeModal('redeemModal');
    showToast(`兑换成功！已从 ${heroName} 积分中扣除 ${cost} 分~`);
}

/* --- 高性能 Canvas Confetti 粒子礼花系统 --- */
let confettiActive = false;
let confettiParticles = [];
const confettiColors = ['#fbbf24', '#22d3ee', '#a78bfa', '#34d399', '#f87171', '#ec4899', '#6366f1'];

class ConfettiParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 6;
        this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 8 + 7;
        // 弧度向上偏移喷发
        this.vx = Math.cos(this.angle) * this.speed * 1.5;
        this.vy = (Math.sin(this.angle) * this.speed) - 6; 
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 8 - 4;
        this.gravity = 0.35;
        this.opacity = 1;
        this.decay = Math.random() * 0.012 + 0.008;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= 0.97; // 施加水平空气阻力
        this.vy *= 0.97;
        this.rotation += this.rotationSpeed;
        this.opacity -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        // 随机多边形或矩形纸屑
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

function initConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

function triggerConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const startX = canvas.width / 2;
    const startY = canvas.height * 0.8;
    
    // 注入 120 个闪耀粒子
    for (let i = 0; i < 120; i++) {
        confettiParticles.push(new ConfettiParticle(startX, startY));
    }
    
    if (!confettiActive) {
        confettiActive = true;
        animateConfetti(ctx, canvas);
    }
}

function animateConfetti(ctx, canvas) {
    if (confettiParticles.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettiActive = false;
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const p = confettiParticles[i];
        p.update();
        p.draw(ctx);
        
        if (p.opacity <= 0 || p.y > canvas.height || p.x < 0 || p.x > canvas.width) {
            confettiParticles.splice(i, 1);
        }
    }

    requestAnimationFrame(() => animateConfetti(ctx, canvas));
}

window.onload = init;

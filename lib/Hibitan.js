import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
// ---------------------
// Supabase
// ---------------------
const supabaseUrl = 'https://wxldxsrdjgovhteqxgbw.supabase.co';
const supabaseKey = 'sb_publishable_2lBv3Dx0yleqcTKKY07S6A_cln-SkeK';
const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------
// State
// ---------------------
let user = null;
let screenHistory = [];

// ---------------------
// 初期化
// ---------------------
let currentYear;
let currentMonth;
console.log('最新のshowNakamaです');
window.addEventListener('DOMContentLoaded', async () => {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth() + 1;

    const savedUserId = localStorage.getItem('hibitan_user_id');

    if (savedUserId) {
        const res = await supabase
                .from('hibitan')
                .select('*')
                .eq('登録番号', savedUserId)
                .single();

        if (res.data) {
            user = res.data;
            onUserReady(user);
            initUI();
            updateHome();
            renderCalendar(currentYear, currentMonth);
            showScreen('homeGamen');
            return;
        } else {
            localStorage.removeItem('hibitan_user_id');
        }
    }

    initUI();
    showScreen('syokiGamen');
});






// ---------------------
// 日付表示
// ---------------------
function showToday() {
    var el = document.getElementById('date');
    if (!el)
        return;

    var d = new Date();
    el.textContent =
            d.getFullYear() + '年' +
            (d.getMonth() + 1) + '月' +
            d.getDate() + '日';
}

// ---------------------
// 画面切替（履歴管理付き）
// ---------------------
function showScreen(screenId) {
    var screens = document.querySelectorAll('.screen');

    screens.forEach(function (s) {
        s.style.display = 'none';
    });

    var target = document.getElementById(screenId);
    if (!target)
        return;

    var current = screenHistory[screenHistory.length - 1];
    if (current !== screenId) {
        screenHistory.push(screenId);
    }

    target.style.display = 'block';
}

// ---------------------
// data-nav（下メニュー）
// ---------------------
function bindNavigation() {
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-nav]');
        if (!btn)
            return;

        showScreen(btn.getAttribute('data-nav'));
    });
}

// ---------------------
// チュートリアル操作
// ---------------------
function bindTutorialActions() {
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action]');
        if (!btn)
            return;

        var action = btn.getAttribute('data-action');

        // 次へ
        if (action === 'next') {
            var next = btn.getAttribute('data-next');
            if (next)
                showScreen(next);
        }

        // 戻る（ひとつ前）
        if (action === 'back') {
            screenHistory.pop();            // 今の画面を捨てる
            var prev = screenHistory.pop(); // 1つ前
            showScreen(prev || 'syokiGamen');
        }

        // 後で見る → 新規登録
        if (action === 'skip') {
            screenHistory = [];             // 履歴をリセット
            showScreen('sinkiTourokuGamen');
        }
    });
}

var step4Btn = document.getElementById('step4Button');
if (step4Btn) {
    step4Btn.addEventListener('click', function () {
        screenHistory = [];               // ←超重要
        showScreen('sinkiTourokuGamen');
    });
}



var goRegisterBtn = document.getElementById('goRegisterBtn');
if (goRegisterBtn) {
    goRegisterBtn.addEventListener('click', function () {
        screenHistory = [];                 // ←ここが超重要
        showScreen('sinkiTourokuGamen');
    });
}

var backBtn = document.getElementById('backToLoginBtn');
if (backBtn) {
    backBtn.addEventListener('click', function () {
        showScreen('syokiGamen'); // ログイン画面
    });
}




// ---------------------
// ボタン紐付け
// ---------------------
function bindButtons() {

    var startBtn = document.getElementById('startTutorialBtn');
    if (startBtn) {
        startBtn.addEventListener('click', function () {
            showScreen('step1');
        });
    }

    var loginBtn = document.getElementById('roguinButton');
    if (loginBtn)
        loginBtn.addEventListener('click', login);

    var registerBtn = document.getElementById('tourokuButton');
    if (registerBtn)
        registerBtn.addEventListener('click', registerUser);

    var recordBtn = document.getElementById('tasseiButton');
    if (recordBtn)
        recordBtn.addEventListener('click', recordToday);

    var editBtn = document.getElementById('editProfileBtn');
    if (editBtn)
        editBtn.addEventListener('click', openEditProfile);

    var updateBtn = document.getElementById('updateProfileBtn');
    if (updateBtn)
        updateBtn.addEventListener('click', updateProfile);

    var nakamaBtn = document.getElementById('nakamaButton');
    if (nakamaBtn) {
        nakamaBtn.addEventListener('click', function () {
            if (!user) {
                alert('ログインしてください');
                return;
            }
            showNakama(user.合言葉);
        });
    }
}

// ---------------------
// ログイン
// ---------------------
async function login() {
    var name = document.getElementById('loginName').value.trim();
    var pass = document.getElementById('loginPassword').value.trim();

    if (!name || !pass) {
        alert('名前とパスワードを入力してください');
        return;
    }

    var res = await supabase
            .from('hibitan')
            .select('*')
            .eq('名前', name)
            .eq('パスワード', pass)
            .single();

    if (res.error || !res.data) {
        alert('ログイン失敗');
        return;
    }

    user = res.data;
    onUserReady(user);
    localStorage.setItem('hibitan_user_id', user.登録番号);

    updateHome();
    renderCalendar(currentYear, currentMonth);
    showScreen('homeGamen');
}

window.logout = function () {
    localStorage.removeItem('hibitan_user_id');
    user = null;
    showScreen('syokiGamen');
};

function bindUserMenu() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
        });
    }
    const customizeBtn = document.getElementById('customizeBtn');
    if (customizeBtn) {
        customizeBtn.addEventListener('click', () => {
            showScreen('customizeScreen');
        });
    }

}



// ---------------------
// ホーム反映
// ---------------------
function updateHome() {
    if (!user)
        return;  // ← 追加
    document.getElementById('mokuhyouHyouzi').textContent = '目標： ' + user.目標;
    document.getElementById('ikigomiHyouzi').textContent = '意気込み： ' + user.意気込み;
    document.getElementById('renzokuHyouzi').textContent = '連続日数： ' + (user.連続日数 || 0) + '日';
}

// ---------------------
// daily_records に保存
// ---------------------
async function saveDailyRecord(userId, recordDate, achieved, diaryText) {
    const {error} = await supabase
            .from('daily_records')
            .upsert({
                user_id: userId,
                record_date: recordDate,
                achieved: achieved,
                diary: diaryText
            });

    if (error) {
        console.error('daily_records 保存エラー:', error);
    }
}

// ---------------------
// 今日の記録
// ---------------------
async function recordToday() {
    if (!user)
        return;

    var today = new Date().toISOString().split('T')[0];
    if (user.最終実施日 === today) {
        alert('今日は記録済みです');
        return;
    }

    var note = document.getElementById('dailyNoteInput').value.trim();

    var res = await supabase
            .from('hibitan')
            .update({
                実施状況: true,
                連続日数: (user.連続日数 || 0) + 1,
                最終実施日: today,
                一言日記: note
            })
            .eq('登録番号', user.登録番号);

    await saveDailyRecord(
            user.登録番号,
            today,
            true,
            note
            );

    if (res.error) {
        alert('記録失敗');
        return;
    }

    user.連続日数++;
    user.最終実施日 = today;
    updateHome();
    await renderCalendar(currentYear, currentMonth);
    document.getElementById('dailyNoteInput').value = '';
    alert('記録しました');
}


async function afterLogin() {
    // user を取得する処理
    user = await fetchUser();

    updateHome();

    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth() + 1;

}



async function fetchMonthlyRecords(userId, year, month) {
    const startDate = new Date(year, month - 1, 1); // 月は0始まり
    const endDate = new Date(year, month, 1);     // 翌月1日（12月→1月になる）

    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    const {data, error} = await supabase
            .from('daily_records')
            .select('*')
            .eq('user_id', userId)
            .gte('record_date', start)
            .lt('record_date', end);

    if (error) {
        console.error(error);
        return [];
    }
    return data;
}


async function renderCalendar(year, month) {

    const records = await fetchMonthlyRecords(user.登録番号, year, month);
    const recordMap = {};

    records.forEach(r => {
        recordMap[r.record_date] = r;
    });

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const lastDate = new Date(year, month, 0).getDate();

    document.getElementById('calendarTitle').textContent =
            `${year}年${month}月`;

    const firstDay = new Date(year, month - 1, 1).getDay();

// ★ 空白セルを追加
    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.className = 'calendarCell';
        grid.appendChild(blank);
    }


    for (let d = 1; d <= lastDate; d++) {
        const dateStr =
                `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;


        const cell = document.createElement('div');
        cell.className = 'calendarCell';
        cell.textContent = d;

        if (recordMap[dateStr]) {
            const status = recordMap[dateStr].achieved === true;  // ← 修正
            const mark = status ? '⭕' : '❌';                     // ← 修正
            cell.textContent = `${d}\n${mark}`;
            cell.onclick = () => showDailyDetail(recordMap[dateStr]);
        }

        grid.appendChild(cell);
    }

}


function showDailyDetail(record) {
    alert(
            `${record.record_date}\n\n${record.diary || '（日記なし）'}`
            );
}

function initUI() {
    showToday();
    bindButtons();
    bindNavigation();
    bindTutorialActions();
    bindUserMenu();
    bindCalendarPaging();
}

function bindCalendarPaging() {
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            changeMonth(-1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            changeMonth(1);
        });
    }

}

function changeMonth(diff) {
    currentMonth += diff;

    if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    } else if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    }

    renderCalendar(currentYear, currentMonth);
}




// ---------------------
// 新規登録
// ---------------------
async function registerUser() {
    var data = {
        名前: document.getElementById('nameInput').value.trim(),
        パスワード: document.getElementById('passInput').value.trim(),
        目標: document.getElementById('mokuhyouInput').value.trim(),
        合言葉: document.getElementById('aikotoba').value.trim(),
        意気込み: document.getElementById('ikigomi').value.trim()
    };

    for (var k in data) {
        if (!data[k]) {
            alert('全て入力してください');
            return;
        }
    }

    var res = await supabase.from('hibitan').insert([data]).select().single();

    if (res.error) {
        alert('登録失敗');
        return;
    }

    user = res.data;
    updateHome();
    renderCalendar(currentYear, currentMonth);
    showScreen('homeGamen');
}

// ---------------------
// プロフィール編集
// ---------------------
function openEditProfile() {
    document.getElementById('editName').value = user.名前;
    document.getElementById('editPass').value = user.パスワード;
    document.getElementById('editMokuhyou').value = user.目標;
    document.getElementById('editIkigomi').value = user.意気込み;
    showScreen('editProfileScreen');
}

async function updateProfile() {
    var name = document.getElementById('editName').value.trim();
    var pass = document.getElementById('editPass').value.trim();
    var goal = document.getElementById('editMokuhyou').value.trim();
    var msg = document.getElementById('editIkigomi').value.trim();

    if (!name || !pass || !goal || !msg) {
        alert('全て入力してください');
        return;
    }

    await supabase
            .from('hibitan')
            .update({名前: name, パスワード: pass, 目標: goal, 意気込み: msg})
            .eq('登録番号', user.登録番号);

    user.名前 = name;
    user.パスワード = pass;
    user.目標 = goal;
    user.意気込み = msg;

    updateHome();
    showScreen('homeGamen');
}



// ---------------------
// サブメニュー強調（成長記録）
// ---------------------
const TMP_LATEST_KEY = 'latest_growth_date_tmp';

async function checkNewGrowth(user) {
    if (!user || !user.登録番号)
        return;

    const CHECK_KEY = `last_growth_checked_${user.登録番号}`;

    const {data, error} = await supabase
            .from('seityouKiroku')
            .select('created_at')
            .order('created_at', {ascending: false})
            .limit(1);

    if (error) {
        console.error(error);
        return;
    }

    if (!data || data.length === 0)
        return;

    const latestGrowthDate = data[0].created_at;
    localStorage.setItem(TMP_LATEST_KEY, latestGrowthDate);

    const lastChecked = localStorage.getItem(CHECK_KEY);

    if (!lastChecked || new Date(latestGrowthDate) > new Date(lastChecked)) {
        const menuBtn = document.getElementById('userMenuBtn');
        if (menuBtn) {
            menuBtn.classList.add('has-new');
        }
    }
}

// ---------------------
// サブメニューを見たら解除
// ---------------------
function markGrowthChecked(user) {
    if (!user || !user.登録番号)
        return;

    const CHECK_KEY = `last_growth_checked_${user.登録番号}`;
    const latestGrowthDate = localStorage.getItem(TMP_LATEST_KEY);
    if (!latestGrowthDate)
        return;

    localStorage.setItem(CHECK_KEY, latestGrowthDate);

    const menuBtn = document.getElementById('userMenuBtn');
    if (menuBtn) {
        menuBtn.classList.remove('has-new');
    }
}




// ==========================
// 仲間表示＋コメント機能差し替え
// ==========================
async function showNakama(aikotoba) {
    const res = await supabase
            .from('hibitan')
            .select('*')
            .eq('合言葉', aikotoba);

// ★ ログインユーザーを先頭に持ってくる
    if (user && user.登録番号) {
        res.data.sort((a, b) => {
            if (a.登録番号 === user.登録番号)
                return -1;
            if (b.登録番号 === user.登録番号)
                return 1;
            return 0;
        });
    }

    const list = document.getElementById('nakamaList');
    list.innerHTML = '';

    const today = new Date().toISOString().split('T')[0];

    if (!res.data || res.data.length === 0) {
        list.innerHTML = '<p>仲間がまだいません</p>';
        showScreen('nakamanoYousu');
        return;
    }
    document.getElementById('teamHeader').textContent = `チーム: ${aikotoba}`;

    // --- 仲間のコメント件数を並列取得 ---
    const countsPromises = res.data.map(u =>
        supabase
                .from('comments')
                .select('id', {count: 'exact', head: true})
                .eq('target_user_id', u.登録番号)
    );
    const countsResults = await Promise.all(countsPromises);

    for (let i = 0; i < res.data.length; i++) {
        const u = res.data[i];
        const countResult = countsResults[i];

        const isTodayDone = u.最終実施日 === today;
        const status = isTodayDone ? '✅' : 'ー';
        const note = isTodayDone ? (u.一言日記 || '（未入力）') : 'ー';

        const div = document.createElement('div');
        div.className = 'nakama-card';

        div.innerHTML = `
      <p class="nakama-name">👤 ${u.名前}</p>
      <p class="nakama-goal">🎯 目標：${u.目標}</p>
      <p class="nakama-msg">💬 意気込み：${u.意気込み}</p>
      <p class="nakama-status">🌱 実施状況：${status}</p>
      <p class="nakama-streak">🔥 実施日数：${u.連続日数 || 0}日</p>
      <p class="nakama-note">📝 一言日記：${note}</p>
      <span class="comment-btn" id="comment-btn-${u.登録番号}">
        💬 ${countResult.count || 0}
      </span>
      <div class="comments-area" id="comments-area-${u.登録番号}" style="display:none;">
        <div class="comment-form">
          <input type="text" class="comment-input" placeholder="コメントを書く">
          <button class="comment-submit">送信</button>
        </div>
        <div class="comments-list" id="comments-${u.登録番号}"></div>
      </div>
    `;

        list.appendChild(div);

        const commentBtn = document.getElementById(`comment-btn-${u.登録番号}`);
        const commentsArea = document.getElementById(`comments-area-${u.登録番号}`);
        const input = div.querySelector('.comment-input');
        const submitBtn = div.querySelector('.comment-submit');

        // 💬ボタンでコメント表示切替
        commentBtn.addEventListener('click', async () => {
            if (commentsArea.style.display === 'none') {
                commentsArea.style.display = 'block';
                await loadComments(u.登録番号);
            } else {
                commentsArea.style.display = 'none';
            }
        });

        // コメント送信
        submitBtn.addEventListener('click', async () => {
            const text = input.value.trim();
            if (!text || !user)
                return;

            await supabase.from('comments').insert([{
                    record_id: null,
                    user_id: user.登録番号,
                    target_user_id: u.登録番号,
                    content: text,
                    created_at: new Date()
                }]);
            input.value = '';
            await loadComments(u.登録番号);

            // コメント件数更新
            const {count: newCount} = await supabase
                    .from('comments')
                    .select('id', {count: 'exact', head: true})
                    .eq('target_user_id', u.登録番号);
            commentBtn.textContent = newCount > 0 ? `💬 ${newCount}` : '💬';
        });
    }

    showScreen('nakamanoYousu');
}


// --- コメント読み込み ---
async function loadComments(userId) {
    const container = document.getElementById('comments-' + userId);
    container.innerHTML = '';

    const {data: comments, error} = await supabase
            .from('comments')
            .select('id, content, user_id, created_at')
            .eq('target_user_id', userId)
            .order('created_at', {ascending: false});

    if (error) {
        container.textContent = 'コメント取得に失敗';
        console.error('コメント取得エラー:', error);
        return;
    }

    for (const c of comments) {

    const { data: userData } = await supabase
        .from('hibitan')
        .select('名前')
        .eq('登録番号', c.user_id)
        .maybeSingle();

    const name = (userData && userData.名前) ? userData.名前 : '名無し';

    // ★ UTC → 日本時間に補正
    const date = new Date(c.created_at);

    const time =
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0');

    const div = document.createElement('div');
    div.className = 'comment-item';

    div.innerHTML = `
        <div class="comment-header">
            <span class="comment-name">${name}</span>
            <span class="comment-time">${time}</span>
        </div>
        <div class="comment-content">${c.content}</div>
    `;

    container.appendChild(div);
}

}


// ---------------------
// コメント送信（今日やってない人も対象）
// ---------------------
async function postNakamaComment(targetUserId, text) {
    if (!user)
        return;

    const {error} = await supabase.from('comments').insert([{
            record_id: null,
            user_id: user.登録番号,
            target_user_id: targetUserId,
            content: text,
            created_at: new Date()
        }]);

    if (error)
        console.error('コメント送信エラー', error);
}

// ---------------------
// コメント読み込み
// ---------------------
async function loadNakamaComments(targetUserId) {
    const container = document.getElementById('comments-' + targetUserId);
    container.innerHTML = '';

    const {data: comments, error} = await supabase
            .from('comments')
            .select('id, content, user_id, created_at')
            .eq('target_user_id', targetUserId)
            .order('created_at', {ascending: true});

    if (error) {
        console.error('コメント取得エラー:', error);
        container.textContent = 'コメント取得に失敗';
        return;
    }

    for (const c of comments) {
        const {data: userData} = await supabase
                .from('hibitan')
                .select('名前')
                .eq('登録番号', c.user_id)
                .maybeSingle();
        const name = (userData && userData.名前) ? userData.名前 : '名無し';
        const p = document.createElement('p');
        p.textContent = name + ': ' + c.content;
        container.appendChild(p);
    }
}



document.getElementById('seityouBtn')
        .addEventListener('click', showSeityouKiroku);


async function showSeityouKiroku() {
    const {data, error} = await supabase
            .from('seityouKiroku')
            .select('*')
            .eq('is_visible', true)
            .order('created_at', {ascending: false});

    if (error) {
        console.error(error);
        alert('成長記録の取得に失敗しました');
        return;
    }

    const list = document.getElementById('seityouList');
    list.innerHTML = '';

    if (!data || data.length === 0) {
        list.innerHTML = '<p class="empty">まだ記録がありません</p>';
        showScreen('seityouKirokuScreen');
        return;
    }

    data.forEach(r => {
        const div = document.createElement('div');
        div.className = 'seityou-card';

        const date = r.created_at
                ? new Date(r.created_at).toLocaleDateString('ja-JP')
                : '';

        div.innerHTML = `
      <div class="seityou-date">${date}</div>
      <div class="seityou-card-title">${r.title}</div>
      <div class="seityou-card-message">${r.message}</div>
    `;

        list.appendChild(div);
    });

    showScreen('seityouKirokuScreen');
    markGrowthChecked(user);
}


// =====================
// 強調呼ぶメソッド
// =====================
function onUserReady(user) {
    // サブメニュー強調チェック
    checkNewGrowth(user);

    // サブメニュークリック時の既読解除
    const menuBtn = document.getElementById('userMenuBtn');
    if (menuBtn) {
        menuBtn.onclick = function () {
            markGrowthChecked(user);
        };
    }
}


// =====================
// テーマ定義
// =====================
const THEMES = {
    green: {
        main: '#50c850',
        soft: '#d6f7d6',
        accent: '#4cd24c'
    },
    blue: {
        main: '#4fa3d1',
        soft: '#dbeffc',
        accent: '#3c91c8'
    },
    pink: {
        main: '#e67aa0',
        soft: '#fde4ec',
        accent: '#dd5f8c'
    },
    orange: {
        main: '#f2a65a',
        soft: '#fff0df',
        accent: '#ef9440'
    },
    purple: {
        main: '#9b8cd9',
        soft: '#ebe7fa',
        accent: '#8775cf'
    },
    beige: {
        main: '#c8b89a',
        soft: '#f5f1e8',
        accent: '#b09a6a'
    }
};

// =====================
// テーマ適用
// =====================
function applyTheme(key) {
    const theme = THEMES[key];
    if (!theme)
        return;

    const root = document.documentElement;
    root.style.setProperty('--main', theme.main);
    root.style.setProperty('--main-soft', theme.soft);
    root.style.setProperty('--accent', theme.accent);

    let meta = document.querySelector('meta[name="theme-color"]');
    if (meta)
        meta.setAttribute('content', theme.main);

    localStorage.setItem('hibitan_theme', key);
}

// =====================
// 起動時復元
// =====================
function loadTheme() {
    const saved = localStorage.getItem('hibitan_theme');
    if (saved && THEMES[saved]) {
        applyTheme(saved);
    }
}

// =====================
// イベント登録
// =====================
window.addEventListener('DOMContentLoaded', () => {

    // 保存テーマ復元
    loadTheme();

    // 色ボタン
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.theme;
            applyTheme(key);
            alert('テーマを変更しました');
        });
    });

});


// コメント送信ボタン
const commentBtn = document.getElementById('commentSendButton');
const commentInput = document.getElementById('commentInput');

if (commentBtn && commentInput) {
    commentBtn.addEventListener('click', async () => {
        const text = commentInput.value.trim();
        if (!text) {
            alert('コメントを入力してください');
            return;
        }

        if (!user || !user.名前) {
            alert('ログインしてください');
            return;
        }

        try {
            const {data, error} = await supabase
                    .from('feedback')
                    .insert([
                        {
                            名前: user.名前,
                            コメント: text
                        }
                    ]);

            if (error) {
                console.error('コメント送信エラー', error);
                alert('コメント送信に失敗しました');
                return;
            }

            alert('コメントを送信しました！');
            commentInput.value = ''; // 入力欄をクリア
        } catch (e) {
            console.error(e);
            alert('コメント送信中にエラーが発生しました');
        }
    });
}




/* =========================
 ログイン画面 ミニゲーム（完全再現版）
 ========================= */

window.addEventListener('load', () => {

    const character = document.getElementById('character');
    const gameArea = document.getElementById('gameArea');
    if (!character || !gameArea)
        return;

    let pos = 0;
    let direction = 1;

    /* ===== キャラ移動（元と同じ） ===== */
    function moveCharacter() {
        const gameWidth = gameArea.clientWidth;
        pos += 20 * direction;

        if (pos > gameWidth - 60 || pos < 0) {
            direction *= -1;
            character.style.transform =
                    direction === 1 ? 'scaleX(1)' : 'scaleX(-1)';
        }
        character.style.left = pos + 'px';
    }
    setInterval(moveCharacter, 200);

    /* ===== ドラッグ線 ===== */
    let startX, startY, line;

    function getEventPos(e) {
        const rect = gameArea.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            return {
                x: e.changedTouches[0].clientX - rect.left,
                y: e.changedTouches[0].clientY - rect.top
            };
        } else {
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    }

    function startDrag(e) {
        e.preventDefault();
        const p = getEventPos(e);
        startX = p.x;
        startY = p.y;

        line = document.createElement('div');
        line.classList.add('line');
        line.style.left = startX + 'px';
        line.style.top = startY + 'px';
        line.style.width = '0px';
        gameArea.appendChild(line);
    }

    function drag(e) {
        if (!line)
            return;
        const p = getEventPos(e);
        const dx = p.x - startX;
        const dy = p.y - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        line.style.width = dist + 'px';
        line.style.transform = `rotate(${angle}deg)`;
    }

    function endDrag(e) {
        if (!line)
            return;
        const p = getEventPos(e);
        const dx = p.x - startX;
        const dy = p.y - startY;

        shootBullet(-dx, -dy);
        line.remove();
        line = null;
    }

    /* ===== 緑ハート（元挙動） ===== */
    function shootBullet(dx, dy) {
        const bullet = document.createElement('span');
        bullet.textContent = '💚';
        bullet.classList.add('bullet');
        bullet.style.left = startX + 'px';
        bullet.style.top = startY + 'px';
        gameArea.appendChild(bullet);

        let x = startX;
        let y = startY;
        const speed = 0.2;

        function animate() {
            x += dx * speed;
            y += dy * speed;
            bullet.style.left = x + 'px';
            bullet.style.top = y + 'px';

            const cx = character.offsetLeft;
            const cy = character.offsetTop;
            const cw = character.offsetWidth;
            const ch = character.offsetHeight;

            if (x > cx && x < cx + cw && y > cy && y < cy + ch) {
                bullet.remove();

                // ★ここが重要（元と同じ）
                character.style.transform += ' translateY(-20px)';
                setTimeout(() => {
                    character.style.transform =
                            direction === 1 ? 'scaleX(1)' : 'scaleX(-1)';
                }, 200);
                return;
            }

            if (
                    x < 0 || y < 0 ||
                    x > gameArea.clientWidth ||
                    y > gameArea.clientHeight
                    ) {
                bullet.remove();
                return;
            }

            requestAnimationFrame(animate);
        }
        animate();
    }

    const menuBtn = document.getElementById('userMenuBtn');
    const subMenu = document.getElementById('userSubMenu');

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        subMenu.classList.toggle('open');
    });

    document.addEventListener('click', () => {
        subMenu.classList.remove('open');
    });


// サブメニュー内をクリックしても閉じない
    subMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });

// 画面の他の場所を押したら閉じる
    document.addEventListener('click', () => {
        subMenu.classList.add('hidden');
    });



    /* ===== イベント ===== */
    gameArea.addEventListener('mousedown', startDrag);
    gameArea.addEventListener('mousemove', drag);
    gameArea.addEventListener('mouseup', endDrag);

    gameArea.addEventListener('touchstart', startDrag);
    gameArea.addEventListener('touchmove', drag);
    gameArea.addEventListener('touchend', endDrag);

});




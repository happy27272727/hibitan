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
let selectedPhotoFile = null;

// ---------------------
// 初期化
// ---------------------
let currentYear;
let currentMonth;

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
    const el = document.getElementById('date');
    if (!el) return;

    const d = new Date();
    el.textContent =
            d.getFullYear() + '年' +
            (d.getMonth() + 1) + '月' +
            d.getDate() + '日';
}

// ---------------------
// 画面切替（履歴管理付き）
// ---------------------
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => { s.style.display = 'none'; });

    const target = document.getElementById(screenId);
    if (!target) return;

    const current = screenHistory[screenHistory.length - 1];
    if (current !== screenId) {
        screenHistory.push(screenId);
    }

    target.style.display = 'block';
}

// ---------------------
// data-nav（下メニュー）
// ---------------------
function bindNavigation() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-nav]');
        if (!btn) return;
        showScreen(btn.getAttribute('data-nav'));
    });
}

// ---------------------
// チュートリアル操作
// ---------------------
function bindTutorialActions() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');

        if (action === 'next') {
            const next = btn.getAttribute('data-next');
            if (next) showScreen(next);
        }

        if (action === 'back') {
            screenHistory.pop();
            const prev = screenHistory.pop();
            showScreen(prev || 'syokiGamen');
        }

        if (action === 'skip') {
            screenHistory = [];
            showScreen('sinkiTourokuGamen');
        }
    });
}

const step4Btn = document.getElementById('step4Button');
if (step4Btn) {
    step4Btn.addEventListener('click', () => {
        screenHistory = [];
        showScreen('sinkiTourokuGamen');
    });
}

const goRegisterBtn = document.getElementById('goRegisterBtn');
if (goRegisterBtn) {
    goRegisterBtn.addEventListener('click', () => {
        screenHistory = [];
        showScreen('sinkiTourokuGamen');
    });
}

const backBtn = document.getElementById('backToLoginBtn');
if (backBtn) {
    backBtn.addEventListener('click', () => showScreen('syokiGamen'));
}

// ---------------------
// ボタン紐付け
// ---------------------
function bindButtons() {
    const startBtn = document.getElementById('startTutorialBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => showScreen('step1'));
    }

    const loginBtn = document.getElementById('roguinButton');
    if (loginBtn) loginBtn.addEventListener('click', login);

    const registerBtn = document.getElementById('tourokuButton');
    if (registerBtn) registerBtn.addEventListener('click', registerUser);

    const recordBtn = document.getElementById('tasseiButton');
    if (recordBtn) recordBtn.addEventListener('click', recordToday);

    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) editBtn.addEventListener('click', openEditProfile);

    const updateBtn = document.getElementById('updateProfileBtn');
    if (updateBtn) updateBtn.addEventListener('click', updateProfile);

    const nakamaBtn = document.getElementById('nakamaButton');
    if (nakamaBtn) {
        nakamaBtn.addEventListener('click', () => {
            if (!user) {
                alert('ログインしてください');
                return;
            }
            showNakama(user.合言葉);
        });
    }

    // 写真追加
    const photoInput = document.getElementById('photoInput');
    const addPhotoBtn = document.getElementById('addPhotoBtn');
    const removePhotoBtn = document.getElementById('removePhotoBtn');

    if (addPhotoBtn && photoInput) {
        addPhotoBtn.addEventListener('click', () => photoInput.click());
    }
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            selectedPhotoFile = file;
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('previewImg').src = ev.target.result;
                document.getElementById('photoPreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', () => {
            selectedPhotoFile = null;
            document.getElementById('photoInput').value = '';
            document.getElementById('photoPreview').style.display = 'none';
        });
    }
}

// ---------------------
// ログイン
// ---------------------
async function login() {
    const name = document.getElementById('loginName').value.trim();
    const pass = document.getElementById('loginPassword').value.trim();

    if (!name || !pass) {
        alert('名前とパスワードを入力してください');
        return;
    }

    const res = await supabase
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
    if (logoutBtn) logoutBtn.addEventListener('click', () => logout());

    const customizeBtn = document.getElementById('customizeBtn');
    if (customizeBtn) customizeBtn.addEventListener('click', () => showScreen('customizeScreen'));
}

// ---------------------
// ホーム反映
// ---------------------
function updateHome() {
    if (!user) return;
    document.getElementById('mokuhyouHyouzi').textContent = '目標： ' + user.目標;
    document.getElementById('ikigomiHyouzi').textContent = '意気込み： ' + user.意気込み;
    document.getElementById('renzokuHyouzi').textContent = '連続日数： ' + (user.連続日数 || 0) + '日';
}

// ---------------------
// 画像圧縮（Canvas API）
// ---------------------
function compressImage(file) {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const MAX = 1920;
            let w = img.naturalWidth;
            let h = img.naturalHeight;
            if (w > MAX || h > MAX) {
                if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                else        { w = Math.round(w * MAX / h); h = MAX; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            canvas.toBlob(resolve, 'image/jpeg', 0.82);
        };
        img.src = url;
    });
}

// ---------------------
// Supabase Storage にアップロード
// ---------------------
async function uploadPhoto(file, userId, date) {
    const compressed = await compressImage(file);
    const path = `${userId}/${date}.jpg`;
    const {error} = await supabase.storage
            .from('photos')
            .upload(path, compressed, {contentType: 'image/jpeg', upsert: true});
    if (error) {
        console.error('写真アップロードエラー:', error);
        return null;
    }
    const {data} = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
}

// ---------------------
// daily_records に保存
// ---------------------
async function saveDailyRecord(userId, recordDate, achieved, diaryText, photoUrl) {
    const record = {
        user_id: userId,
        record_date: recordDate,
        achieved: achieved,
        diary: diaryText
    };
    if (photoUrl) record.photo_url = photoUrl;

    const {error} = await supabase
            .from('daily_records')
            .upsert(record);

    if (error) {
        console.error('daily_records 保存エラー:', error);
    }
}

// ---------------------
// 今日の記録
// ---------------------
async function recordToday() {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    if (user.最終実施日 === today) {
        alert('今日は記録済みです');
        return;
    }

    const note = document.getElementById('dailyNoteInput').value.trim();

    // 写真アップロード
    let photoUrl = null;
    if (selectedPhotoFile) {
        const recordBtn = document.getElementById('tasseiButton');
        recordBtn.textContent = '写真アップロード中...';
        recordBtn.disabled = true;
        photoUrl = await uploadPhoto(selectedPhotoFile, user.登録番号, today);
        recordBtn.textContent = '記録';
        recordBtn.disabled = false;
    }

    // hibitan 更新と daily_records 保存を並列実行
    const [res] = await Promise.all([
        supabase
            .from('hibitan')
            .update({
                実施状況: true,
                連続日数: (user.連続日数 || 0) + 1,
                最終実施日: today,
                一言日記: note
            })
            .eq('登録番号', user.登録番号),
        saveDailyRecord(user.登録番号, today, true, note, photoUrl)
    ]);

    if (res.error) {
        alert('記録失敗');
        return;
    }

    user.連続日数++;
    user.最終実施日 = today;
    updateHome();
    await renderCalendar(currentYear, currentMonth);

    // 入力リセット
    document.getElementById('dailyNoteInput').value = '';
    selectedPhotoFile = null;
    document.getElementById('photoInput').value = '';
    document.getElementById('photoPreview').style.display = 'none';

    alert('記録しました');
}

async function fetchMonthlyRecords(userId, year, month) {
    const pad = n => String(n).padStart(2, '0');
    const start = `${year}-${pad(month)}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${pad(month)}-${pad(lastDay)}`;

    const {data, error} = await supabase
            .from('daily_records')
            .select('*')
            .eq('user_id', userId)
            .gte('record_date', start)
            .lte('record_date', end);

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
    document.getElementById('calendarTitle').textContent = `${year}年${month}月`;

    const firstDay = new Date(year, month - 1, 1).getDay();

    // 空白セルを追加
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
            const mark = recordMap[dateStr].achieved === true ? '⭕' : '❌';
            cell.textContent = `${d}\n${mark}`;
            cell.onclick = () => showDailyDetail(recordMap[dateStr]);
        }

        grid.appendChild(cell);
    }
}

function showDailyDetail(record) {
    alert(`${record.record_date}\n\n${record.diary || '（日記なし）'}`);
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

    if (prevBtn) prevBtn.addEventListener('click', () => changeMonth(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeMonth(1));
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
    const data = {
        名前: document.getElementById('nameInput').value.trim(),
        パスワード: document.getElementById('passInput').value.trim(),
        目標: document.getElementById('mokuhyouInput').value.trim(),
        合言葉: document.getElementById('aikotoba').value.trim(),
        意気込み: document.getElementById('ikigomi').value.trim()
    };

    for (const k in data) {
        if (!data[k]) {
            alert('全て入力してください');
            return;
        }
    }

    const res = await supabase.from('hibitan').insert([data]).select().single();

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
    const name = document.getElementById('editName').value.trim();
    const pass = document.getElementById('editPass').value.trim();
    const goal = document.getElementById('editMokuhyou').value.trim();
    const msg = document.getElementById('editIkigomi').value.trim();

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
    if (!user || !user.登録番号) return;

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

    if (!data || data.length === 0) return;

    const latestGrowthDate = data[0].created_at;
    localStorage.setItem(TMP_LATEST_KEY, latestGrowthDate);

    const lastChecked = localStorage.getItem(CHECK_KEY);

    if (!lastChecked || new Date(latestGrowthDate) > new Date(lastChecked)) {
        const menuBtn = document.getElementById('userMenuBtn');
        if (menuBtn) menuBtn.classList.add('has-new');
    }
}

// ---------------------
// サブメニューを見たら解除
// ---------------------
function markGrowthChecked(user) {
    if (!user || !user.登録番号) return;

    const CHECK_KEY = `last_growth_checked_${user.登録番号}`;
    const latestGrowthDate = localStorage.getItem(TMP_LATEST_KEY);
    if (!latestGrowthDate) return;

    localStorage.setItem(CHECK_KEY, latestGrowthDate);

    const menuBtn = document.getElementById('userMenuBtn');
    if (menuBtn) menuBtn.classList.remove('has-new');
}

// ==========================
// 仲間表示＋コメント機能
// ==========================
async function showNakama(aikotoba) {
    const res = await supabase
            .from('hibitan')
            .select('*')
            .eq('合言葉', aikotoba);

    // ログインユーザーを先頭に
    if (user && user.登録番号) {
        res.data.sort((a, b) => {
            if (a.登録番号 === user.登録番号) return -1;
            if (b.登録番号 === user.登録番号) return 1;
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

    // コメント件数・今日の写真を並列取得
    const countsPromises = res.data.map(u =>
        supabase
                .from('comments')
                .select('id', {count: 'exact', head: true})
                .eq('target_user_id', u.登録番号)
    );
    const photoPromises = res.data.map(u =>
        supabase
                .from('daily_records')
                .select('photo_url')
                .eq('user_id', u.登録番号)
                .eq('record_date', today)
                .maybeSingle()
    );
    const [countsResults, photoResults] = await Promise.all([
        Promise.all(countsPromises),
        Promise.all(photoPromises)
    ]);

    for (let i = 0; i < res.data.length; i++) {
        const u = res.data[i];
        const countResult = countsResults[i];
        const photoUrl = photoResults[i]?.data?.photo_url || null;

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
      ${photoUrl ? `
      <button class="photo-toggle-btn">📷 今日の写真を見る</button>
      <div class="nakama-photo" style="display:none">
        <img src="${photoUrl}" alt="${u.名前}の今日の写真" loading="lazy">
      </div>
      ` : ''}
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

        // 写真トグル
        const photoToggleBtn = div.querySelector('.photo-toggle-btn');
        const nakamaPhoto = div.querySelector('.nakama-photo');
        if (photoToggleBtn && nakamaPhoto) {
            photoToggleBtn.addEventListener('click', () => {
                const isHidden = nakamaPhoto.style.display === 'none';
                nakamaPhoto.style.display = isHidden ? 'block' : 'none';
                photoToggleBtn.textContent = isHidden ? '📷 非表示にする' : '📷 今日の写真を見る';
            });
        }

        const commentBtn = div.querySelector('.comment-btn');
        const commentsArea = div.querySelector('.comments-area');
        const input = div.querySelector('.comment-input');
        const submitBtn = div.querySelector('.comment-submit');

        // コメント表示切替
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
            if (!text || !user) return;

            await supabase.from('comments').insert([{
                    record_id: null,
                    user_id: user.登録番号,
                    target_user_id: u.登録番号,
                    content: text,
                    created_at: new Date()
                }]);
            await fetch('https://wxldxsrdjgovhteqxgbw.supabase.co/functions/v1/clever-processor', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    targetUserId: u.登録番号,
                    message: user.名前 + 'さんからコメントが届きました'
                })
            });

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

// ---------------------
// コメント読み込み
// ---------------------
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

    // ユーザー名を一括取得（N+1解消）
    const userIds = [...new Set(comments.map(c => c.user_id))];
    const {data: users} = await supabase
            .from('hibitan')
            .select('登録番号, 名前')
            .in('登録番号', userIds);
    const userMap = Object.fromEntries((users || []).map(u => [u.登録番号, u.名前]));

    for (const c of comments) {
        const name = userMap[c.user_id] || '名無し';
        const date = new Date(c.created_at);
        const time = String(date.getHours()).padStart(2, '0') + ':' +
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

async function enablePush() {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        alert('通知が許可されませんでした');
        return;
    }

    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
                'BOY3SygYjFHLaLHSt-tDvF3S-8vxFXcbzK59kjCFOcUHKSaVE1l5HKh2TiLcwUbJgGY3P8qluDYXgtL0z1vZWyw'
                )
    });

    await supabase
            .from('push_subscriptions')
            .upsert(
                    {user_id: user.登録番号, subscription: JSON.stringify(subscription)},
                    {onConflict: ['user_id']}
            );

    alert('通知をONにしました');
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function disablePush() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        await subscription.unsubscribe();
    }

    await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.登録番号);

    alert('通知をOFFにしました');
}

const enableBtn = document.getElementById('enablePushBtn');
if (enableBtn) enableBtn.addEventListener('click', enablePush);

const disableBtn = document.getElementById('disablePushBtn');
if (disableBtn) disableBtn.addEventListener('click', disablePush);

const seityouBtn = document.getElementById('seityouBtn');
if (seityouBtn) seityouBtn.addEventListener('click', showSeityouKiroku);

const pushSettingsBtn = document.getElementById('pushSettingsBtn');
if (pushSettingsBtn) {
    pushSettingsBtn.addEventListener('click', () => showScreen('pushSettingsScreen'));
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/hibitan/sw.js')
        .then(reg => console.log('SW登録成功', reg))
        .catch(err => console.error('SW登録失敗', err));
}

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
// ログイン後の初期化
// =====================
function onUserReady(user) {
    checkNewGrowth(user);

    const menuBtn = document.getElementById('userMenuBtn');
    if (menuBtn) {
        menuBtn.onclick = () => markGrowthChecked(user);
    }
}

// =====================
// テーマ定義
// =====================
const THEMES = {
    green:  { main: '#50c850', soft: '#d6f7d6', accent: '#4cd24c' },
    blue:   { main: '#4fa3d1', soft: '#dbeffc', accent: '#3c91c8' },
    pink:   { main: '#e67aa0', soft: '#fde4ec', accent: '#dd5f8c' },
    orange: { main: '#f2a65a', soft: '#fff0df', accent: '#ef9440' },
    purple: { main: '#9b8cd9', soft: '#ebe7fa', accent: '#8775cf' },
    beige:  { main: '#c8b89a', soft: '#f5f1e8', accent: '#b09a6a' }
};

// =====================
// テーマ適用
// =====================
function applyTheme(key) {
    const theme = THEMES[key];
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--main', theme.main);
    root.style.setProperty('--main-soft', theme.soft);
    root.style.setProperty('--accent', theme.accent);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.main);

    localStorage.setItem('hibitan_theme', key);
}

// =====================
// 起動時テーマ復元
// =====================
function loadTheme() {
    const saved = localStorage.getItem('hibitan_theme');
    if (saved && THEMES[saved]) applyTheme(saved);
}

window.addEventListener('DOMContentLoaded', () => {
    loadTheme();

    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            applyTheme(btn.dataset.theme);
            alert('テーマを変更しました');
        });
    });
});

// ---------------------
// フィードバック送信
// ---------------------
const feedbackBtn = document.getElementById('commentSendButton');
const feedbackInput = document.getElementById('commentInput');

if (feedbackBtn && feedbackInput) {
    feedbackBtn.addEventListener('click', async () => {
        const text = feedbackInput.value.trim();
        if (!text) {
            alert('コメントを入力してください');
            return;
        }

        if (!user || !user.名前) {
            alert('ログインしてください');
            return;
        }

        try {
            const {error} = await supabase
                    .from('feedback')
                    .insert([{名前: user.名前, コメント: text}]);

            if (error) {
                console.error('コメント送信エラー', error);
                alert('コメント送信に失敗しました');
                return;
            }

            alert('コメントを送信しました！');
            feedbackInput.value = '';
        } catch (e) {
            console.error(e);
            alert('コメント送信中にエラーが発生しました');
        }
    });
}

/* =========================
   ログイン画面 ミニゲーム
========================= */
window.addEventListener('load', () => {
    const character = document.getElementById('character');
    const gameArea = document.getElementById('gameArea');
    if (!character || !gameArea) return;

    let pos = 0;
    let direction = 1;

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
        if (!line) return;
        const p = getEventPos(e);
        const dx = p.x - startX;
        const dy = p.y - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        line.style.width = dist + 'px';
        line.style.transform = `rotate(${angle}deg)`;
    }

    function endDrag(e) {
        if (!line) return;
        const p = getEventPos(e);
        const dx = p.x - startX;
        const dy = p.y - startY;

        shootBullet(-dx, -dy);
        line.remove();
        line = null;
    }

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
                character.style.transform += ' translateY(-20px)';
                setTimeout(() => {
                    character.style.transform =
                            direction === 1 ? 'scaleX(1)' : 'scaleX(-1)';
                }, 200);
                return;
            }

            if (x < 0 || y < 0 || x > gameArea.clientWidth || y > gameArea.clientHeight) {
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

    subMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.addEventListener('click', () => {
        subMenu.classList.remove('open');
    });

    gameArea.addEventListener('mousedown', startDrag);
    gameArea.addEventListener('mousemove', drag);
    gameArea.addEventListener('mouseup', endDrag);

    gameArea.addEventListener('touchstart', startDrag);
    gameArea.addEventListener('touchmove', drag);
    gameArea.addEventListener('touchend', endDrag);
});

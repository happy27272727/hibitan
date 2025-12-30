// Hibitan.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://wxldxsrdjgovhteqxgbw.supabase.co';
const supabaseKey = 'sb_publishable_2lBv3Dx0yleqcTKKY07S6A_cln-SkeK';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Hibitan.js 読み込み済み");


let user = null;
let currentStep = null;
let fromInitial = false;

window.addEventListener('DOMContentLoaded', () => {
    const display = new DateDisplay('date');
    display.showToday();

    const submenu = new Submenu('menuButton', 'submenu');

    const tourokuBtn = document.getElementById('tourokuButton');
if (tourokuBtn) {
    tourokuBtn.addEventListener('click', tourokuButton);
}


    const roguinBtn = document.getElementById('roguinButton');
    if (roguinBtn) roguinBtn.addEventListener('click', loginButtonClick);

    const tasseiBtn = document.getElementById('tasseiButton');
    if (tasseiBtn) tasseiBtn.addEventListener('click', tasseiButtonClick);

    const nakamaBtn = document.getElementById('nakamaButton');
    if (nakamaBtn) {
        nakamaBtn.addEventListener('click', () => {
            if (user && user.合言葉) {
                showNakama(user.合言葉);
            } else {
                alert('まずログインしてください');
            }
        });
    }

    const commentSendBtn = document.getElementById('commentSendButton');
    if (commentSendBtn) {
        commentSendBtn.addEventListener('click', sendComment);
    }
});

// ---------------------
// 関数定義
// ---------------------
function showScreen(screenId) {
    const screens = [
        'syokiGamen','homeGamen','kinouGaiyou','nakamanoYousu',
        'sinkiTourokuGamen','step1','step2','step3','step4','commentGamen',
        'editProfileScreen'
    ];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (id === screenId) ? 'block' : 'none';
    });

    if (['step1','step2','step3','step4'].includes(screenId)) {
        currentStep = screenId;
    } else {
        currentStep = null;
    }
}

function startTutorialFromInitial() { fromInitial = true; showScreen('step1'); }
function startTutorialFromHome() { fromInitial = false; showScreen('step1'); }
function tutorialLater() {
    if (currentStep === 'step4') return;
    showScreen(fromInitial ? 'sinkiTourokuGamen' : 'homeGamen');
    fromInitial = false;
}
function showStep4() {
    showScreen('step4');
    const btn = document.getElementById('step4Button');
    if (!btn) return;
    if (fromInitial) {
        btn.textContent = "新規登録へ";
        btn.onclick = () => showScreen('sinkiTourokuGamen');
    } else {
        btn.textContent = "ホームに戻る";
        btn.onclick = () => showScreen('homeGamen');
    }
}

// ---------------------
// クラス定義
// ---------------------
class DateDisplay {
    constructor(date) { this.element = document.getElementById(date); }
    showToday() {
        const today = new Date();
        if (this.element) {
            this.element.textContent = `${today.getFullYear()}年${today.getMonth()+1}月${today.getDate()}日`;
        }
    }
}

class Submenu {
    constructor(menuButton, submenu) {
        this.button = document.getElementById(menuButton);
        this.menu = document.getElementById(submenu);
        if (this.button && this.menu) {
            this.button.addEventListener('click', () => this.toggle());
            document.addEventListener('click', (event) => {
                if (!this.button.contains(event.target) && !this.menu.contains(event.target)) this.close();
            });
        }
    }
    toggle() { if (this.menu) this.menu.style.display = (this.menu.style.display === 'block') ? 'none' : 'block'; }
    close() { if (this.menu) this.menu.style.display = 'none'; }
}

// ---------------------
// ボタン処理
// ---------------------
async function loginButtonClick() {
    const loginNameEl = document.getElementById('loginName');
    const loginPasswordEl = document.getElementById('loginPassword');
    const name = loginNameEl ? loginNameEl.value.trim() : '';
    const password = loginPasswordEl ? loginPasswordEl.value.trim() : '';
    if (!name || !password) { alert("名前とパスワードを入力してください"); return; }

    const { data, error } = await supabase.from('hibitan').select('*').eq('名前', name).eq('パスワード', password);
    if (error) { alert('検索失敗'); console.error(error); return; }
    if (!data || data.length === 0) { alert('名前またはパスワードが間違っています'); return; }

    user = data[0];
    const mokuhyouHyouziEl = document.getElementById('mokuhyouHyouzi');
    const ikigomiHyouziEl = document.getElementById('ikigomiHyouzi');
    const renzokuHyouziEl = document.getElementById('renzokuHyouzi');
    if (mokuhyouHyouziEl) mokuhyouHyouziEl.textContent = `目標: ${user.目標}`;
    if (ikigomiHyouziEl) ikigomiHyouziEl.textContent = `意気込み: ${user.意気込み}`;
    if (renzokuHyouziEl) renzokuHyouziEl.textContent = `連続日数: ${user.連続日数 || 0}日`;

    showScreen('homeGamen');
}

function setEditProfileForm() {
    if (!user) return;
    document.getElementById('editName').value = user.名前;
    document.getElementById('editMokuhyou').value = user.目標;
    document.getElementById('editIkigomi').value = user.意気込み;
}

window.addEventListener('DOMContentLoaded', () => {
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) editBtn.addEventListener('click', () => {
        showScreen('editProfileScreen');
        setEditProfileForm();
    });
});

async function tasseiButtonClick() {
    if (!user) return alert('ログインしてください');
    const today = new Date().toISOString().split('T')[0];

    const dailyNoteEl = document.getElementById('dailyNoteInput');
    const dailyNoteInput = dailyNoteEl ? dailyNoteEl.value.trim() : '';

    const { data: userData, error: fetchError } = await supabase
        .from('hibitan')
        .select('登録番号, 実施状況, 連続日数, 最終実施日')
        .eq('登録番号', user.登録番号)
        .single();
    if (fetchError) { console.error(fetchError); alert('更新に失敗しました'); return; }

    const lastDate = userData && userData.最終実施日 ? userData.最終実施日.split('T')[0] : null;
    if (lastDate === today) { alert('今日はすでに記録済みです'); return; }

    const newStreak = (userData.連続日数 || 0) + 1;
    const { data, error } = await supabase.from('hibitan')
        .update({ 実施状況:true, 連続日数:newStreak, 最終実施日:today, 一言日記:dailyNoteInput })
        .eq('登録番号', user.登録番号)
        .select();
    if (error || !data || data.length === 0) { console.error(error); alert('更新に失敗'); return; }

    user.連続日数 = newStreak;
    const mokuhyouHyouziEl = document.getElementById('mokuhyouHyouzi');
    const ikigomiHyouziEl = document.getElementById('ikigomiHyouzi');
    const renzokuHyouziEl = document.getElementById('renzokuHyouzi');
    if (mokuhyouHyouziEl) mokuhyouHyouziEl.textContent = `目標: ${user.目標}`;
    if (ikigomiHyouziEl) ikigomiHyouziEl.textContent = `意気込み: ${user.意気込み}`;
    if (renzokuHyouziEl) renzokuHyouziEl.textContent = `連続日数: ${user.連続日数}日`;

    if (dailyNoteEl) dailyNoteEl.value = '';
    alert(`今日を記録しました！ 連続日数: ${user.連続日数}日`);
}


async function tourokuButton() {
    let missingFields = [];
    const nameInput = document.getElementById("nameInput").value;
    const mokuhyouInput = document.getElementById("mokuhyouInput").value;
//    const zissiHindo = document.getElementById("zissiHindo").value;
//    const tuutiZikan = document.getElementById("tuutiZikan").value;
    const ikigomi = document.getElementById("ikigomi").value;
    const aikotoba = document.getElementById("aikotoba").value;
    const password = document.getElementById("passInput").value;
    
if (!nameInput) missingFields.push("ニックネーム");
if (!password) missingFields.push("パスワード");
if (!mokuhyouInput) missingFields.push("目標");
if (!aikotoba) missingFields.push("合言葉");
if (!ikigomi) missingFields.push("意気込み");

if (missingFields.length > 0) {
    alert(`${missingFields.join("・")}を入力してください`);
    return;
}


// パスワード重複チェック
const { data: existingPasswords, error: checkPassError } = await supabase
    .from('hibitan')
    .select('パスワード')
    .eq('パスワード', password);

if (checkPassError) {
    console.error('パスワード重複チェック失敗:', checkPassError);
    alert('登録前のチェックに失敗しました');
    return;
}

if (existingPasswords && existingPasswords.length > 0) {
    alert('このパスワードはすでに使われています。別のパスワードにしてください。');
    return;
}

    
    // 登録処理
    const { data, error } = await supabase
        .from('hibitan')
        .insert([
    {   "名前": nameInput,
        "目標": mokuhyouInput,
//        "実施頻度": zissiHindo,
//        "通知時間": tuutiZikan,
        "合言葉": aikotoba,
        "意気込み": ikigomi,
        "パスワード": password
        }
    ])
    .select();


    if (error) {
        console.error("登録失敗:", error);
        alert("登録失敗");
    } else {
        alert("登録成功！");
        
        user = data[0];
        
         document.getElementById('mokuhyouHyouzi').textContent = `目標: ${user.目標}`;
    document.getElementById('ikigomiHyouzi').textContent = `意気込み: ${user.意気込み}`;
    
        // 登録後にホーム画面に戻す
        showScreen('homeGamen');
    }
}

window.tourokuButton = tourokuButton; // HTML から呼べるようにグローバルに


window.addEventListener('DOMContentLoaded', () => {
    const updateBtn = document.getElementById('updateProfileBtn');
    if (updateBtn) updateBtn.addEventListener('click', updateProfile);
});

async function updateProfile() {
    if (!user) { alert('まずログインしてください'); return; }

    const nameEl = document.getElementById('editName');
    const mokuhyouEl = document.getElementById('editMokuhyou');
    const ikigomiEl = document.getElementById('editIkigomi');

    const newName = nameEl ? nameEl.value.trim() : '';
    const newMokuhyou = mokuhyouEl ? mokuhyouEl.value.trim() : '';
    const newIkigomi = ikigomiEl ? ikigomiEl.value.trim() : '';

    if (!newName || !newMokuhyou || !newIkigomi) {
        alert('全て入力してください'); 
        return;
    }

    const { data, error } = await supabase
        .from('hibitan')
        .update({
            名前: newName,
            目標: newMokuhyou,
            意気込み: newIkigomi
        })
        .eq('登録番号', user.登録番号)
        .select();

    if (error) {
        console.error(error);
        alert('更新に失敗しました');
        return;
    }

    user.名前 = newName;
    user.目標 = newMokuhyou;
    user.意気込み = newIkigomi;

    document.getElementById('mokuhyouHyouzi').textContent = `目標: ${user.目標}`;
    document.getElementById('ikigomiHyouzi').textContent = `意気込み: ${user.意気込み}`;

    alert('プロフィールを更新しました！');
}



// 仲間の様子を表示
async function showNakama(aikotoba) {
    const { data, error } = await supabase
        .from('hibitan')
        .select('名前, 目標, 実施状況, 意気込み, 合言葉, 連続日数, 一言日記, 最終実施日')
        .eq('合言葉', aikotoba);

    if (error) {
        console.error(error);
        alert('仲間の取得に失敗しました');
        return;
    }

    if (!data || data.length === 0) {
        alert('仲間が見つかりません');
        return;
    }

    document.getElementById('teamHeader').textContent = `チーム: ${aikotoba}`;

    const container = document.getElementById('nakamaList');
    container.innerHTML = '';

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    data.forEach(user => {
    const today = new Date();
    const lastDate = user.最終実施日 ? new Date(user.最終実施日) : null;

    // 今日かどうか判定
    const isToday = lastDate
        ? lastDate.getFullYear() === today.getFullYear() &&
          lastDate.getMonth() === today.getMonth() &&
          lastDate.getDate() === today.getDate()
        : false;

    const div = document.createElement('div');
    div.style.border = '1px solid #ccc';
    div.style.margin = '10px 0';
    div.style.padding = '10px';

    div.innerHTML = `
        <p>名前: ${user.名前}</p>
        <p>目標: ${user.目標}</p>
        <p>今日の記録: ${isToday && user.実施状況 ? '✅' : 'まだ ❌'}</p>
        <p>連続日数: ${user.連続日数 || 0}日</p>
        <p>意気込み: ${user.意気込み}</p>
        <p>一言日記: ${isToday && user.実施状況 && user.一言日記 ? user.一言日記 : '未記入'}</p>
    `;

    container.appendChild(div);
});



    showScreen('nakamanoYousu');
}

const character = document.getElementById('character');
const gameArea = document.getElementById('gameArea');
let pos = 0;
let direction = 1;

// キャラクター移動
function moveCharacter() {
    const gameWidth = gameArea.clientWidth;
    pos += 20 * direction;
    if (pos > gameWidth - 60 || pos < 0) {
        direction *= -1;
        character.style.transform = direction === 1 ? 'scaleX(1)' : 'scaleX(-1)';
    }
    character.style.left = pos + 'px';
}
setInterval(moveCharacter, 200);

// 弾の準備
let startX, startY, line;
let lastPos = { x: 0, y: 0 };

// マウス・タッチの座標取得
function getEventPos(e) {
    const rect = gameArea.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) { // タッチ中
        lastPos = {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
        return lastPos;
    } else if (e.changedTouches && e.changedTouches.length > 0) { // touchend
        return {
            x: e.changedTouches[0].clientX - rect.left,
            y: e.changedTouches[0].clientY - rect.top
        };
    } else { // マウス
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
}

// ドラッグ開始
function startDrag(e) {
    e.preventDefault();
    const pos = getEventPos(e);
    startX = pos.x;
    startY = pos.y;

    line = document.createElement('div');
    line.classList.add('line');
    line.style.left = startX + 'px';
    line.style.top = startY + 'px';
    line.style.width = '0px';
    gameArea.appendChild(line);
}

// ドラッグ中
function drag(e) {
    if (!line) return;
    const pos = getEventPos(e);
    const dx = pos.x - startX;
    const dy = pos.y - startY;
    const distance = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    line.style.width = distance + 'px';
    line.style.transform = `rotate(${angle}deg)`;
}

// ドラッグ終了
function endDrag(e) {
    if (!line) return;
    const pos = getEventPos(e);
    const dx = pos.x - startX;
    const dy = pos.y - startY;

    shootBullet(-dx, -dy); // 引っ張り逆方向に発射
    line.remove();
    line = null;
}

// 弾の発射
function shootBullet(dx, dy) {
    const bullet = document.createElement('span');
    bullet.textContent = '💚';
    bullet.classList.add('bullet');
    bullet.style.left = startX + 'px';
    bullet.style.top = startY + 'px';
    gameArea.appendChild(bullet);

    let posX = parseFloat(bullet.style.left);
    let posY = parseFloat(bullet.style.top);
    const speed = 0.2;

    function animate() {
        posX += dx * speed;
        posY += dy * speed;
        bullet.style.left = posX + 'px';
        bullet.style.top = posY + 'px';

        // キャラクター当たり判定
        const charX = character.offsetLeft;
        const charY = character.offsetTop;
        const charW = character.offsetWidth;
        const charH = character.offsetHeight;

        if (posX > charX && posX < charX + charW && posY > charY && posY < charY + charH) {
            bullet.remove();
            character.style.transform += ' translateY(-20px)';
            setTimeout(() => character.style.transform = direction===1?'scaleX(1)':'scaleX(-1)', 200);
            return;
        }

        // 画面外判定
        const areaW = gameArea.clientWidth;
        const areaH = gameArea.clientHeight;
        if (posX < 0 || posX > areaW || posY < 0 || posY > areaH) {
            bullet.remove();
            return;
        }

        requestAnimationFrame(animate);
    }
    animate();
}

// キャラクタータップアクション
character.addEventListener('click', () => {
    // 表情チェンジ
    character.textContent = '😺';
    setTimeout(() => character.textContent = '🐱', 500);

    // ジャンプ
    character.style.bottom = '60px';
    setTimeout(() => character.style.bottom = '0px', 300);

    // ハート飛ばす
    const heart = document.createElement('span');
    heart.textContent = '💚';
    heart.style.position = 'absolute';
    heart.style.left = pos + 'px';
    heart.style.bottom = '60px';
    heart.style.fontSize = '30px';
    heart.style.transition = 'all 1s ease';
    gameArea.appendChild(heart);

    setTimeout(() => {
        heart.style.opacity = 0;
        heart.style.transform = 'translateY(-80px) scale(1.2)';
    }, 50);

    setTimeout(() => heart.remove(), 1050);
});

// イベントリスナー
gameArea.addEventListener('mousedown', startDrag);
gameArea.addEventListener('touchstart', startDrag);

gameArea.addEventListener('mousemove', drag);
gameArea.addEventListener('touchmove', drag);

gameArea.addEventListener('mouseup', endDrag);
gameArea.addEventListener('touchend', endDrag);




// ---------------------
// 関数公開
// ---------------------
window.showScreen = showScreen;
window.startTutorialFromInitial = startTutorialFromInitial;
window.startTutorialFromHome = startTutorialFromHome;
window.tutorialLater = tutorialLater;
window.showStep4 = showStep4;
window.tourokuButton = tourokuButton;
window.sendComment = sendComment;
window.setEditProfileForm = setEditProfileForm;
window.showNakama = showNakama;


// 例: Hibitan.js の最後の方
async function sendComment() {
    const commentInputEl = document.getElementById('commentInput');
    const comment = commentInputEl ? commentInputEl.value.trim() : '';
    if(!comment){ alert('コメントを入力してください'); return; }

    const { error } = await supabase.from('feedback').insert([{ 名前:user.名前, コメント:comment }]);
    if(error){ console.error(error); alert('登録に失敗しました'); return; }

    alert('コメントを送信しました。あざます！！');
    if(commentInputEl) commentInputEl.value='';
    showScreen('homeGamen');
}

// グローバルに公開
window.sendComment = sendComment;



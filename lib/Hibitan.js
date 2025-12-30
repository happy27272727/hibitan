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
        'sinkiTourokuGamen','step1','step2','step3','step4','commentGamen'
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
        const lastDateStr = user.最終実施日
            ? new Date(user.最終実施日).toISOString().split('T')[0]
            : null;

        const isToday = lastDateStr === todayStr;

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
            <p>一言日記: ${user.一言日記 ? user.一言日記 : '未記入'}</p>
        `;
        container.appendChild(div);
    });

    showScreen('nakamanoYousu');
}

window.showNakama = showNakama;



// ---------------------
// 関数公開
// ---------------------
window.showScreen = showScreen;
window.startTutorialFromInitial = startTutorialFromInitial;
window.startTutorialFromHome = startTutorialFromHome;
window.tutorialLater = tutorialLater;
window.showStep4 = showStep4;

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



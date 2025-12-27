import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

        const supabaseUrl = 'https://wxldxsrdjgovhteqxgbw.supabase.co'
        const supabaseKey = 'sb_publishable_2lBv3Dx0yleqcTKKY07S6A_cln-SkeK'
        const supabase = createClient(supabaseUrl, supabaseKey)
        
window.showScreen = showScreen;  // HTML onclick 用に公開
let user = null; 


window.addEventListener('DOMContentLoaded', () => {

    // 日付表示
    const display = new DateDisplay('date');
    display.showToday();

    // サブメニュー初期化
    const submenu = new Submenu('menuButton', 'submenu');

    // 新規登録ボタン
    document.getElementById("tourokuButton").addEventListener("click", tourokuButton);

    // 仲間ボタン
    const nakamaBtn = document.getElementById('nakamaButton');
    nakamaBtn.addEventListener('click', () => {
        if (user && user.合言葉) {
            showNakama(user.合言葉);
        } else {
            alert('まずログインしてください');
        }
    });
});


document.getElementById('roguinButton').addEventListener('click', async () => {
    
    const name = document.getElementById('loginName').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!name || !password) {
        alert("名前とパスワードを入力してください");
        return;
    }
    
    // Supabaseから名前とパスワードで照合
    const { data, error } = await supabase
        .from('hibitan')
        .select('*')
        .eq('名前', name)
        .eq('パスワード', password);

    if (error) {
        console.error('検索失敗:', error);
        alert('検索に失敗しました');
        return;
    }

    if (!data || data.length === 0) {
        alert('名前またはパスワードが間違っています');
        return;
    }

    user = data[0];

    // ホーム画面にデータを表示
    document.getElementById('mokuhyouHyouzi').textContent = `目標: ${user.目標}`;
    document.getElementById('ikigomiHyouzi').textContent = `意気込み: ${user.意気込み}`;
    document.getElementById('renzokuHyouzi').textContent = `連続日数: ${user.連続日数 || 0}日`;

    // ホーム画面に遷移
    showScreen('homeGamen');
    });



async function tasseiButtonClick() {
    const today = new Date().toISOString().split('T')[0]; // 今日の日付 YYYY-MM-DD

    const { data: userData, error: fetchError } = await supabase
        .from('hibitan')
        .select('登録番号, 実施状況, 連続日数, 最終実施日')
        .eq('登録番号', user.登録番号)
        .single();

    if (fetchError) {
        console.error('ユーザー取得失敗:', fetchError);
        alert('更新に失敗しました');
        return;
    }

    const lastDate = userData.最終実施日 ? userData.最終実施日.split('T')[0] : null;
    if (lastDate === today) {
        alert('今日はすでに記録済みです');
        return;
    }

    // 安全に連続日数をインクリメント
    const newStreak = (userData.連続日数 || 0) + 1;

    const { data, error } = await supabase
        .from('hibitan')
        .update({
            実施状況: true,
            連続日数: newStreak,
            最終実施日: today
        })
        .eq('登録番号', user.登録番号)
        .select();

    if (error || !data || data.length === 0) {
        console.error('更新失敗:', error);
        alert('更新に失敗しました');
        return;
    }

    // userオブジェクトと画面に反映
    user.連続日数 = newStreak;

    document.getElementById('mokuhyouHyouzi').textContent = `目標: ${user.目標}`;
    document.getElementById('ikigomiHyouzi').textContent = `意気込み: ${user.意気込み}`;
    document.getElementById('renzokuHyouzi').textContent = `連続日数: ${user.連続日数}日`;

    alert(`今日を記録しました！ 連続日数: ${user.連続日数}日`);
}


// ボタンに紐付け
document.getElementById("tasseiButton").addEventListener("click", tasseiButtonClick);


class DateDisplay {
constructor(date) {
this.element = document.getElementById(date);
}

showToday() {
const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        this.element.textContent = year + "年" + month + "月" + day + "日";
}
}
        


class Submenu {
    constructor(menuButton, submenu) {
        this.button = document.getElementById(menuButton);
        this.menu = document.getElementById(submenu);
                //ボタンクリックで開閉
                this.button.addEventListener('click', () => {
                this.toggle();
                });
                //外側クリックして閉じる
                document.addEventListener('click', (event) => {
                if (!this.button.contains(event.target) && !this.menu.contains(event.target)) {
                this.close();
                }
                });
        }

toggle() {
        if (this.menu.style.display === 'block') {
        this.menu.style.display = 'none';
        } else {
        this.menu.style.display = 'block';
        }
        }

        close() {
        this.menu.style.display = 'none';
        }

        }

let fromInitial = false; // チュートリアルが初期画面からかホーム画面からかを判定

let currentStep = null;
function showScreen(screenId) {
    const screens = ['syokiGamen',
        'homeGamen',
        'kinouGaiyou',
        'nakamanoYousu',
        'sinkiTourokuGamen',
        'step1',
        'step2',
        'step3',
        'step4',
        'commentGamen'
    ];
    screens.forEach(id => {
        const el = document.getElementById(id);
     if(id === screenId) {
         el.style.display = 'block';
     } else {
         el.style.display = 'none';
     }
 });
 
 //チュートリアル用画面遷移
 // step1～step4なら currentStep を更新
    if (['step1','step2','step3','step4'].includes(screenId)) {
        currentStep = screenId;
    } else {
        currentStep = null;
    }
}

function startTutorialFromInitial() {
    fromInitial = true;
    showScreen('step1');
}
window.startTutorialFromInitial = startTutorialFromInitial;

function startTutorialFromHome() {
    fromInitial = false;
    showScreen('step1');
}
window.startTutorialFromHome = startTutorialFromHome;

function tutorialLater() {
    // step4 の場合はボタンを押したときの動作に任せる
    if (currentStep === 'step4') {
        return;
    }

    if (fromInitial) {
        showScreen('sinkiTourokuGamen'); // 初期画面からなら新規登録画面に戻す
    } else {
        showScreen('homeGamen'); // ホームからならホーム画面に戻す
    }

    fromInitial = false;
}


// step4表示時に必ず呼ぶ
function showStep4() {
    showScreen('step4'); // step4 を表示

    const btn = document.getElementById('step4Button');

    if (fromInitial) {
        btn.textContent = "新規登録へ";
        btn.onclick = () => showScreen('sinkiTourokuGamen');
    } else {
        btn.textContent = "ホームに戻る";
        btn.onclick = () => showScreen('homeGamen');
    }
}
window.showStep4 = showStep4; // HTML から呼べるように公開


window.tutorialLater = tutorialLater;


//新規登録ボタン
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
//     // 名前重複チェック
//    const { data: existingUsers, error: checkError } = await supabase
//        .from('hibitan')
//        .select('名前')
//        .eq('名前', nameInput);
//
//    if (checkError) {
//        console.error('重複チェック失敗:', checkError);
//        alert('登録前のチェックに失敗しました');
//        return;
//    }
//
//    if (existingUsers && existingUsers.length > 0) {
//        alert('このニックネームは既に使われています');
//        return;
//    }

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



// 仲間の様子を表示
async function showNakama(aikotoba) {
    const { data, error } = await supabase
        .from('hibitan')
        .select('名前, 目標, 実施状況, 意気込み, 合言葉, 連続日数')
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

    data.forEach(user => {
        const div = document.createElement('div');
        div.style.border = '1px solid #ccc';
        div.style.margin = '10px 0';
        div.style.padding = '10px';
        div.innerHTML = `
            <p>名前: ${user.名前}</p>
            <p>目標: ${user.目標}</p>
            <p>今日の記録: ${user.実施状況 ? '✅' : 'まだ❌'}</p>
            <p>連続日数: ${user.連続日数 || 0}日</p>
            <p>意気込み: ${user.意気込み}</p>
        `;
        container.appendChild(div);
    });
    // 画面切替
    showScreen('nakamanoYousu');
}



document.getElementById('commentSendButton')
  .addEventListener('click', async () => {

    const comment = document.getElementById('commentInput').value.trim();

    if (!comment) {
        alert('コメントを入力してください');
        return;
    }

    const { error } = await supabase
        .from('feedback')
        .insert([
            {
                名前: user.名前,
                コメント: comment
            }
        ]);

    if (error) {
        console.error(error);
        alert('登録に失敗しました');
        return;
    }

    alert('コメントを送信しました。あざます！！');
    document.getElementById('commentInput').value = '';
    showScreen('homeGamen');
});

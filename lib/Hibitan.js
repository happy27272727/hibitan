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
window.addEventListener('DOMContentLoaded', function () {
    showToday();
    bindButtons();
    bindNavigation();
    bindTutorialActions();
    
    showScreen('syokiGamen');  // ← ログイン画面表示
});



// ---------------------
// 日付表示
// ---------------------
function showToday() {
    var el = document.getElementById('date');
    if (!el) return;

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
    if (!target) return;

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
        if (!btn) return;

        showScreen(btn.getAttribute('data-nav'));
    });
}

// ---------------------
// チュートリアル操作
// ---------------------
function bindTutorialActions() {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;

    var action = btn.getAttribute('data-action');

    // 次へ
    if (action === 'next') {
      var next = btn.getAttribute('data-next');
      if (next) showScreen(next);
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
    if (loginBtn) loginBtn.addEventListener('click', login);

    var registerBtn = document.getElementById('tourokuButton');
    if (registerBtn) registerBtn.addEventListener('click', registerUser);

    var recordBtn = document.getElementById('tasseiButton');
    if (recordBtn) recordBtn.addEventListener('click', recordToday);

    var commentBtn = document.getElementById('commentSendButton');
    if (commentBtn) commentBtn.addEventListener('click', sendComment);

    var editBtn = document.getElementById('editProfileBtn');
    if (editBtn) editBtn.addEventListener('click', openEditProfile);

    var updateBtn = document.getElementById('updateProfileBtn');
    if (updateBtn) updateBtn.addEventListener('click', updateProfile);

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
    updateHome();
    showScreen('homeGamen');
}

// ---------------------
// ホーム反映
// ---------------------
function updateHome() {
    document.getElementById('mokuhyouHyouzi').textContent = '目標： ' + user.目標;
    document.getElementById('ikigomiHyouzi').textContent = '意気込み： ' + user.意気込み;
    document.getElementById('renzokuHyouzi').textContent = '連続日数： ' + (user.連続日数 || 0) + '日';
}

// ---------------------
// 今日の記録
// ---------------------
async function recordToday() {
    if (!user) return;

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

    if (res.error) {
        alert('記録失敗');
        return;
    }

    user.連続日数++;
    user.最終実施日 = today;
    updateHome();
    alert('記録しました');
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
    showScreen('homeGamen');
}

// ---------------------
// プロフィール編集
// ---------------------
function openEditProfile() {
    document.getElementById('editName').value = user.名前;
    document.getElementById('editMokuhyou').value = user.目標;
    document.getElementById('editIkigomi').value = user.意気込み;
    showScreen('editProfileScreen');
}

async function updateProfile() {
    var name = document.getElementById('editName').value.trim();
    var goal = document.getElementById('editMokuhyou').value.trim();
    var msg = document.getElementById('editIkigomi').value.trim();

    if (!name || !goal || !msg) {
        alert('全て入力してください');
        return;
    }

    await supabase
        .from('hibitan')
        .update({ 名前: name, 目標: goal, 意気込み: msg })
        .eq('登録番号', user.登録番号);

    user.名前 = name;
    user.目標 = goal;
    user.意気込み = msg;

    updateHome();
    showScreen('homeGamen');
}

// ---------------------
// コメント
// ---------------------
async function sendComment() {
    var text = document.getElementById('commentInput').value.trim();
    if (!text) return;

    await supabase.from('feedback').insert([{ 名前: user.名前, コメント: text }]);
    document.getElementById('commentInput').value = '';
    alert('送信しました');
    showScreen('homeGamen');
}

// ---------------------
// 仲間
// ---------------------
async function showNakama(aikotoba) {
  const res = await supabase
    .from('hibitan')
    .select('*')
    .eq('合言葉', aikotoba);

  const list = document.getElementById('nakamaList');
  list.innerHTML = '';
  
  const teamHeader = document.getElementById('teamHeader');
  if (teamHeader) {
    teamHeader.textContent = `チーム：${aikotoba}`;
  }

  const today = new Date().toISOString().split('T')[0];

  if (!res.data || res.data.length === 0) {
    list.innerHTML = '<p>仲間がまだいません</p>';
    showScreen('nakamanoYousu');
    return;
  }

  res.data.forEach(function (u) {

    const isTodayDone = u.最終実施日 === today;

    const status = isTodayDone
      ? '✅'
      : 'ー';

    const note = isTodayDone
      ? (u.一言日記 || '（未入力）')
      : 'ー';

    const div = document.createElement('div');
    div.className = 'nakama-card';

    div.innerHTML = `
      <p class="nakama-name">👤 ${u.名前}</p>
      <p class="nakama-goal">🎯 目標：${u.目標}</p>
      <p class="nakama-msg">💬 意気込み：${u.意気込み}</p>
      <p class="nakama-status">🌱 実施状況：${status}</p>
      <p class="nakama-streak">🔥 連続日数：${u.連続日数 || 0}日</p>
      <p class="nakama-note">📝 一言日記： ${note}</p>
      <hr>
    `;

    list.appendChild(div);
  });

  showScreen('nakamanoYousu');
}


/* =========================
   ログイン画面 ミニゲーム（完全再現版）
   ========================= */

window.addEventListener('load', () => {

  const character = document.getElementById('character');
  const gameArea = document.getElementById('gameArea');
  if (!character || !gameArea) return;

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

  /* ===== イベント ===== */
  gameArea.addEventListener('mousedown', startDrag);
  gameArea.addEventListener('mousemove', drag);
  gameArea.addEventListener('mouseup', endDrag);

  gameArea.addEventListener('touchstart', startDrag);
  gameArea.addEventListener('touchmove', drag);
  gameArea.addEventListener('touchend', endDrag);

});




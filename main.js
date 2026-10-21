/* =====================================================================
 * 每幀更新：玩家／NPC 移動、讀條與 HUD、相機，最後啟動主迴圈
 * ===================================================================== */

function moveToward(m, dt) {
  const dx = m.tx - m.x,
    dz = m.tz - m.z,
    d = Math.hypot(dx, dz);
  if (d < 1e-3) return;
  const s = Math.min(d, SPEED * dt);
  m.x += (dx / d) * s;
  m.z += (dz / d) * s;
}
function updatePlayer(dt) {
  if (player.dead) return;
  let f = 0,
    r = 0;
  if (keys.KeyW || keys.ArrowUp) f += 1;
  if (keys.KeyS || keys.ArrowDown) f -= 1;
  if (keys.KeyD || keys.ArrowRight) r += 1;
  if (keys.KeyA || keys.ArrowLeft) r -= 1;
  f -= touchMove.y;
  r += touchMove.x;
  const l = Math.hypot(f, r);
  if (l < 0.05) return;
  if (l > 1) {
    f /= l;
    r /= l;
  }
  const fx_ = -Math.sin(camYaw),
    fz = -Math.cos(camYaw),
    rx = Math.cos(camYaw),
    rz = -Math.sin(camYaw);
  player.x += (fx_ * f + rx * r) * SPEED * dt;
  player.z += (fz * f + rz * r) * SPEED * dt;
  const d = Math.hypot(player.x, player.z),
    lim = WALK_R - 0.6;
  if (d > lim) {
    player.x *= lim / d;
    player.z *= lim / d;
  }
}
function updateNpcs(dt) {
  members.forEach(m => {
    if ((m.isPlayer && !window.__autopilot) || m.dead) return;
    if (state === 'running' && planFn && t >= m.reactAt) {
      const p = planFn(m);
      if (p) {
        m.tx = p.x;
        m.tz = p.z;
      }
    }
    moveToward(m, dt);
  });
}
function updateCastHud() {
  const c = $('cast');
  if (state !== 'running' || (!cast && !esc?.hitIdx && !advice)) {
    c.hidden = true;
    return;
  }
  c.hidden = false;
  if (cast) {
    $('castName').innerHTML = `${cast.name}<span>${cast.sub}</span>`;
    $('castFill').style.width = Math.min(100, ((t - cast.start) / cast.len) * 100) + '%';
  } else if (esc && esc.hitIdx < 4 && t > esc.start) {
    $('castName').innerHTML = `凌空錯<span>第 ${Math.min(esc.hitIdx + 1, 4)} / 4 刀</span>`;
    $('castFill').style.width = (esc.hitIdx / 4) * 100 + '%';
  } else {
    $('castName').innerHTML = '<span>準備</span>';
    $('castFill').style.width = '0%';
  }
  // 凌空錯的序列與提示
  const escActive = esc && t >= esc.start && esc.hitIdx < 4;
  if (escActive && cfg.hintSeq) {
    const slot = esc.castLen / 4.6,
      shown = Math.min(4, Math.floor((t - esc.start) / slot) + 1);
    $('seqChips').innerHTML = esc.seq
      .map((s, i) => {
        const known = i < shown;
        return `<span class="chip ${known ? s : 'unk'}${i === esc.hitIdx ? ' now' : ''}${i < esc.hitIdx ? ' done' : ''}">${i + 1} ${known ? (s === 'close' ? '近' : '遠') : '？'}</span>`;
      })
      .join('');
  } else $('seqChips').innerHTML = '';
  let adv = '';
  if (cfg.hintMe && !player.dead) {
    if (escActive) {
      adv =
        (esc.exempt && esc.hitIdx === 0) || (esc.adviceUntil && t < esc.adviceUntil)
          ? advice
          : t < esc.start + esc.castLen * 0.4
            ? '看王頭頂的菱形…'
            : `第 ${esc.hitIdx + 1} 刀：你${player.grp === baitGroup(esc.hitIdx) ? '要吃' : '不吃'} → 站${wantClose(player, esc.hitIdx) ? (esc.L || cfg.esc).closeTxt : (esc.L || cfg.esc).farTxt}`;
    } else adv = advice;
  }
  $('advice').textContent = adv;
}
function updateIndicator() {
  if (state !== 'running' || !esc || t < esc.start || t > esc.start + esc.castLen) {
    indicator.visible = false;
    return;
  }
  const slot = esc.castLen / 4.6,
    i = Math.floor((t - esc.start) / slot),
    local = t - esc.start - i * slot;
  if (i > 3 || local > slot * 0.82) {
    indicator.visible = false;
    return;
  }
  indicator.visible = true;
  indicator.material.map = iconTex(esc.seq[i]);
  indicator.material.needsUpdate = true;
  const s = 0.85 + Math.min(1, local * 4) * 0.25;
  indicator.scale.set(s, s, 1);
  indicator.lookAt(camera.position.x, indicator.position.y, camera.position.z);
}
function updateMeHud() {
  if (!player) return;
  $('meRole').textContent = `${player.id}・${GROUP_NAME[player.grp]}${player.dead ? '（倒地）' : ''}`;
  const left = player.slash - t;
  $('meDeb').innerHTML =
    left > 0 && state === 'running' ? `<span class="deb">斬擊耐性降低 ${left.toFixed(1)}s</span>` : '';
  $('meRec').textContent = `通過 ${stats.clears} / 嘗試 ${stats.tries}`;
}
function updateCamera() {
  const tx = player.x,
    tz = player.z,
    cp = Math.cos(camPitch);
  camera.position.set(
    tx + Math.sin(camYaw) * cp * camDist,
    Math.sin(camPitch) * camDist + 1,
    tz + Math.cos(camYaw) * cp * camDist
  );
  camera.lookAt(tx, 1.8, tz);
}

/* 推進一步模擬：時間軸事件、移動、特效、王的朝向 */
function simulate(dt) {
  dtRun = state === 'running' ? dt : 0;
  if (state === 'running') {
    t += dt;
    while (state === 'running' && events.length && events[0].at <= t) {
      const e = events.shift();
      e.fn();
    }
    if (state === 'running') ticks = ticks.filter(fn => !fn());
  }
  updatePlayer(dt);
  updateNpcs(dt);
  members.forEach(m => {
    m.obj.position.x = m.x;
    m.obj.position.z = m.z;
    if (state === 'running' && m.slash > t && !m.dead && !m.tag.visible) {
      setTag(m, '斬↓', '#ff6161', true);
    } else if (m._slashTag && (m.slash <= t || state !== 'running')) {
      setTag(m, '');
    }
  });
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i];
    if (state === 'running' && t > f.until) {
      scene.remove(f.obj);
      fx.splice(i, 1);
      continue;
    }
    if (f.fade && f.obj.material)
      f.obj.material.opacity = (f.op0 || 0.55) * Math.max(0, 1 - (t - f.born) / (f.until - f.born));
    if (f.obj.userData.rise) f.obj.position.y += f.obj.userData.rise * dtRun;
    if (f.obj.userData.flashUntil !== undefined) {
      const left = f.obj.userData.flashUntil - t;
      f.obj.material.color.setHex(left > 0 ? 0xff5c8a : 0xc8204e);
    }
  }
  if (boss.userData.face !== undefined) {
    const d = dirOf(boss.userData.face),
      target = Math.atan2(-d.x, -d.z) + Math.PI;
    let df = ((((target - boss.rotation.y) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
    boss.rotation.y += df * Math.min(1, dt * 10);
  } else boss.rotation.y += dt * 0.15;
}

/* 畫面：相機、HUD、渲染 */
function render() {
  hitRing.material.opacity = 0.6 + Math.sin(performance.now() / 300) * 0.2;
  updateCamera();
  updateIndicator();
  updateCastHud();
  updateMeHud();
  renderer.render(scene, camera);
}

/* 主迴圈。window.__substeps 只給自動測試用（一幀跑多步，加快模擬） */
const clock = new T.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const steps = window.__substeps || 1;
  for (let i = 0; i < steps; i++) simulate(dt);
  render();
  requestAnimationFrame(frame);
}

readCfg();
placeIdle();
requestAnimationFrame(frame);

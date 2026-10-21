const tela = document.getElementById("jogo");
const ctx = tela.getContext("2d");
const LARGURA = tela.width;
const ALTURA = tela.height;

const AREAS = [
  { nome: "Bugs", cor: "#ff5c7a", itens: ["Glitch", "Crash", "Freeze", "Lag", "Null", "Loop"] },
  { nome: "Vírus", cor: "#4da3ff", itens: ["Melissa", "Brain", "Nimda", "Sasser", "Blaster", "ILoveYou"] },
  { nome: "Worms", cor: "#c084fc", itens: ["Morris", "MyDoom", "Slammer", "CodeRed", "Conficker", "Sobig"] },
  { nome: "Trojans", cor: "#3ddc84", itens: ["Zeus", "Emotet", "Trojan", "SpyEye", "Petya", "Mirai"] },
  { nome: "Ransom", cor: "#ffb020", itens: ["WannaCry", "Locky", "NotPetya", "Crypto", "Ransom", "Ryuk"] },
  { nome: "Malware", cor: "#2ee6c7", itens: ["Spyware", "Adware", "Rootkit", "Phishing", "Keylog", "Botnet"] },
];

const MSG = {
  inicio: "Bem-vindo ao Quebra-Bugs! Prepare-se para eliminar os bugs e os vírus e restaurar o sistema.",
  jogo: "Continue! Cada bloco destruído aproxima você da vitória.",
  vitoria: "Sistema restaurado com sucesso! Você dominou o desafio da computação!",
  derrota: "Falha no sistema! Tente novamente e aperfeiçoe sua estratégia.",
};

const pontosEl = document.getElementById("pontos");
const vidasEl = document.getElementById("vidas");
const faseEl = document.getElementById("fase");
const recordeEl = document.getElementById("recorde");
const avisoEl = document.getElementById("aviso");
const painelTela = document.getElementById("tela");
const mensagemEl = document.getElementById("mensagem");
const botaoEl = document.getElementById("botao");
const musica = document.getElementById("musica");

let estado = "inicio";
let pontos = 0;
let vidas = 3;
let fase = 1;
let recorde = 0;
let blocos = [];
let teclas = {};
let ultimoTempo = 0;

try {
  recorde = Number(localStorage.getItem("quebra-bugs-recorde")) || 0;
} catch (erro) {
  recorde = 0;
}

const plataforma = { x: 330, y: ALTURA - 30, w: 124, h: 14, vel: 8 };
const bola = { x: 400, y: 470, r: 7, vx: 2, vy: -4, presa: true };

function itemLegenda(cor, texto, especial) {
  const item = document.createElement("li");
  const marca = document.createElement("i");
  marca.className = especial ? "cor especial" : "cor";
  if (cor) marca.style.background = cor;
  item.appendChild(marca);
  item.appendChild(document.createTextNode(texto));
  return item;
}

function montarLegenda() {
  const lista = document.getElementById("legenda");
  for (let i = 0; i < AREAS.length; i++) {
    lista.appendChild(itemLegenda(AREAS[i].cor, AREAS[i].nome + " · 10 pts"));
  }
  lista.appendChild(itemLegenda("", "Especial ★ · 30 pts · 2 toques", true));
}

function criarBlocos() {
  blocos = [];
  const linhas = AREAS.length;
  const colunas = 3 + fase;
  const espaco = 18;
  const altura = 30;
  const margem = 28;
  const largura = Math.floor((LARGURA - margem * 2 - (colunas - 1) * espaco) / colunas);
  const total = colunas * largura + (colunas - 1) * espaco;
  const inicioX = (LARGURA - total) / 2;
  const inicioY = 16;

  for (let linha = 0; linha < linhas; linha++) {
    const area = AREAS[linha];
    for (let coluna = 0; coluna < colunas; coluna++) {
      const especial = (linha + coluna) % 4 === 0;
      blocos.push({
        x: inicioX + coluna * (largura + espaco),
        y: inicioY + linha * (altura + espaco),
        w: largura,
        h: altura,
        cor: area.cor,
        texto: area.itens[coluna],
        especial: especial,
        vida: especial ? 2 : 1,
        pontos: especial ? 30 : 10,
      });
    }
  }
}

function velocidadeDaFase() {
  return 4 + (fase - 1) * 0.9;
}

function prepararFase() {
  plataforma.w = 124 - (fase - 1) * 16;
  plataforma.x = (LARGURA - plataforma.w) / 2;
  bola.presa = true;
  bola.vx = velocidadeDaFase() * 0.45;
  bola.vy = -velocidadeDaFase();
}

function atualizarPainel() {
  pontosEl.textContent = pontos;
  vidasEl.textContent = "♥".repeat(Math.max(0, vidas)) + "♡".repeat(Math.max(0, 3 - vidas));
  faseEl.textContent = fase;
  if (pontos > recorde) {
    recorde = pontos;
    try {
      localStorage.setItem("quebra-bugs-recorde", String(recorde));
    } catch (erro) {
      recorde = pontos;
    }
  }
  recordeEl.textContent = recorde;
}

function mostrarTela(texto, botao) {
  mensagemEl.textContent = texto;
  botaoEl.textContent = botao;
  painelTela.classList.remove("oculta");
}

function esconderTela() {
  painelTela.classList.add("oculta");
}

function tocarMusica() {
  musica.currentTime = 0;
  musica.play().catch(function () {});
}

function comecar() {
  pontos = 0;
  vidas = 3;
  fase = 1;
  estado = "jogando";
  criarBlocos();
  prepararFase();
  avisoEl.textContent = MSG.jogo;
  esconderTela();
  atualizarPainel();
  tocarMusica();
}

function perderVida() {
  vidas--;
  atualizarPainel();
  if (vidas <= 0) {
    estado = "derrota";
    avisoEl.textContent = MSG.derrota;
    mostrarTela(MSG.derrota, "Tentar novamente");
    return;
  }
  bola.presa = true;
  bola.vy = -Math.abs(velocidadeDaFase());
  avisoEl.textContent = "Bola perdida! " + MSG.jogo;
}

function concluirFase() {
  pontos += 100;
  if (fase >= 3) {
    estado = "vitoria";
    atualizarPainel();
    avisoEl.textContent = MSG.vitoria;
    mostrarTela(MSG.vitoria, "Jogar de novo");
    return;
  }
  fase++;
  criarBlocos();
  prepararFase();
  atualizarPainel();
  avisoEl.textContent = "Fase concluída! +100 pontos. " + MSG.jogo;
}

function encosta(bloco) {
  const pertoX = Math.max(bloco.x, Math.min(bola.x, bloco.x + bloco.w));
  const pertoY = Math.max(bloco.y, Math.min(bola.y, bloco.y + bloco.h));
  const dx = bola.x - pertoX;
  const dy = bola.y - pertoY;
  return dx * dx + dy * dy <= bola.r * bola.r;
}

function rebater(bloco) {
  const dx = bola.x - (bloco.x + bloco.w / 2);
  const dy = bola.y - (bloco.y + bloco.h / 2);
  const sobreX = bloco.w / 2 + bola.r - Math.abs(dx);
  const sobreY = bloco.h / 2 + bola.r - Math.abs(dy);

  if (sobreX < sobreY) {
    bola.vx = Math.abs(bola.vx) * (dx < 0 ? -1 : 1);
    bola.x += dx < 0 ? -sobreX : sobreX;
  } else {
    bola.vy = Math.abs(bola.vy) * (dy < 0 ? -1 : 1);
    bola.y += dy < 0 ? -sobreY : sobreY;
  }
}

function atualizar(dt) {
  if (estado !== "jogando") return;

  if (teclas.ArrowLeft || teclas.KeyA) plataforma.x -= plataforma.vel * dt;
  if (teclas.ArrowRight || teclas.KeyD) plataforma.x += plataforma.vel * dt;
  plataforma.x = Math.max(0, Math.min(LARGURA - plataforma.w, plataforma.x));

  if (bola.presa) {
    bola.x = plataforma.x + plataforma.w / 2;
    bola.y = plataforma.y - bola.r - 2;
    return;
  }

  bola.x += bola.vx * dt;
  bola.y += bola.vy * dt;

  if (bola.x < bola.r) {
    bola.x = bola.r;
    bola.vx = Math.abs(bola.vx);
  }
  if (bola.x > LARGURA - bola.r) {
    bola.x = LARGURA - bola.r;
    bola.vx = -Math.abs(bola.vx);
  }
  if (bola.y < bola.r) {
    bola.y = bola.r;
    bola.vy = Math.abs(bola.vy);
  }
  if (bola.y - bola.r > ALTURA) {
    perderVida();
    return;
  }

  const base = bola.y + bola.r;
  const baseAntes = base - bola.vy * dt;
  const naPlataforma = bola.x + bola.r >= plataforma.x && bola.x - bola.r <= plataforma.x + plataforma.w;
  if (bola.vy > 0 && naPlataforma && baseAntes <= plataforma.y && base >= plataforma.y) {
    const centro = plataforma.x + plataforma.w / 2;
    const impacto = Math.max(-1, Math.min(1, (bola.x - centro) / (plataforma.w / 2)));
    const angulo = impacto * (Math.PI / 3);
    const rapidez = velocidadeDaFase();
    bola.vx = rapidez * Math.sin(angulo);
    bola.vy = -rapidez * Math.cos(angulo);
    bola.y = plataforma.y - bola.r - 1;
  }

  for (let i = blocos.length - 1; i >= 0; i--) {
    if (!encosta(blocos[i])) continue;
    rebater(blocos[i]);
    blocos[i].vida--;
    if (blocos[i].vida <= 0) {
      pontos += blocos[i].pontos;
      blocos.splice(i, 1);
      atualizarPainel();
    }
    break;
  }

  if (blocos.length === 0) concluirFase();
}

function desenharFundo() {
  ctx.fillStyle = "#070b16";
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  ctx.strokeStyle = "rgba(120, 160, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= LARGURA; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ALTURA);
    ctx.stroke();
  }
  for (let y = 0; y <= ALTURA; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(LARGURA, y);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255, 92, 122, 0.12)";
  ctx.fillRect(0, plataforma.y + plataforma.h, LARGURA, ALTURA);
}

function desenharBlocos() {
  ctx.font = "bold 13px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2;

  for (let i = 0; i < blocos.length; i++) {
    const bloco = blocos[i];
    ctx.globalAlpha = bloco.especial && bloco.vida === 1 ? 0.55 : 1;
    ctx.fillStyle = bloco.cor;
    ctx.beginPath();
    ctx.roundRect(bloco.x, bloco.y, bloco.w, bloco.h, 6);
    ctx.fill();
    ctx.strokeStyle = bloco.especial ? "#fff3bf" : "rgba(0, 0, 0, 0.28)";
    if (bloco.especial && bloco.vida === 1) ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#071018";
    const rotulo = bloco.especial ? "★ " + bloco.texto : bloco.texto;
    let tamanho = 13;
    ctx.font = "bold " + tamanho + "px Segoe UI, sans-serif";
    while (tamanho > 9 && ctx.measureText(rotulo).width > bloco.w - 12) {
      tamanho--;
      ctx.font = "bold " + tamanho + "px Segoe UI, sans-serif";
    }
    ctx.fillText(rotulo, bloco.x + bloco.w / 2, bloco.y + bloco.h / 2 + 1);
  }
}

function desenharPlataforma() {
  const gradiente = ctx.createLinearGradient(plataforma.x, 0, plataforma.x + plataforma.w, 0);
  gradiente.addColorStop(0, "#3ddc84");
  gradiente.addColorStop(1, "#7ef9ff");
  ctx.fillStyle = gradiente;
  ctx.beginPath();
  ctx.roundRect(plataforma.x, plataforma.y, plataforma.w, plataforma.h, 8);
  ctx.fill();
}

function desenharBola() {
  ctx.save();
  ctx.shadowColor = "#7ef9ff";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#f4fdff";
  ctx.beginPath();
  ctx.arc(bola.x, bola.y, bola.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function desenharDica() {
  if (estado !== "jogando" || !bola.presa) return;
  ctx.fillStyle = "#9fb4d4";
  ctx.font = "16px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Clique, toque ou espaço para lançar", LARGURA / 2, ALTURA - 78);
}

function desenhar() {
  desenharFundo();
  desenharBlocos();
  desenharPlataforma();
  desenharBola();
  desenharDica();
}

function loop(agora) {
  if (!ultimoTempo) ultimoTempo = agora;
  const dt = Math.min(2, (agora - ultimoTempo) / 16.67);
  ultimoTempo = agora;
  atualizar(dt);
  desenhar();
  requestAnimationFrame(loop);
}

function posicaoX(evento) {
  const retangulo = tela.getBoundingClientRect();
  return (evento.clientX - retangulo.left) * (LARGURA / retangulo.width);
}

document.addEventListener("keydown", (evento) => {
  teclas[evento.code] = true;
  if (evento.code === "ArrowLeft" || evento.code === "ArrowRight" || evento.code === "Space") {
    evento.preventDefault();
  }
  if (evento.code === "Space") {
    if (estado === "jogando") bola.presa = false;
    else comecar();
  }
});

document.addEventListener("keyup", (evento) => {
  teclas[evento.code] = false;
});

tela.addEventListener("pointermove", (evento) => {
  if (estado !== "jogando") return;
  plataforma.x = posicaoX(evento) - plataforma.w / 2;
  plataforma.x = Math.max(0, Math.min(LARGURA - plataforma.w, plataforma.x));
});

tela.addEventListener("pointerdown", (evento) => {
  evento.preventDefault();
  if (estado === "jogando") bola.presa = false;
});

botaoEl.addEventListener("click", comecar);
montarLegenda();
criarBlocos();
prepararFase();
mostrarTela(MSG.inicio, "Começar");
atualizarPainel();
requestAnimationFrame(loop);
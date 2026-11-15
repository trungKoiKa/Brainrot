// Vẽ node kiểu neuron bằng three.js (SPEC.md mục 5.7): nhân phát sáng, quầng sáng, khung lưới cho Dự án, nhãn chữ, bụi nền.

import * as THREE from "three";

let glowMap: THREE.Texture | null = null;

/**
 * Nhãn cụm cố định trên graph: chấm màu + tên (vẽ ra canvas rồi làm sprite, không cần thư viện chữ).
 * `hollow`: chấm rỗng cho Dự án, chấm đặc cho Lĩnh vực — cùng quy ước với chip chú thích, vì hai nhóm dùng chung 4 màu.
 */
export function makeLabel(text: string, dotColor: string, textColor: string, opacity = 1, hollow = false): THREE.Sprite {
  const ratio = 4;
  const fontSize = 15 * ratio;
  const font = `600 ${fontSize}px ${getComputedStyle(document.body).fontFamily}`;
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = font;
  const dot = fontSize * 0.32;
  const gap = fontSize * 0.8; // chừa chỗ cho nhân neuron nằm dưới chấm
  const width = Math.ceil(dot * 2 + gap + ctx.measureText(text).width + 4);
  const height = Math.ceil(fontSize * 1.4);
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.beginPath();
  if (hollow) {
    const line = dot * 0.45;
    ctx.strokeStyle = dotColor;
    ctx.lineWidth = line;
    ctx.arc(dot, height / 2, dot - line / 2, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = dotColor;
    ctx.arc(dot, height / 2, dot, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = textColor;
  ctx.fillText(text, dot * 2 + gap, height / 2);

  const texture = new THREE.CanvasTexture(ctx.canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // sizeAttenuation: false → chữ giữ cỡ cố định trên màn hình, không bé đi khi ở xa camera
  const sprite = new THREE.Sprite(
    // depthTest: false + renderOrder cao → nhãn luôn nằm trên, không bị quả cầu che
    new THREE.SpriteMaterial({ map: texture, transparent: true, opacity, depthWrite: false, depthTest: false, sizeAttenuation: false }),
  );
  sprite.renderOrder = 10;
  const screenHeight = 0.03; // tỉ lệ so với chiều cao khung graph (~20px chữ ở khung 650px)
  sprite.scale.set((width / height) * screenHeight, screenHeight, 1);
  sprite.center.set(dot / width, 0.5); // chấm màu nằm đúng vị trí node
  return sprite;
}

// ---------- Neuron: nhân cầu bóng có phát sáng + quầng sáng quanh nhân (SPEC.md mục 5.7) ----------

export const REL_SIZE = 5.5; // bán kính = REL_SIZE × căn bậc ba của "khối lượng" node, như cách thư viện tính quả cầu mặc định

const SPHERE = new THREE.SphereGeometry(1, 32, 24); // dùng chung, mỗi node chỉ đổi scale

const SHELL = new THREE.IcosahedronGeometry(1, 1); // khung lưới của nhân Dự án

/** Ảnh quầng sáng tròn mờ dần (trắng, tô màu bằng material.color) — tạo một lần, mọi node dùng chung. */
function glowTexture(): THREE.Texture {
  if (glowMap) return glowMap;
  const size = 128;
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.canvas.width = ctx.canvas.height = size;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.22, "rgba(255,255,255,0.55)");
  g.addColorStop(0.55, "rgba(255,255,255,0.14)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  glowMap = new THREE.CanvasTexture(ctx.canvas);
  return glowMap;
}

/**
 * Một neuron. `shell`: nhân Dự án vẽ rỗng (cầu trong + khung lưới) để phân biệt với Lĩnh vực (cầu đặc) khi trùng màu.
 * `glow`: độ mạnh quầng sáng (0 = không vẽ, dùng cho node đang bị làm mờ).
 */
export function makeNeuron(color: string, radius: number, { dark, glow, shell }: { dark: boolean; glow: number; shell: boolean }): THREE.Group {
  const group = new THREE.Group();
  const c = new THREE.Color(color);
  const core = new THREE.Mesh(
    SPHERE,
    new THREE.MeshStandardMaterial({
      color: c,
      emissive: c,
      emissiveIntensity: dark ? 0.6 : 0.12,
      roughness: 0.32,
      metalness: 0.15,
      transparent: shell,
      opacity: shell ? 0.28 : 1,
      depthWrite: !shell,
    }),
  );
  core.scale.setScalar(radius);
  group.add(core);
  if (shell) {
    const wire = new THREE.LineSegments(new THREE.WireframeGeometry(SHELL), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.9 }));
    wire.scale.setScalar(radius * 1.02);
    wire.raycast = () => {}; // bấm trúng nhân là đủ
    group.add(wire);
  }
  if (glow > 0) {
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture(),
        color: c,
        transparent: true,
        opacity: (dark ? 0.75 : 0.38) * glow,
        // Nền tối: cộng sáng (quầng chồng lên nhau sáng dần); nền sáng: cộng sáng sẽ thành trắng xoá nên trộn thường
        blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
      }),
    );
    halo.scale.setScalar(radius * 7);
    halo.raycast = () => {}; // quầng sáng không nhận chuột, chỉ nhân mới bấm được
    group.add(halo);
  }
  return group;
}

/** Lớp "bụi" mờ quanh graph: vài trăm chấm nhỏ cố định, cho cảm giác chiều sâu khi xoay. */
export function makeDust(color: string, dark: boolean): THREE.Points {
  const count = 420;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // điểm ngẫu nhiên trong vỏ cầu bán kính 260–700
    const r = 260 + Math.random() * 440;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color, size: 3.4, map: glowTexture(), transparent: true, opacity: dark ? 0.5 : 0.35, depthWrite: false, sizeAttenuation: true }),
  );
  points.raycast = () => {};
  return points;
}

/** Màu nhạt hơn của một màu (trộn về phía màu nền): việc vẽ nhạt hơn dự án của nó. */
export function soften(color: string, background: string, amount = 0.45): string {
  return `#${new THREE.Color(color).lerp(new THREE.Color(background), amount).getHexString()}`;
}

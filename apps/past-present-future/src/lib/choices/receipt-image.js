import { LOGO_SVG } from "./logo.js";

function dashLine(c, x1, x2, y, color) {
  c.save();
  c.strokeStyle = color;
  c.setLineDash([4, 4]);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x1, y + 0.5);
  c.lineTo(x2, y + 0.5);
  c.stroke();
  c.restore();
}

function drawLogo(c, cx, topY, h) {
  return new Promise((res) => {
    const svg = LOGO_SVG.replace(/currentColor/g, "#1c2a24");
    if (!svg) return res();
    const img = new Image();
    img.onload = () => {
      const w = (h * 63) / 85;
      c.drawImage(img, cx - w / 2, topY, w, h);
      res();
    };
    img.onerror = () => res();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

export async function receiptToBlob(ledger, debtTotal) {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {}
  }
  const W = 720,
    PAD = 56,
    rowH = 42;
  const srcs = [];
  ledger.forEach((e) => {
    if (e.src && srcs.indexOf(e.src) < 0) srcs.push(e.src);
  });
  const H =
    PAD +
    72 +
    34 +
    26 +
    30 +
    ledger.length * rowH +
    40 +
    30 +
    30 +
    26 +
    srcs.length * 30 +
    PAD;
  const S = 2,
    cvs = document.createElement("canvas");
  cvs.width = W * S;
  cvs.height = H * S;
  const c = cvs.getContext("2d");
  c.scale(S, S);
  const ink = "#1c2a24",
    green = "#2f7a33",
    red = "#c62f1f",
    soft = "rgba(28,42,36,.6)",
    ln = "rgba(28,42,36,.32)";
  c.fillStyle = "#efe7d1";
  c.fillRect(0, 0, W, H);
  let y = PAD;
  await drawLogo(c, W / 2, y, 50);
  y += 72;
  c.textAlign = "center";
  c.fillStyle = ink;
  c.font = '36px "Rhymes Display", Georgia, serif';
  c.fillText("Life’s Choices", W / 2, y);
  y += 30;
  c.font = '13px "Fira Code", monospace';
  c.fillStyle = soft;
  c.fillText("THE FULL ACCOUNT · AGE 18–45", W / 2, y);
  y += 26;
  dashLine(c, PAD, W - PAD, y, ln);
  y += 30;
  c.font = '20px "Fira Code", monospace';
  ledger.forEach((e) => {
    const fm = -(e.delta || 0);
    c.textAlign = "left";
    c.fillStyle = ink;
    c.fillText(e.age + (e.to ? "–" + e.to : "") + " · " + e.label, PAD, y);
    c.textAlign = "right";
    c.fillStyle = fm >= 0 ? green : red;
    c.fillText(
      (fm < 0 ? "−£" : "+£") + Math.abs(fm).toLocaleString("en-GB"),
      W - PAD,
      y,
    );
    y += rowH;
  });
  y += 4;
  c.setLineDash([]);
  c.strokeStyle = ln;
  c.beginPath();
  c.moveTo(PAD, y);
  c.lineTo(W - PAD, y);
  c.stroke();
  y += 34;
  c.font = '23px "Fira Code", monospace';
  c.textAlign = "left";
  c.fillStyle = ink;
  c.fillText("TOTAL DEBT", PAD, y);
  c.textAlign = "right";
  c.fillStyle = red;
  c.fillText("£" + debtTotal.toLocaleString("en-GB"), W - PAD, y);
  y += 30;
  dashLine(c, PAD, W - PAD, y, ln);
  y += 30;
  c.textAlign = "left";
  c.font = '12px "Fira Code", monospace';
  c.fillStyle = soft;
  c.fillText("SOURCES", PAD, y);
  y += 26;
  c.font = '15px "Fira Code", monospace';
  c.fillStyle = "rgba(28,42,36,.78)";
  srcs.forEach((s) => {
    c.fillText(s, PAD, y);
    y += 30;
  });
  return await new Promise((res) => cvs.toBlob(res, "image/png"));
}

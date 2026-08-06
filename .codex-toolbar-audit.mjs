import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = join(tmpdir(), `ito-toolbar-audit-${Date.now()}`);
const activePortFile = join(profile, "DevToolsActivePort");
const browser = spawn(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
for (let attempt = 0; attempt < 100 && !existsSync(activePortFile); attempt += 1) {
  await wait(50);
}

if (!existsSync(activePortFile)) {
  browser.kill();
  throw new Error("Chrome did not expose a DevTools port.");
}

const [port] = readFileSync(activePortFile, "utf8").trim().split(/\r?\n/);
const tabs = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
const page = tabs.find((tab) => tab.type === "page");
if (!page) {
  browser.kill();
  throw new Error("Chrome did not create a page target.");
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 375,
  height: 667,
  deviceScaleFactor: 1,
  mobile: true,
});
await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
await wait(1000);

const auth = {
  state: {
    user: { id: "visual-audit", name: "Estudiante", email: "", role: "student" },
    isAuthenticated: true,
    hasCompletedOnboarding: true,
    sessionStartedAt: Date.now(),
  },
  version: 1,
};
await send("Runtime.evaluate", {
  expression: `localStorage.setItem("ito-auth-storage", ${JSON.stringify(JSON.stringify(auth))})`,
});
await send("Page.navigate", { url: "http://127.0.0.1:5173/student" });
await wait(5000);

const viewports = [
  [320, 568],
  [375, 667],
  [414, 896],
  [768, 1024],
];

for (const [width, height] of viewports) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await wait(500);
  const audit = await send("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const toolbar = document.querySelector('.student-mobile .ito-toolbar--mobile-compact');
      if (!toolbar) return { width: innerWidth, found: false, path: location.pathname };
      const group = toolbar.querySelector('.ito-toolbar__group');
      const buttons = [...toolbar.querySelectorAll('.ito-toolbar__btn')];
      const rects = buttons.map((button) => {
        const rect = button.getBoundingClientRect();
        const style = getComputedStyle(button);
        return {
          label: button.getAttribute('aria-label'),
          x: Math.round(rect.x), y: Math.round(rect.y),
          width: Math.round(rect.width), height: Math.round(rect.height),
          radius: style.borderRadius,
          border: style.borderTopWidth,
          shadow: style.boxShadow !== 'none',
        };
      });
      const overlaps = [];
      for (let i = 0; i < rects.length; i += 1) {
        for (let j = i + 1; j < rects.length; j += 1) {
          const a = rects[i]; const b = rects[j];
          if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) {
            overlaps.push([a.label, b.label]);
          }
        }
      }
      const toolbarStyle = getComputedStyle(toolbar);
      const groupStyle = group ? getComputedStyle(group) : null;
      return {
        width: innerWidth,
        found: true,
        bodyOverflow: document.documentElement.scrollWidth > innerWidth,
        toolbar: {
          background: toolbarStyle.backgroundColor,
          border: toolbarStyle.borderTopWidth,
          shadow: toolbarStyle.boxShadow,
        },
        group: groupStyle ? {
          background: groupStyle.backgroundColor,
          border: groupStyle.borderTopWidth,
          shadow: groupStyle.boxShadow,
          gap: groupStyle.gap,
        } : null,
        buttons: rects,
        overlaps,
      };
    })()`,
  });
  console.log(JSON.stringify(audit.result.value));
  if (width === 375) {
    const screenshot = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
    const path = join(tmpdir(), "ito-toolbar-individual-375-final.png");
    writeFileSync(path, Buffer.from(screenshot.data, "base64"));
    console.log(`SCREENSHOT=${path}`);
  }
}

socket.close();
browser.kill();

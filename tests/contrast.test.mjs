import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const css = readFileSync(path.join(root, "src/styles/custom.css"), "utf8");

function block(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `${selector} block is missing`);
  return match[1];
}

function cssVar(scope, name) {
  const match = scope.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `${name} is missing`);
  return match[1];
}

function hexToRgb(hex) {
  const value = hex.slice(1);
  return [
    Number.parseInt(value.slice(0, 2), 16) / 255,
    Number.parseInt(value.slice(2, 4), 16) / 255,
    Number.parseInt(value.slice(4, 6), 16) / 255
  ];
}

function linearize(channel) {
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground, background) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

test("light theme tokens keep primary and secondary text readable", () => {
  const light = block(":root[data-theme='light']");
  const pageBackground = cssVar(light, "--sl-color-black");

  assert.ok(
    contrastRatio(cssVar(light, "--sl-color-gray-1"), pageBackground) >= 7,
    "--sl-color-gray-1 must be high-contrast text on the light page background"
  );

  assert.ok(
    contrastRatio(cssVar(light, "--sl-color-gray-2"), pageBackground) >= 7,
    "--sl-color-gray-2 must be high-contrast text on the light page background"
  );

  assert.ok(
    contrastRatio(cssVar(light, "--sl-color-gray-3"), pageBackground) >= 4.5,
    "--sl-color-gray-3 must remain readable as light secondary text"
  );
});

test("dark theme tokens keep primary and secondary text readable", () => {
  const dark = block(":root");
  const pageBackground = cssVar(dark, "--sl-color-black");

  assert.ok(
    contrastRatio(cssVar(dark, "--sl-color-gray-1"), pageBackground) >= 7,
    "--sl-color-gray-1 must be high-contrast text on the dark page background"
  );

  assert.ok(
    contrastRatio(cssVar(dark, "--sl-color-gray-2"), pageBackground) >= 7,
    "--sl-color-gray-2 must be high-contrast text on the dark page background"
  );

  assert.ok(
    contrastRatio(cssVar(dark, "--sl-color-gray-3"), pageBackground) >= 4.5,
    "--sl-color-gray-3 must remain readable as dark secondary text"
  );
});

test("accent text stays readable on accent panels in both color themes", () => {
  const dark = block(":root");
  const light = block(":root[data-theme='light']");

  assert.ok(
    contrastRatio(cssVar(dark, "--sl-color-accent-high"), cssVar(dark, "--sl-color-accent-low")) >= 7,
    "dark accent-high must be readable on accent-low backgrounds"
  );

  assert.ok(
    contrastRatio(cssVar(light, "--sl-color-accent-high"), cssVar(light, "--sl-color-accent-low")) >= 7,
    "light accent-high must be readable on accent-low backgrounds"
  );
});

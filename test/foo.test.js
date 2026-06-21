/**
 * @jest-environment jsdom
 */
/* eslint-disable no-undef */

const loadLayer = () => {
  jest.resetModules();
  return require("../dist/index.cjs");
};

const queryLayer = (index) => document.querySelector(`.layer-esm[data-index="${index}"]`);

beforeEach(() => {
  document.documentElement.innerHTML = "<head></head><body></body>";
  jest.useRealTimers();
});

test("open renders a dialog and close removes it", () => {
  jest.useFakeTimers();
  const { open, close } = loadLayer();

  const index = open({
    content: "<strong>Hello</strong>",
    title: "Greeting",
    btn: [ "OK" ],
  });

  const layer = queryLayer(index);
  expect(layer).not.toBeNull();
  expect(layer.textContent).toContain("Greeting");
  expect(layer.textContent).toContain("Hello");

  close(index);
  jest.advanceTimersByTime(250);
  expect(queryLayer(index)).toBeNull();
});

test("confirm triggers callbacks for both buttons", () => {
  const { confirm } = loadLayer();
  const yes = jest.fn();
  const no = jest.fn();

  const index = confirm("Continue?", {}, yes, no);
  const buttons = document.querySelectorAll(`.layer-esm[data-index="${index}"] .layer-esm__button`);

  buttons[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(yes).toHaveBeenCalledTimes(1);

  buttons[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(no).toHaveBeenCalledTimes(1);
});

test("msg auto closes after its timeout", () => {
  jest.useFakeTimers();
  const { msg } = loadLayer();

  const index = msg("Saved");
  expect(queryLayer(index)).not.toBeNull();

  jest.advanceTimersByTime(3200);
  expect(queryLayer(index)).toBeNull();
});

test("load injects styles once and renders CSS spinner", () => {
  const { load, close } = loadLayer();

  const first = load(1, { content: "Loading" });
  const second = load(2, { content: "Still loading" });

  expect(document.querySelectorAll("style#layer-esm-style")).toHaveLength(1);
  expect(document.querySelector(`.layer-esm[data-index="${first}"] .layer-esm__spinner--1`)).not.toBeNull();
  expect(document.querySelector(`.layer-esm[data-index="${second}"] .layer-esm__spinner--2`)).not.toBeNull();

  close(first);
  close(second);
});

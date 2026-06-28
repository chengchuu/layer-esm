import { PREFIX } from "../utils/dom";

export const layerTheme = `
.${PREFIX}-shade {
  position: fixed;
  inset: 0;
}

.${PREFIX} {
  position: fixed;
  left: 50%;
  top: 50%;
  z-index: 19891015;
  display: flex;
  flex-direction: column;
  min-width: 260px;
  max-width: min(90vw, 640px);
  max-height: min(85vh, 720px);
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
  color: #1f2937;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.${PREFIX},
.${PREFIX} * {
  box-sizing: border-box;
}

.${PREFIX}--page {
  min-width: 320px;
}

.${PREFIX}--loading,
.${PREFIX}--tips {
  min-width: auto;
  border: none;
  box-shadow: none;
  background: transparent;
}

.${PREFIX}--message {
  min-width: 160px;
  max-width: min(70vw, 420px);
  border: none;
  background: rgba(15, 23, 42, 0.88);
  color: #fff;
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.35);
}

.${PREFIX}--message .${PREFIX}__content {
  padding: 14px 20px;
  text-align: center;
}

.${PREFIX}--message .${PREFIX}__dialog {
  min-width: auto;
}

.${PREFIX}--message .${PREFIX}__dialog-content {
  justify-content: center;
  align-items: center;
}

.${PREFIX}--message .${PREFIX}__button:hover {
  background: #fff;
}

.${PREFIX}--message .${PREFIX}__button.${PREFIX}__button--primary:hover {
  background: #1d4ed8;
}

.${PREFIX}__title {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 0 56px 0 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: #111827;
}

.${PREFIX}__toolbar {
  position: absolute;
  right: 14px;
  top: 14px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.${PREFIX}__toolbar-button {
  position: relative;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

.${PREFIX}__toolbar-button:hover {
  background: rgba(15, 23, 42, 0.06);
  color: #0f172a;
}

.${PREFIX}__toolbar-button::before,
.${PREFIX}__toolbar-button::after {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
}

.${PREFIX}__toolbar-button--close::before,
.${PREFIX}__toolbar-button--close::after {
  width: 12px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.${PREFIX}__toolbar-button--close::before {
  transform: rotate(45deg);
}

.${PREFIX}__toolbar-button--close::after {
  transform: rotate(-45deg);
}

.${PREFIX}__toolbar-button--min::before {
  width: 12px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.${PREFIX}__toolbar-button--max::before {
  width: 12px;
  height: 10px;
  border: 2px solid currentColor;
  border-radius: 2px;
}

.${PREFIX}__content {
  position: relative;
  flex: 1 1 auto;
  overflow: auto;
  padding: 20px;
  font-size: 14px;
  line-height: 1.7;
  color: inherit;
}

.${PREFIX}__buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 0 16px 16px;
}

.${PREFIX}__buttons--l {
  justify-content: flex-start;
}

.${PREFIX}__buttons--c {
  justify-content: center;
}

.${PREFIX}__button {
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 8px;
  background: #fff;
  padding: 8px 16px;
  color: #111827;
  font-size: 14px;
  line-height: 1.2;
  cursor: pointer;
}

.${PREFIX}__button:hover {
  background: rgba(15, 23, 42, 0.04);
}

.${PREFIX}__button--primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.${PREFIX}__button--primary:hover {
  background: #1d4ed8;
}

.${PREFIX}__dialog {
  min-width: 300px;
}

.${PREFIX}__dialog-content {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.${PREFIX}__icon {
  position: relative;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border-radius: 999px;
}

.${PREFIX}__icon::before {
  content: attr(data-icon);
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
}

.${PREFIX}__icon--0,
.${PREFIX}__icon--1 {
  background: #2563eb;
}

.${PREFIX}__icon--2 {
  background: #f59e0b;
}

.${PREFIX}__icon--3 {
  background: #22c55e;
}

.${PREFIX}__icon--4,
.${PREFIX}__icon--5 {
  background: #ef4444;
}

.${PREFIX}__icon--6 {
  background: #8b5cf6;
}

.${PREFIX}__loading-shell {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.84);
  color: #fff;
}

.${PREFIX}__spinner {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 3px solid rgba(255, 255, 255, 0.28);
  border-top-color: #fff;
  animation: ${PREFIX}-spin .8s linear infinite;
}

.${PREFIX}__spinner--1 {
  border-color: transparent;
  background:
    conic-gradient(from 180deg, rgba(255, 255, 255, 0.18), #fff);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0);
  mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0);
}

.${PREFIX}__spinner--2 {
  border: none;
  background: none;
}

.${PREFIX}__spinner--2::before,
.${PREFIX}__spinner--2::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 3px solid transparent;
}

.${PREFIX}__spinner--2::before {
  border-top-color: #fff;
  animation: ${PREFIX}-spin .7s linear infinite;
}

.${PREFIX}__spinner--2::after {
  inset: 6px;
  border-bottom-color: rgba(255, 255, 255, 0.85);
  animation: ${PREFIX}-spin 1s linear infinite reverse;
}

.${PREFIX}__iframe {
  width: 100%;
  min-height: 320px;
  border: none;
  display: block;
}

.${PREFIX}__tips {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 8px 14px;
  border-radius: 10px;
  background: #111827;
  color: #fff;
  font-size: 12px;
  line-height: 1.6;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.22);
}

.${PREFIX}__tip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border: 8px solid transparent;
}

.${PREFIX}__tip-arrow--1 {
  left: 20px;
  bottom: -16px;
  border-top-color: #111827;
}

.${PREFIX}__tip-arrow--2 {
  left: -16px;
  top: 50%;
  margin-top: -8px;
  border-right-color: #111827;
}

.${PREFIX}__tip-arrow--3 {
  left: 20px;
  top: -16px;
  border-bottom-color: #111827;
}

.${PREFIX}__tip-arrow--4 {
  right: -16px;
  top: 50%;
  margin-top: -8px;
  border-left-color: #111827;
}

.${PREFIX}__input,
.${PREFIX}__textarea {
  display: block;
  width: min(100%, 320px);
  padding: 10px 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 8px;
  color: #111827;
  font: inherit;
  outline: none;
}

.${PREFIX}__textarea {
  min-height: 120px;
  resize: vertical;
}

.${PREFIX}__input:focus,
.${PREFIX}__textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
}

.${PREFIX}__tab-header {
  display: flex;
  gap: 2px;
  margin: -20px -20px 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(15, 23, 42, 0.02);
}

.${PREFIX}__tab-trigger {
  border: none;
  background: transparent;
  padding: 14px 18px;
  color: #475569;
  font: inherit;
  cursor: pointer;
}

.${PREFIX}__tab-trigger--active {
  background: #fff;
  color: #111827;
  box-shadow: inset 0 -2px 0 #2563eb;
}

.${PREFIX}__tab-panel {
  display: none;
}

.${PREFIX}__tab-panel--active {
  display: block;
}

.${PREFIX}__resize-handle {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 14px;
  height: 14px;
  cursor: se-resize;
  opacity: 0;
  background:
    linear-gradient(135deg, transparent 0 46%, rgba(100, 116, 139, 0.55) 46% 54%, transparent 54% 100%),
    linear-gradient(135deg, transparent 0 66%, rgba(100, 116, 139, 0.55) 66% 74%, transparent 74% 100%);
}

.${PREFIX}--anim-0 {
  animation: ${PREFIX}-scale-in .22s ease-out;
}

.${PREFIX}--anim-1 {
  animation: ${PREFIX}-drop-in .24s ease-out;
}

.${PREFIX}--anim-2 {
  animation: ${PREFIX}-rise-in .24s ease-out;
}

.${PREFIX}--anim-3 {
  animation: ${PREFIX}-slide-in-left .24s ease-out;
}

.${PREFIX}--anim-4 {
  animation: ${PREFIX}-roll-in .26s ease-out;
}

.${PREFIX}--anim-5 {
  animation: ${PREFIX}-fade-in .2s ease-out;
}

.${PREFIX}--anim-6 {
  animation: ${PREFIX}-shake-in .24s ease-out;
}

.${PREFIX}--closing {
  animation: ${PREFIX}-scale-out .18s ease-in forwards;
}

@keyframes ${PREFIX}-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes ${PREFIX}-scale-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(.88);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes ${PREFIX}-drop-in {
  from {
    opacity: 0;
    transform: translate(-50%, calc(-50% - 24px)) scale(.92);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes ${PREFIX}-rise-in {
  from {
    opacity: 0;
    transform: translate(-50%, calc(-50% + 24px));
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

@keyframes ${PREFIX}-slide-in-left {
  from {
    opacity: 0;
    transform: translate(calc(-50% - 28px), -50%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

@keyframes ${PREFIX}-roll-in {
  from {
    opacity: 0;
    transform: translate(calc(-50% - 28px), -50%) rotate(-10deg);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(0deg);
  }
}

@keyframes ${PREFIX}-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes ${PREFIX}-shake-in {
  0%,
  100% {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
  25% {
    transform: translate(calc(-50% - 6px), -50%);
  }
  75% {
    transform: translate(calc(-50% + 6px), -50%);
  }
}

@keyframes ${PREFIX}-scale-out {
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(.92);
  }
}
`;

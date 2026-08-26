import { useLayoutEffect, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import { StyleSheetManager, ThemeProvider } from "styled-components";
import type { LayerStore } from "../../store/layer-store";
import type { LayerInstance } from "../../store/types";
import type { LayerTheme } from "../../styles/theme";
import { resolveLayerIcon, type LayerIconDescriptor } from "../../icons";
import { applyOffset, applyTipsPlacement } from "../../utils/position";
import {
  Button,
  Buttons,
  Content,
  DialogContent,
  Header,
  Icon,
  Input,
  LoadingShell,
  PromptField,
  ResizeHandle,
  Shade,
  Shell,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  Textarea,
  TipArrow,
  TipBubble,
  Toolbar,
  ToolbarButton,
} from "./LayerHost.styles";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const BootstrapIcon = ({ descriptor }: { descriptor: LayerIconDescriptor }) => (
  <svg
    width="1em"
    height="1em"
    viewBox={descriptor.definition.viewBox}
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    data-bootstrap-icon={descriptor.definition.bootstrapName}
  >
    {descriptor.definition.paths.map((path, index) => (
      <path
        key={`${descriptor.definition.bootstrapName}-${index}`}
        d={path.d}
        fillRule={path.fillRule}
      />
    ))}
  </svg>
);

const focusableElements = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) =>
      !element.hidden && element.getAttribute("aria-hidden") !== "true"
  );

export interface HostActions {
  close(index: number): void;
  minimize(index: number): void;
  restore(index: number): void;
  full(index: number): void;
  setTop(index: number): void;
  setRefs(index: number, refs: Partial<LayerInstance>): void;
  selectTab(index: number, tabIndex: number): void;
}

interface LayerHostProps {
  store: LayerStore;
  theme: LayerTheme;
  actions: HostActions;
  styleTarget: HTMLElement;
  styleNonce?: string;
}

const TrustedHtml = ({ html }: { html: string }) => (
  <div dangerouslySetInnerHTML={{ __html: html }} />
);

const ExternalContent = ({ record }: { record: LayerInstance }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = record.options.content;
    const mount = mountRef.current;
    const view =
      node && typeof node !== "string" && !Array.isArray(node)
        ? node.ownerDocument.defaultView
        : null;
    if (!view || !(node instanceof view.HTMLElement) || !mount) return;
    mount.appendChild(node);
  }, [record]);
  return <div ref={mountRef} />;
};

const useGesture = (
  record: LayerInstance,
  actions: HostActions,
  headerRef: React.RefObject<HTMLDivElement | null>,
  resizeRef: React.RefObject<HTMLSpanElement | null>
) => {
  useLayoutEffect(() => {
    const root = record.root;
    const doc = root?.ownerDocument;
    if (!root || !doc) return;
    const cleanups: Array<() => void> = [];
    const bind = (handle: HTMLElement | null, resize: boolean) => {
      if (!handle) return;
      const down = (event: MouseEvent) => {
        if (event.button !== 0) return;
        event.preventDefault();
        actions.setTop(record.index);
        const rect = root.getBoundingClientRect();
        const originX = event.clientX;
        const originY = event.clientY;
        if (resize) {
          const view = doc.defaultView;
          const fixed = root.style.position === "fixed";
          root.style.left = `${rect.left + (fixed ? 0 : view?.scrollX ?? 0)}px`;
          root.style.top = `${rect.top + (fixed ? 0 : view?.scrollY ?? 0)}px`;
          root.style.right = "";
          root.style.bottom = "";
          root.style.transform = "";
        }
        const move = (next: MouseEvent) => {
          if (resize) {
            root.style.width = `${Math.max(
              240,
              rect.width + next.clientX - originX
            )}px`;
            root.style.height = `${Math.max(
              120,
              rect.height + next.clientY - originY
            )}px`;
          } else {
            root.style.transform = "";
            root.style.left = `${rect.left + next.clientX - originX}px`;
            root.style.top = `${rect.top + next.clientY - originY}px`;
            root.style.right = "";
            root.style.bottom = "";
          }
        };
        const up = () => {
          doc.removeEventListener("mousemove", move);
          doc.removeEventListener("mouseup", up);
        };
        doc.addEventListener("mousemove", move);
        doc.addEventListener("mouseup", up);
        cleanups.push(up);
      };
      handle.addEventListener("mousedown", down);
      cleanups.push(() => handle.removeEventListener("mousedown", down));
    };
    let moveHandle: HTMLElement | null = headerRef.current;
    if (typeof record.options.move === "string") {
      try {
        moveHandle = root.querySelector<HTMLElement>(record.options.move);
      } catch {
        moveHandle = null;
      }
      if (!moveHandle && /^[A-Za-z_][\w-]*$/.test(record.options.move)) {
        moveHandle =
          (root.getElementsByClassName(record.options.move)[0] as
            | HTMLElement
            | undefined) ?? null;
      }
    }
    if (record.options.move) bind(moveHandle, false);
    if (record.options.resize) bind(resizeRef.current, true);
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [
    actions,
    headerRef,
    record,
    record.lifecycle,
    record.windowState,
    resizeRef,
  ]);
};

const LayerView = ({
  record,
  actions,
  topmost,
}: {
  record: LayerInstance;
  actions: HostActions;
  topmost: boolean;
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const resizeRef = useRef<HTMLSpanElement>(null);
  const options = record.options;
  const [tipDirection, setTipDirection] = useState(options.tips[0]);
  const rootId = options.id || `layui-layer${record.index}`;
  const titleId = `${rootId}-title`;
  const descriptionId = `${rootId}-content`;
  const closing = record.lifecycle === "closing";
  const statusLike =
    (record.typeName === "message" && !options.btn) ||
    record.typeName === "loading" ||
    (record.typeName === "dialog" && options.title === false && !options.btn);
  const interactive = !statusLike && record.typeName !== "tips";
  const iconDescriptor = resolveLayerIcon(options.icon);

  const renderIcon = (compact: boolean) =>
    iconDescriptor ? (
      <Icon
        className={`layer-esm__icon layer-esm__icon--${options.icon}`}
        $compact={compact}
        $icon={iconDescriptor.numericValue}
        data-icon={iconDescriptor.definition.bootstrapName}
        aria-hidden="true"
      >
        <BootstrapIcon descriptor={iconDescriptor} />
      </Icon>
    ) : null;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    actions.setRefs(record.index, {
      root,
      content: contentRef.current,
      title: titleRef.current,
      buttons: buttonsRef.current,
      iframe: iframeRef.current,
      input: inputRef.current,
    });
    if (titleRef.current && options.title && options.title.style) {
      titleRef.current.style.cssText += options.title.style;
    }
    applyOffset(root, options.offset, options.fixed);
    if (record.typeName === "tips" && record.followTarget) {
      const actualDirection = applyTipsPlacement(
        root,
        record.followTarget,
        options.tips[0],
        options.fixed
      );
      setTipDirection(actualDirection);
    }
  }, [
    actions,
    options.fixed,
    options.offset,
    options.tips,
    record.followTarget,
    record.index,
    record.typeName,
  ]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const view = root?.ownerDocument.defaultView;
    if (!root || !view || record.typeName !== "tips" || !record.followTarget)
      return;
    const relocate = () => {
      const actualDirection = applyTipsPlacement(
        root,
        record.followTarget!,
        options.tips[0],
        options.fixed
      );
      setTipDirection(actualDirection);
    };
    view.addEventListener("resize", relocate);
    view.addEventListener("scroll", relocate, { passive: true });
    return () => {
      view.removeEventListener("resize", relocate);
      view.removeEventListener("scroll", relocate);
    };
  }, [options.fixed, options.tips, record.followTarget, record.typeName]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const doc = root?.ownerDocument;
    if (
      !root ||
      !doc ||
      !interactive ||
      !topmost ||
      record.windowState === "minimized"
    )
      return;
    const focusables = focusableElements(root);
    (focusables[0] ?? root).focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const result = options.cancel?.(record.index, root);
        if (result !== false) {
          event.preventDefault();
          actions.close(record.index);
        }
        return;
      }
      if (event.key !== "Tab") return;
      const current = focusableElements(root);
      if (!current.length) {
        event.preventDefault();
        root.focus();
        return;
      }
      const first = current[0];
      const last = current[current.length - 1];
      if (
        event.shiftKey &&
        (doc.activeElement === first || !root.contains(doc.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (doc.activeElement === last || !root.contains(doc.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    doc.addEventListener("keydown", onKeyDown);
    return () => doc.removeEventListener("keydown", onKeyDown);
  }, [
    actions,
    interactive,
    options,
    record.index,
    record.windowState,
    topmost,
  ]);

  useGesture(record, actions, titleRef, resizeRef);

  const closeFromToolbar = () => {
    const root = rootRef.current;
    if (!root) return;
    const result = options.cancel?.(record.index, root);
    if (result !== false) actions.close(record.index);
  };
  const clickButton = (buttonIndex: number) => {
    const root = rootRef.current;
    if (!root) return;
    if (buttonIndex === 0) {
      if (options.yes) options.yes(record.index, root);
      else actions.close(record.index);
      return;
    }
    const result =
      buttonIndex === 1 ? options.btn2?.(record.index, root) : undefined;
    if (result !== false) actions.close(record.index);
  };

  const renderBody = () => {
    if (record.typeName === "loading") {
      return (
        <LoadingShell>
          {typeof options.icon === "number" ? (
            <Spinner
              $variant={Math.max(options.icon, 0)}
              aria-hidden="true"
              className={`layer-esm__spinner layer-esm__spinner--${Math.max(
                options.icon,
                0
              )}`}
            />
          ) : (
            renderIcon(true)
          )}
          {typeof options.content === "string" && options.content ? (
            <span>{options.content}</span>
          ) : null}
        </LoadingShell>
      );
    }
    if (record.typeName === "tips") {
      const color = options.tipsColorExplicit ? options.tips[1] : undefined;
      return (
        <>
          <TipBubble $color={color}>
            <TrustedHtml html={String(options.content ?? "")} />
          </TipBubble>
          <TipArrow
            className={`layer-esm__tip-arrow layer-esm__tip-arrow--${tipDirection}`}
            $direction={tipDirection}
            $color={color}
            aria-hidden="true"
          />
        </>
      );
    }
    if (options.tab) {
      const active = record.activeTab;
      const select = (index: number) => actions.selectTab(record.index, index);
      const onTabKey = (
        event: React.KeyboardEvent<HTMLButtonElement>,
        index: number
      ) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        event.preventDefault();
        const last = options.tab!.length - 1;
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
            ? last
            : event.key === "ArrowRight"
            ? (index + 1) % (last + 1)
            : (index - 1 + last + 1) % (last + 1);
        select(next);
        const triggers =
          rootRef.current?.querySelectorAll<HTMLElement>("[role=tab]");
        triggers?.[next]?.focus();
      };
      return (
        <>
          <TabList>
            {options.tab.map((item, index) => (
              <Tab
                key={index}
                id={`layer-esm-tab-${record.index}-${index}`}
                aria-controls={`layer-esm-panel-${record.index}-${index}`}
                aria-selected={active === index}
                tabIndex={active === index ? 0 : -1}
                $active={active === index}
                className={
                  active === index
                    ? "layer-esm__tab-trigger layer-esm__tab-trigger--active layui-this"
                    : undefined
                }
                onClick={() => select(index)}
                onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) =>
                  onTabKey(event, index)
                }
              >
                {item.title}
              </Tab>
            ))}
          </TabList>
          <TabPanel
            id={`layer-esm-panel-${record.index}-${active}`}
            aria-labelledby={`layer-esm-tab-${record.index}-${active}`}
          >
            <TrustedHtml html={options.tab[active]?.content || "no content"} />
          </TabPanel>
        </>
      );
    }
    if (
      record.input !== undefined &&
      options.skin.includes("layui-layer-prompt")
    ) {
      const label =
        options.ariaLabel || (options.title && options.title.text) || "Input";
      return (
        <PromptField>
          <span className="layer-esm__sr-only">{label}</span>
          {options.formType === 2 ? (
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              defaultValue={options.value}
              aria-label={label}
            />
          ) : (
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={options.formType === 1 ? "password" : "text"}
              defaultValue={options.value}
              aria-label={label}
            />
          )}
        </PromptField>
      );
    }
    if (options.type === 2 && Array.isArray(options.content)) {
      const frameName = `layui-layer-iframe${record.index}`;
      return (
        <iframe
          ref={iframeRef}
          className="layer-esm__iframe"
          id={frameName}
          title={
            options.title && options.title.text
              ? options.title.text
              : "Embedded content"
          }
          name={frameName}
          scrolling={options.content[1] ?? "auto"}
          src={options.content[0]}
        />
      );
    }
    if (typeof options.content !== "string")
      return <ExternalContent record={record} />;
    const body = <TrustedHtml html={options.content} />;
    if (iconDescriptor)
      return (
        <DialogContent $compact={record.typeName === "message"}>
          {renderIcon(record.typeName === "message")}
          {body}
        </DialogContent>
      );
    return body;
  };

  const rootStyle: React.CSSProperties = {
    position: options.fixed ? "fixed" : "absolute",
    width: options.area[0],
    height: options.area[1],
    maxWidth:
      options.area[0] && !options.maxWidthExplicit
        ? "calc(100vw - 2rem)"
        : `min(calc(100vw - 2rem), ${options.maxWidth}px)`,
    zIndex: record.zIndex,
    ...record.style,
  };
  const role = statusLike
    ? "status"
    : record.typeName === "tips"
    ? "tooltip"
    : "dialog";
  const publicTypeName =
    record.typeName === "message" ? "dialog" : record.typeName;

  return (
    <>
      {options.shade && record.windowState !== "minimized" ? (
        <Shade
          $color={
            options.shadeStyle || options.shadeColorExplicit
              ? options.shadeStyle || options.shade.color
              : undefined
          }
          $opacity={options.shade.opacity}
          $closing={closing}
          style={{ zIndex: record.zIndex - 1 }}
          data-index={record.index}
          onClick={options.shadeClose ? closeFromToolbar : undefined}
        />
      ) : null}
      <Shell
        ref={rootRef}
        data-index={record.index}
        data-type={publicTypeName}
        id={rootId}
        className={[
          `layer-esm--${publicTypeName}`,
          record.typeName === "message" ? "layer-esm--message" : "",
          `layer-esm--anim-${options.anim}`,
          `layui-layer-${publicTypeName}`,
          options.skin,
          options.className,
          closing ? "layer-esm--closing" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        $closing={closing}
        $type={record.typeName}
        $anim={options.anim}
        style={rootStyle}
        role={role}
        aria-live={role === "status" ? "polite" : undefined}
        aria-modal={
          interactive && !!options.shade && record.windowState !== "minimized"
            ? "true"
            : undefined
        }
        aria-label={
          !options.title
            ? options.ariaLabel || (interactive ? "Dialog" : undefined)
            : undefined
        }
        aria-labelledby={options.title ? titleId : undefined}
        aria-describedby={interactive ? descriptionId : undefined}
        tabIndex={interactive ? -1 : undefined}
        onMouseDown={() => actions.setTop(record.index)}
      >
        {options.title &&
        record.typeName !== "message" &&
        record.typeName !== "loading" &&
        record.typeName !== "tips" ? (
          <Header ref={titleRef} id={titleId}>
            {options.title.text}
          </Header>
        ) : null}
        {options.title && (options.maxmin || options.closeBtn) ? (
          <Toolbar>
            {options.maxmin ? (
              <>
                <ToolbarButton
                  className="layer-esm__toolbar-button layer-esm__toolbar-button--min"
                  aria-label={
                    record.windowState === "minimized" ? "Restore" : "Minimize"
                  }
                  onClick={() =>
                    record.windowState === "minimized"
                      ? actions.restore(record.index)
                      : actions.minimize(record.index)
                  }
                >
                  −
                </ToolbarButton>
                <ToolbarButton
                  className="layer-esm__toolbar-button layer-esm__toolbar-button--max"
                  aria-label={
                    record.windowState === "full" ? "Restore" : "Maximize"
                  }
                  onClick={() =>
                    record.windowState === "full"
                      ? actions.restore(record.index)
                      : actions.full(record.index)
                  }
                >
                  □
                </ToolbarButton>
              </>
            ) : null}
            {options.closeBtn ? (
              <ToolbarButton
                className="layer-esm__toolbar-button layer-esm__toolbar-button--close"
                aria-label="Close"
                onClick={closeFromToolbar}
              >
                ×
              </ToolbarButton>
            ) : null}
          </Toolbar>
        ) : null}
        <Content
          ref={contentRef}
          id={descriptionId}
          style={{
            display: record.windowState === "minimized" ? "none" : undefined,
            padding:
              record.typeName === "loading" ||
              record.typeName === "tips" ||
              options.tab
                ? 0
                : undefined,
          }}
        >
          {renderBody()}
        </Content>
        {options.btn && record.windowState !== "minimized" ? (
          <Buttons
            ref={buttonsRef}
            $align={options.btnAlign}
            className={`layer-esm__buttons--${options.btnAlign} layui-layer-btn-${options.btnAlign}`}
          >
            {options.btn.map((label, index) => (
              <Button
                key={index}
                $primary={index === 0}
                className={`layui-layer-btn${index}${
                  index === 0 ? " layer-esm__button--primary" : ""
                }`}
                onClick={() => clickButton(index)}
              >
                {label}
              </Button>
            ))}
          </Buttons>
        ) : null}
        {options.resize && interactive && record.windowState === "normal" ? (
          <ResizeHandle ref={resizeRef} aria-hidden="true" />
        ) : null}
      </Shell>
    </>
  );
};

export const LayerHost = ({
  store,
  theme,
  actions,
  styleTarget,
  styleNonce,
}: LayerHostProps) => {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );
  const interactive = snapshot.instances.filter(
    (record) =>
      ((record.typeName === "message" && !!record.options.btn) ||
        (record.typeName !== "message" &&
          record.typeName !== "loading" &&
          record.typeName !== "tips" &&
          !(
            record.typeName === "dialog" &&
            record.options.title === false &&
            !record.options.btn
          ))) &&
      record.windowState !== "minimized" &&
      record.lifecycle !== "closing"
  );
  const topmost = interactive.reduce<LayerInstance | undefined>(
    (current, record) =>
      !current || record.zIndex > current.zIndex ? record : current,
    undefined
  );
  return (
    <StyleSheetManager target={styleTarget} nonce={styleNonce}>
      <ThemeProvider theme={theme}>
        {snapshot.instances
          .filter((record) => record.lifecycle !== "removed")
          .map((record) => (
            <LayerView
              key={record.index}
              record={record}
              actions={actions}
              topmost={record.index === topmost?.index}
            />
          ))}
      </ThemeProvider>
    </StyleSheetManager>
  );
};

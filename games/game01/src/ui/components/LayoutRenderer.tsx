/**
 * 공유 LayoutRenderer — CSS flex 기반
 * 레이아웃 JSON 값을 CSS 속성으로 직접 변환 (computeLayout 높이 계산 없음)
 * 어드민 프리뷰와 동일한 결과를 보장
 */
import type { LayoutElement, GroupElement, AnchorElement } from '../../game/layout-types';
import { DESIGN_W } from '../../game/layout-types';

const BASE = import.meta.env.BASE_URL || '/';

// 컴포넌트 고정 크기 (디자인 단위)
const COMPONENT_SIZES: Record<string, { w: number; h: number }> = {
  toggle: { w: 77, h: 44 },
  close: { w: 32, h: 32 },
  'circle-btn': { w: 80, h: 80 },
};

export interface LayoutRendererProps {
  elements: LayoutElement[];
  scale: number;
  screenW: number;
  screenH: number;
  screenPadding?: { top: number; right: number; bottom: number; left: number };
  groupVAlign?: 'center' | 'top';
  imageMap?: Record<string, string>;
  textOverrides?: Record<string, string>;
  clickHandlers?: Record<string, () => void>;
  toggleStates?: Record<string, boolean>;
  className?: string;
}

interface TreeNode {
  el: LayoutElement;
  children: TreeNode[];
}

/** elements를 parentId 기반 트리로 변환 */
function buildTree(elements: LayoutElement[]): { roots: TreeNode[]; anchors: TreeNode[] } {
  const visible = elements.filter((e) => e.visible !== false);
  const byId = new Map(visible.map((e) => [e.id, e]));
  const childrenOf = new Map<string, LayoutElement[]>();

  const roots: LayoutElement[] = [];
  const anchors: LayoutElement[] = [];

  for (const el of visible) {
    if (el.parentId && byId.has(el.parentId)) {
      const list = childrenOf.get(el.parentId) || [];
      list.push(el);
      childrenOf.set(el.parentId, list);
    } else if (el.positioning === 'anchor') {
      anchors.push(el);
    } else {
      roots.push(el);
    }
  }

  function makeNode(el: LayoutElement): TreeNode {
    const kids = childrenOf.get(el.id) || [];
    return { el, children: kids.map(makeNode) };
  }

  return {
    roots: roots.map(makeNode),
    anchors: anchors.map((el) => ({ el, children: [] })),
  };
}

/** 같은 order끼리 행(row) 그룹핑 */
function groupByOrder(nodes: TreeNode[]): { order: number; nodes: TreeNode[]; gapPx: number }[] {
  const groups = nodes.filter((n) => n.el.positioning === 'group');
  const rowMap = new Map<number, TreeNode[]>();
  for (const n of groups) {
    const order = (n.el as GroupElement).order;
    const list = rowMap.get(order) || [];
    list.push(n);
    rowMap.set(order, list);
  }
  return [...rowMap.keys()]
    .sort((a, b) => a - b)
    .map((order) => {
      const row = rowMap.get(order)!;
      return { order, nodes: row, gapPx: (row[0].el as GroupElement).gapPx };
    });
}

export function LayoutRenderer({
  elements, scale, screenW, screenH,
  screenPadding = { top: 0, right: 0, bottom: 0, left: 0 },
  groupVAlign = 'center',
  imageMap = {}, textOverrides = {}, clickHandlers = {}, toggleStates = {},
  className,
}: LayoutRendererProps) {
  const { roots, anchors } = buildTree(elements);
  const rows = groupByOrder(roots);
  const contentW = (DESIGN_W - screenPadding.left - screenPadding.right) * scale;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: screenW,
        height: screenH,
        overflow: 'hidden',
      }}
    >
      {/* 그룹 요소: flex column 중앙 정렬 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: groupVAlign === 'center' ? 'center' : 'flex-start',
        padding: `${screenPadding.top * scale}px ${screenPadding.right * scale}px ${screenPadding.bottom * scale}px ${screenPadding.left * scale}px`,
      }}>
        {rows.map((row, ri) => (
          <div
            key={row.order}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: (row.nodes[0]?.el as GroupElement).hGapPx !== undefined
                ? (row.nodes[0].el as GroupElement).hGapPx! * scale
                : 8 * scale,
              marginTop: ri > 0 ? row.gapPx * scale : 0,
              width: '100%',
            }}
          >
            {row.nodes.map((node) => (
              <ElementNode
                key={node.el.id}
                node={node}
                scale={scale}
                contentW={contentW}
                rowElCount={row.nodes.length}
                imageMap={imageMap}
                textOverrides={textOverrides}
                clickHandlers={clickHandlers}
                toggleStates={toggleStates}
              />
            ))}
          </div>
        ))}
      </div>

      {/* 앵커 요소: 절대 좌표 */}
      {anchors.map((node) => {
        const el = node.el as AnchorElement;
        const w = el.widthPx * scale;
        const ox = el.offsetX * scale;
        const oy = el.offsetY * scale;
        const hasClick = el.id in clickHandlers;
        const onClick = hasClick ? clickHandlers[el.id] : undefined;

        const posStyle: React.CSSProperties = { position: 'absolute', width: w };
        switch (el.anchor) {
          case 'top-left': posStyle.left = ox; posStyle.top = oy; break;
          case 'top-right': posStyle.right = ox; posStyle.top = oy; break;
          case 'bottom-left': posStyle.left = ox; posStyle.bottom = oy; break;
          case 'bottom-right': posStyle.right = ox; posStyle.bottom = oy; break;
        }

        return (
          <div
            key={el.id}
            style={{ ...posStyle, cursor: onClick ? 'pointer' : undefined }}
            onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
          >
            <RenderElement el={el} scale={scale} imageMap={imageMap} textOverrides={textOverrides} toggleStates={toggleStates} />
          </div>
        );
      })}
    </div>
  );
}

/** 단일 요소 노드 (컨테이너면 자식 포함) */
function ElementNode({
  node, scale, contentW, rowElCount,
  imageMap, textOverrides, clickHandlers, toggleStates,
}: {
  node: TreeNode; scale: number; contentW: number; rowElCount: number;
  imageMap: Record<string, string>; textOverrides: Record<string, string>;
  clickHandlers: Record<string, () => void>; toggleStates: Record<string, boolean>;
}) {
  const { el, children } = node;
  const isContainer = el.type === 'card' || el.type === 'modal';
  const hasClick = el.id in clickHandlers;
  const onClick = hasClick ? clickHandlers[el.id] : undefined;

  // 너비 결정
  const compSize = COMPONENT_SIZES[el.type];
  let width: string | number;
  if (compSize) {
    width = compSize.w * scale;
  } else if (el.widthMode === 'full') {
    width = rowElCount > 1 ? undefined as any : '100%'; // flex: 1 for multi
  } else {
    width = el.widthPx * scale;
  }

  const style: React.CSSProperties = {
    width,
    flex: el.widthMode === 'full' && rowElCount > 1 ? 1 : undefined,
    cursor: onClick ? 'pointer' : undefined,
  };

  // 컨테이너: 자식을 flex column으로 렌더링
  if (isContainer && children.length > 0) {
    const ip = el.innerPadding || { top: 16, right: 16, bottom: 16, left: 16 };
    const childRows = groupByOrder(children);

    return (
      <div
        style={style}
        onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      >
        <ContainerWrapper el={el} scale={scale}>
          <div style={{
            padding: `${ip.top * scale}px ${ip.right * scale}px ${ip.bottom * scale}px ${ip.left * scale}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {childRows.map((row, ri) => (
              <div
                key={row.order}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  gap: (row.nodes[0]?.el as GroupElement).hGapPx !== undefined
                    ? (row.nodes[0].el as GroupElement).hGapPx! * scale
                    : 8 * scale,
                  marginTop: ri > 0 ? row.gapPx * scale : 0,
                }}
              >
                {row.nodes.map((child) => (
                  <ElementNode
                    key={child.el.id}
                    node={child}
                    scale={scale}
                    contentW={contentW}
                    rowElCount={row.nodes.length}
                    imageMap={imageMap}
                    textOverrides={textOverrides}
                    clickHandlers={clickHandlers}
                    toggleStates={toggleStates}
                  />
                ))}
              </div>
            ))}
          </div>
        </ContainerWrapper>
      </div>
    );
  }

  return (
    <div
      style={style}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
    >
      <RenderElement el={el} scale={scale} imageMap={imageMap} textOverrides={textOverrides} toggleStates={toggleStates} inRow={rowElCount > 1} />
    </div>
  );
}

/** 컨테이너(modal/card) 배경 + X 버튼 래퍼 */
function ContainerWrapper({ el, scale, children }: { el: LayoutElement; scale: number; children: React.ReactNode }) {
  if (el.type === 'modal') {
    return (
      <div style={{ background: '#2a292e', borderRadius: 20 * scale, position: 'relative', overflow: 'hidden' }}>
        {/* X 버튼 */}
        <div style={{
          position: 'absolute', top: 10 * scale, right: 10 * scale, zIndex: 2,
          width: 28 * scale, height: 28 * scale, borderRadius: 999,
          background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: '#fff', fontSize: 14 * scale, fontWeight: 700, lineHeight: 1 }}>✕</span>
        </div>
        {children}
      </div>
    );
  }

  if (el.type === 'card') {
    return (
      <div style={{
        background: el.buttonStyle?.bgColor || '#1a1a1f',
        borderRadius: 16 * scale,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}

/** 개별 요소 렌더링 (리프 노드) */
function RenderElement({ el, scale, imageMap, textOverrides, toggleStates, inRow }: {
  el: LayoutElement; scale: number;
  imageMap: Record<string, string>; textOverrides: Record<string, string>;
  toggleStates: Record<string, boolean>;
  inRow?: boolean;
}) {
  if (el.type === 'text') {
    const ts = el.textStyle;
    const fontSize = (ts?.fontSizePx || 14) * scale;
    const color = ts?.color || '#fff';
    const gradient = ts?.gradientColors;
    const text = textOverrides[el.id] ?? el.label ?? el.id;

    return (
      <div style={{
        fontFamily: 'GMarketSans, sans-serif', fontWeight: 'bold',
        fontSize, color: gradient ? undefined : color,
        textAlign: inRow ? 'left' : 'center', whiteSpace: 'nowrap', lineHeight: 1.3,
        padding: `${4 * scale}px 0`,
        WebkitTextStroke: ts?.strokeWidth ? `${ts.strokeWidth * scale}px ${ts.strokeColor || '#000'}` : undefined,
        paintOrder: ts?.strokeWidth ? 'stroke fill' : undefined,
        ...(gradient ? {
          background: `linear-gradient(to bottom, ${gradient[0]}, ${gradient[1]})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        } : {}),
      }}>
        {text}
      </div>
    );
  }

  if (el.type === 'image') {
    const src = imageMap[el.id] ? `${BASE}${imageMap[el.id]}` : undefined;
    if (!src) return null;
    return <img src={src} alt={el.id} draggable={false} style={{ width: '100%', display: 'block', objectFit: 'contain' }} />;
  }

  if (el.type === 'button') {
    const bs = el.buttonStyle;
    const fontSize = (ts_fontSize(bs?.scaleKey) || 18) * scale;
    return (
      <div style={{
        background: bs?.bgColor || '#24282c',
        borderRadius: 12 * scale,
        padding: `${14 * scale}px ${20 * scale}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'GMarketSans, sans-serif', fontWeight: 'bold',
        fontSize, color: '#fff',
      }}>
        {textOverrides[el.id] ?? el.label ?? '버튼'}
      </div>
    );
  }

  if (el.type === 'toggle') {
    const on = toggleStates[el.id] ?? false;
    const w = 54 * scale;
    const h = 30 * scale;
    const knob = h - 4 * scale;
    return (
      <div style={{
        width: w, height: h, borderRadius: h / 2,
        background: on ? '#4ade80' : '#434750',
        position: 'relative', transition: 'background 0.2s',
        flexShrink: 0,
      }}>
        <div style={{
          width: knob, height: knob, borderRadius: knob / 2,
          background: on ? '#fff' : '#000',
          position: 'absolute', top: 2 * scale,
          left: on ? w - knob - 2 * scale : 2 * scale,
          transition: 'left 0.2s',
        }} />
      </div>
    );
  }

  if (el.type === 'close') {
    const s = 32 * scale;
    return (
      <div style={{
        width: s, height: s, borderRadius: 999,
        background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: '#fff', fontSize: s * 0.5, fontWeight: 700, lineHeight: 1 }}>✕</span>
      </div>
    );
  }

  return null;
}

/** buttonStyle.scaleKey → fontSize 변환 */
function ts_fontSize(scaleKey?: string): number {
  switch (scaleKey) {
    case '2xs': return 13;
    case 'xs': return 14;
    case 'sm': return 16;
    case 'md': return 22;
    case 'lg': return 32;
    case 'xl': return 40;
    case '2xl': return 56;
    case '3xl': return 76;
    default: return 18;
  }
}

import React from 'react';
import { calculateBoxFitCamera } from '../../core/camera/cameraMath';
import { FONT_FAMILIES, FontFamilyId } from '../../core/engine/fontConstants';
import { useCameraStore } from '../../stores/useCameraStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { CanvasElement, StrokeStyle } from '../../types/canvas';

const COLOR_SWATCHES = [
  { name: 'Obsidian', hex: '#1e293b' },
  { name: 'Charcoal', hex: '#64748b' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Coral Red', hex: '#e11d48' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Violet', hex: '#7c3aed' },
];

const STROKE_SIZES = [
  { label: 'Fine', value: 2 },
  { label: 'Regular', value: 4 },
  { label: 'Medium', value: 8 },
  { label: 'Thick', value: 16 },
];

const FONT_SIZES = [
  { label: 'S', value: 16 },
  { label: 'M', value: 24 },
  { label: 'L', value: 36 },
  { label: 'XL', value: 48 },
];

const STROKE_STYLES: Array<{ label: string; value: StrokeStyle; }> = [
  { label: 'Solid', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
  { label: 'Dotted', value: 'dotted' },
];

function isColorSelected(activeColor: string, swatchHex: string): boolean {
  if (activeColor === swatchHex) return true;
  const a = activeColor.trim().toLowerCase();
  const s = swatchHex.trim().toLowerCase();
  if (a === s) return true;
  if (
    s === '#1e293b'
    && (a === '#000000' || a === '#000' || a === 'black' || a === 'currentcolor'
      || a === 'adaptive')
  ) {
    return true;
  }
  if (s === '#ffffff' && (a === '#fff' || a === 'white')) {
    return true;
  }
  return false;
}

export const StyleInspector: React.FC = () => {
  const currentTool = useToolStore((s) => s.currentTool);
  const zoomMode = useToolStore((s) => s.zoomMode);
  const setZoomMode = useToolStore((s) => s.setZoomMode);
  const color = useToolStore((s) => s.color);
  const fillColor = useToolStore((s) => s.fillColor);
  const strokeSize = useToolStore((s) => s.strokeSize);
  const strokeStyle = useToolStore((s) => s.strokeStyle);
  const fontSize = useToolStore((s) => s.fontSize);
  const fontFamily = useToolStore((s) => s.fontFamily);
  const editingText = useToolStore((s) => s.editingText);

  const setColor = useToolStore((s) => s.setColor);
  const setFillColor = useToolStore((s) => s.setFillColor);
  const setStrokeSize = useToolStore((s) => s.setStrokeSize);
  const setStrokeStyle = useToolStore((s) => s.setStrokeStyle);
  const setFontSize = useToolStore((s) => s.setFontSize);
  const setFontFamily = useToolStore((s) => s.setFontFamily);

  const selectedIds = useDocumentStore((s) => s.selectedIds);
  const elements = useDocumentStore((s) => s.elements);
  const updateSelectedStyle = useDocumentStore((s) => s.updateSelectedStyle);
  const transformSelectedLive = useDocumentStore((s) => s.transformSelectedLive);

  const resetZoom = useCameraStore((s) => s.resetZoom);
  const viewportWidth = useCameraStore((s) => s.viewportWidth);
  const viewportHeight = useCameraStore((s) => s.viewportHeight);

  const selectedElements = selectedIds.map((id) => elements[id]).filter(Boolean);
  const hasTextSelected = selectedElements.some((el) => el.type === 'text');
  const hasShapeSelected = selectedElements.some((el) => el.type === 'shape');
  const hasStrokeSelected = selectedElements.some((el) => el.type === 'stroke');

  const isShapeTool = [
    'rectangle',
    'circle',
    'diamond',
    'line',
    'arrow',
  ].includes(currentTool);

  const showShapeStyles = isShapeTool || hasShapeSelected;
  const isTextMode = currentTool === 'text'
    || editingText !== null
    || (currentTool === 'select' && hasTextSelected);

  if (
    currentTool !== 'pen'
    && currentTool !== 'zoom'
    && !isTextMode
    && !isShapeTool
    && !hasShapeSelected
    && !hasStrokeSelected
  ) {
    return null;
  }

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (selectedIds.length > 0) {
      if (hasTextSelected) {
        updateSelectedStyle({ color: newColor });
      }
      const updated: Record<string, CanvasElement> = {};
      for (const id of selectedIds) {
        const el = elements[id];
        if (el?.type === 'shape') {
          updated[id] = { ...el, strokeColor: newColor, cachedPath2D: undefined };
        } else if (el?.type === 'stroke') {
          updated[id] = { ...el, color: newColor, cachedPath2D: undefined };
        }
      }
      if (Object.keys(updated).length > 0) {
        transformSelectedLive(updated);
      }
    }
  };

  const handleFillColorChange = (newFill: string) => {
    setFillColor(newFill);
    if (selectedIds.length > 0) {
      const updated: Record<string, CanvasElement> = {};
      for (const id of selectedIds) {
        const el = elements[id];
        if (el?.type === 'shape') {
          updated[id] = { ...el, fillColor: newFill, cachedPath2D: undefined };
        }
      }
      if (Object.keys(updated).length > 0) {
        transformSelectedLive(updated);
      }
    }
  };

  const handleStrokeStyleChange = (newStyle: StrokeStyle) => {
    setStrokeStyle(newStyle);
    if (selectedIds.length > 0) {
      const updated: Record<string, CanvasElement> = {};
      for (const id of selectedIds) {
        const el = elements[id];
        if (el?.type === 'shape') {
          updated[id] = { ...el, strokeStyle: newStyle, cachedPath2D: undefined };
        }
      }
      if (Object.keys(updated).length > 0) {
        transformSelectedLive(updated);
      }
    }
  };

  const handleStrokeSizeChange = (newSize: number) => {
    setStrokeSize(newSize);
    if (selectedIds.length > 0) {
      const updated: Record<string, CanvasElement> = {};
      for (const id of selectedIds) {
        const el = elements[id];
        if (el?.type === 'shape') {
          updated[id] = { ...el, strokeWidth: newSize, cachedPath2D: undefined };
        } else if (el?.type === 'stroke') {
          updated[id] = { ...el, size: newSize, isResized: false, cachedPath2D: undefined };
        }
      }
      if (Object.keys(updated).length > 0) {
        transformSelectedLive(updated);
      }
    }
  };

  const handleFontFamilyChange = (newFontFamily: FontFamilyId) => {
    setFontFamily(newFontFamily);
    if (selectedIds.length > 0) {
      updateSelectedStyle({ fontFamily: newFontFamily });
    }
  };

  const handleFontSizeChange = (newFontSize: number) => {
    setFontSize(newFontSize);
    if (selectedIds.length > 0) {
      updateSelectedStyle({ fontSize: newFontSize });
    }
  };

  if (currentTool === 'zoom') {
    const handleFitAll = () => {
      const doc = useDocumentStore.getState();
      const ids = doc.elementIds;
      if (ids.length === 0) {
        resetZoom();
        useCameraStore.getState().setPan(0, 0);
        return;
      }

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const id of ids) {
        const el = doc.elements[id];
        if (el) {
          minX = Math.min(minX, el.x);
          minY = Math.min(minY, el.y);
          maxX = Math.max(maxX, el.x + el.width);
          maxY = Math.max(maxY, el.y + el.height);
        }
      }

      if (minX !== Infinity) {
        const fit = calculateBoxFitCamera(
          { minX, minY, maxX, maxY },
          viewportWidth,
          viewportHeight,
          0.85,
        );
        useCameraStore.setState({ camera: fit });
      }
    };

    return (
      <aside
        style={{
          position: 'absolute',
          top: 70,
          left: 16,
          background: 'var(--color-panel-bg, rgba(15, 23, 42, 0.78))',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.08))',
          borderRadius: 14,
          padding: '12px',
          zIndex: 25,
          boxShadow:
            'var(--color-panel-shadow, 0 12px 36px rgba(0,0,0,0.45)), inset 0 1px 0 rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minWidth: 160,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary, #64748b)',
              fontWeight: 700,
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}
          >
            Zoom Mode
          </div>
          <div
            style={{
              display: 'flex',
              background: 'rgba(125, 125, 125, 0.12)',
              padding: 3,
              borderRadius: 8,
              gap: 3,
            }}
          >
            <button
              onClick={() => setZoomMode('scrubby')}
              style={{
                flex: 1,
                background: zoomMode === 'scrubby'
                  ? 'var(--color-accent, #0284c7)'
                  : 'transparent',
                color: zoomMode === 'scrubby'
                  ? '#ffffff'
                  : 'var(--color-text-secondary, #94a3b8)',
                border: zoomMode === 'scrubby'
                  ? '1px solid var(--color-accent, #0284c7)'
                  : '1px solid transparent',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: 11,
                fontWeight: zoomMode === 'scrubby' ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <svg
                width='12'
                height='12'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <path d='m7 16-4-4 4-4' />
                <path d='m17 8 4 4-4 4' />
                <path d='M3 12h18' />
              </svg>
              Scrubby
            </button>
            <button
              onClick={() => setZoomMode('selection')}
              style={{
                flex: 1,
                background: zoomMode === 'selection'
                  ? 'var(--color-accent, #0284c7)'
                  : 'transparent',
                color: zoomMode === 'selection'
                  ? '#ffffff'
                  : 'var(--color-text-secondary, #94a3b8)',
                border: zoomMode === 'selection'
                  ? '1px solid var(--color-accent, #0284c7)'
                  : '1px solid transparent',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: 11,
                fontWeight: zoomMode === 'selection' ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <svg
                width='12'
                height='12'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <rect
                  x='3'
                  y='3'
                  width='18'
                  height='18'
                  rx='2'
                  strokeDasharray='4 3'
                />
              </svg>
              Selection
            </button>
          </div>
        </div>

        <div
          style={{
            height: 1,
            background: 'var(--color-panel-border, rgba(255, 255, 255, 0.08))',
          }}
        />

        <div>
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary, #64748b)',
              fontWeight: 700,
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}
          >
            Quick View
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={resetZoom}
              style={{
                flex: 1,
                background: 'rgba(125, 125, 125, 0.08)',
                color: 'var(--color-text-primary, #cbd5e1)',
                border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.08))',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(125, 125, 125, 0.16)';
                e.currentTarget.style.color = 'var(--color-text-primary, #f1f5f9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(125, 125, 125, 0.08)';
                e.currentTarget.style.color = 'var(--color-text-primary, #cbd5e1)';
              }}
            >
              100%
            </button>
            <button
              onClick={handleFitAll}
              style={{
                flex: 1,
                background: 'rgba(125, 125, 125, 0.08)',
                color: 'var(--color-text-primary, #cbd5e1)',
                border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.08))',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(125, 125, 125, 0.16)';
                e.currentTarget.style.color = 'var(--color-text-primary, #f1f5f9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(125, 125, 125, 0.08)';
                e.currentTarget.style.color = 'var(--color-text-primary, #cbd5e1)';
              }}
            >
              Fit Drawing
            </button>
          </div>
        </div>

        <div
          style={{
            fontSize: 10,
            color: 'var(--color-text-secondary, #64748b)',
            lineHeight: 1.4,
            borderTop: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.06))',
            paddingTop: 8,
          }}
        >
          {zoomMode === 'scrubby'
            ? 'Drag left/right to scrub. Click to zoom in, Alt+Click to zoom out.'
            : 'Drag a box around an area to zoom into it. Click to zoom in.'}
        </div>
      </aside>
    );
  }

  return (
    <aside
      style={{
        position: 'absolute',
        top: 70,
        left: 16,
        background: 'var(--color-panel-bg, rgba(15, 23, 42, 0.78))',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.08))',
        borderRadius: 14,
        padding: '12px',
        zIndex: 25,
        boxShadow:
          'var(--color-panel-shadow, 0 12px 36px rgba(0,0,0,0.45)), inset 0 1px 0 rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary, #64748b)',
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginBottom: 8,
          }}
        >
          {showShapeStyles ? 'Stroke Color' : 'Color'}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 26px)',
            gap: 6,
          }}
        >
          {COLOR_SWATCHES.map((swatch) => {
            const isSelected = isColorSelected(color, swatch.hex);
            return (
              <button
                key={swatch.hex}
                title={swatch.name}
                data-testid={`stroke-swatch-${swatch.hex}`}
                onClick={() => handleColorChange(swatch.hex)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: swatch.hex,
                  border: isSelected
                    ? '2px solid var(--color-accent, #38bdf8)'
                    : '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.12))',
                  boxShadow: isSelected
                    ? '0 0 8px rgba(56, 189, 248, 0.5)'
                    : 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'transform 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
            );
          })}
        </div>
      </div>

      {isTextMode && (
        <>
          <div
            style={{
              height: 1,
              background: 'var(--color-panel-border, rgba(255, 255, 255, 0.08))',
            }}
          />
          <div>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary, #64748b)',
                fontWeight: 700,
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              Font
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {FONT_FAMILIES.map((f) => {
                const isSelected = fontFamily === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => handleFontFamilyChange(f.id)}
                    style={{
                      background: isSelected
                        ? 'var(--color-accent, #0284c7)'
                        : 'transparent',
                      color: isSelected
                        ? '#ffffff'
                        : 'var(--color-text-secondary, #94a3b8)',
                      border: isSelected
                        ? '1px solid var(--color-accent, #0284c7)'
                        : '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.08))',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 11,
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: f.family,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(125, 125, 125, 0.12)';
                        e.currentTarget.style.color = 'var(--color-text-primary, #f1f5f9)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--color-text-secondary, #94a3b8)';
                      }
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {showShapeStyles && (
        <>
          <div
            style={{
              height: 1,
              background: 'var(--color-panel-border, rgba(255, 255, 255, 0.08))',
            }}
          />
          <div>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary, #64748b)',
                fontWeight: 700,
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              Fill Color
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 26px)',
                gap: 6,
              }}
            >
              <button
                title='Transparent / None'
                data-testid='fill-swatch-transparent'
                onClick={() => handleFillColorChange('transparent')}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: 'rgba(125, 125, 125, 0.1)',
                  border: fillColor === 'transparent'
                    ? '2px solid var(--color-accent, #38bdf8)'
                    : '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.12))',
                  boxShadow: fillColor === 'transparent'
                    ? '0 0 8px rgba(56, 189, 248, 0.5)'
                    : 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  transition: 'transform 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg
                  width='14'
                  height='14'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <circle cx='12' cy='12' r='8' />
                  <line x1='6' y1='18' x2='18' y2='6' />
                </svg>
              </button>

              {COLOR_SWATCHES.map((swatch) => {
                const isSelected = isColorSelected(fillColor, swatch.hex);
                return (
                  <button
                    key={swatch.hex}
                    title={swatch.name}
                    data-testid={`fill-swatch-${swatch.hex}`}
                    onClick={() => handleFillColorChange(swatch.hex)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      background: swatch.hex,
                      border: isSelected
                        ? '2px solid var(--color-accent, #38bdf8)'
                        : '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.12))',
                      boxShadow: isSelected
                        ? '0 0 8px rgba(56, 189, 248, 0.5)'
                        : 'none',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'transform 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div
            style={{
              height: 1,
              background: 'var(--color-panel-border, rgba(255, 255, 255, 0.08))',
            }}
          />
          <div>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary, #64748b)',
                fontWeight: 700,
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              Stroke Style
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {STROKE_STYLES.map((st) => {
                const isSelected = strokeStyle === st.value;
                return (
                  <button
                    key={st.value}
                    onClick={() => handleStrokeStyleChange(st.value)}
                    style={{
                      flex: 1,
                      background: isSelected
                        ? 'var(--color-accent, #0284c7)'
                        : 'transparent',
                      color: isSelected
                        ? '#ffffff'
                        : 'var(--color-text-secondary, #94a3b8)',
                      border: isSelected
                        ? '1px solid var(--color-accent, #0284c7)'
                        : '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.08))',
                      borderRadius: 6,
                      padding: '4px 6px',
                      fontSize: 11,
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                    }}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div
        style={{
          height: 1,
          background: 'var(--color-panel-border, rgba(255, 255, 255, 0.08))',
        }}
      />

      <div>
        <div
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary, #64748b)',
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginBottom: 8,
          }}
        >
          {isTextMode ? 'Font Size' : 'Thickness'}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {isTextMode
            ? FONT_SIZES.map((s) => {
              const isSelected = fontSize === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => handleFontSizeChange(s.value)}
                  style={{
                    background: isSelected
                      ? 'var(--color-accent, #0284c7)'
                      : 'transparent',
                    color: isSelected
                      ? '#ffffff'
                      : 'var(--color-text-secondary, #94a3b8)',
                    border: isSelected
                      ? '1px solid var(--color-accent, #0284c7)'
                      : '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.08))',
                    borderRadius: 6,
                    padding: '4px 7px',
                    fontSize: 11,
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(125, 125, 125, 0.12)';
                      e.currentTarget.style.color = 'var(--color-text-primary, #f1f5f9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--color-text-secondary, #94a3b8)';
                    }
                  }}
                >
                  {s.label}
                </button>
              );
            })
            : STROKE_SIZES.map((s) => {
              const isSelected = strokeSize === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => handleStrokeSizeChange(s.value)}
                  style={{
                    background: isSelected
                      ? 'var(--color-accent, #0284c7)'
                      : 'transparent',
                    color: isSelected
                      ? '#ffffff'
                      : 'var(--color-text-secondary, #94a3b8)',
                    border: isSelected
                      ? '1px solid var(--color-accent, #0284c7)'
                      : '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.08))',
                    borderRadius: 6,
                    padding: '4px 7px',
                    fontSize: 11,
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(125, 125, 125, 0.12)';
                      e.currentTarget.style.color = 'var(--color-text-primary, #f1f5f9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--color-text-secondary, #94a3b8)';
                    }
                  }}
                >
                  {s.label}
                </button>
              );
            })}
        </div>
      </div>
    </aside>
  );
};

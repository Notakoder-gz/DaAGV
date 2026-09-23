import React, { useRef, useEffect } from 'react';
import { EditorState } from '../store/editorStore';
import { CoordinateTransform } from '../utils/coordinateTransform';
import { TrafficSitePoint, TrafficSite, TrafficLine } from '../types/map';

interface MapCanvasProps {
  state: EditorState;
  setState: React.Dispatch<React.SetStateAction<EditorState>>;
  onNodeClickForVda?: (site: TrafficSite) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ state, setState, onNodeClickForVda }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isPanning = useRef(false);
  const startPanPos = useRef({ x: 0, y: 0 });
  const isDrawing = useRef(false);
  const isDraggingItem = useRef<
    | { type: 'site'; code: number }
    | { type: 'control_point'; lineCode: number; pointIndex: number }
    | null
  >(null);

  const { viewport, mapConfig, activeTool, layers, trafficMap, selection } = state;

  // Convert canvas mouse client position to Traffic space (mm)
  const clientToTraffic = (clientX: number, clientY: number): TrafficSitePoint => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;

    const px = (cx - viewport.x) / viewport.scale;
    const py = (cy - viewport.y) / viewport.scale;

    const worldRaw = CoordinateTransform.pixelToWorld(px, py, mapConfig);
    const worldAligned = CoordinateTransform.applyOffsetToWorld(
      worldRaw.x,
      worldRaw.y,
      state.projectInfo
    );

    return CoordinateTransform.worldToTraffic(worldAligned.x, worldAligned.y);
  };

  const siteToPixel = (pt: TrafficSitePoint) => {
    const worldMeters = CoordinateTransform.trafficToWorld(pt);
    const rawWorld = CoordinateTransform.removeOffsetFromWorld(
      worldMeters.x,
      worldMeters.y,
      state.projectInfo
    );
    return CoordinateTransform.worldToPixel(rawWorld.x, rawWorld.y, mapConfig);
  };

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || window.innerWidth;
    const height = canvas.parentElement?.clientHeight || window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.scale, viewport.scale);

    // 1. Render Base SLAM Map Raster
    if (layers.baseMap.visible) {
      ctx.globalAlpha = layers.baseMap.opacity;
      if (state.baseMapCanvas) {
        ctx.drawImage(state.baseMapCanvas, 0, 0);
      } else {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, mapConfig.width, mapConfig.height);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, mapConfig.width, mapConfig.height);
      }
    }

    // 2. Render Traffic Map Layer
    if (layers.trafficMap.visible) {
      ctx.globalAlpha = layers.trafficMap.opacity;

      // Draw Zones
      if (trafficMap.zones) {
        for (const zone of trafficMap.zones) {
          if (!zone.points || zone.points.length < 3) continue;
          ctx.beginPath();
          const firstPx = siteToPixel(zone.points[0]);
          ctx.moveTo(firstPx.x, firstPx.y);
          for (let i = 1; i < zone.points.length; i++) {
            const px = siteToPixel(zone.points[i]);
            ctx.lineTo(px.x, px.y);
          }
          ctx.closePath();

          ctx.fillStyle =
            zone.type === 'keep_out'
              ? 'rgba(239, 68, 68, 0.25)'
              : zone.type === 'speed_limit'
              ? 'rgba(234, 179, 8, 0.25)'
              : 'rgba(59, 130, 246, 0.25)';

          ctx.strokeStyle =
            selection.type === 'zone' && selection.id === zone.id
              ? '#38bdf8'
              : zone.type === 'keep_out'
              ? '#ef4444'
              : '#eab308';
          ctx.lineWidth = selection.type === 'zone' && selection.id === zone.id ? 4 / viewport.scale : 2 / viewport.scale;

          ctx.fill();
          ctx.stroke();
        }
      }

      // Draw Pending Zone Points
      if (state.pendingZonePoints.length > 0) {
        ctx.beginPath();
        const firstPx = siteToPixel(state.pendingZonePoints[0]);
        ctx.moveTo(firstPx.x, firstPx.y);
        for (let i = 1; i < state.pendingZonePoints.length; i++) {
          const px = siteToPixel(state.pendingZonePoints[i]);
          ctx.lineTo(px.x, px.y);
        }
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2 / viewport.scale;
        ctx.setLineDash([6 / viewport.scale, 4 / viewport.scale]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const siteMap = new Map<number, TrafficSite>();
      trafficMap.sites.forEach((s) => siteMap.set(s.code, s));

      // Draw Edges
      trafficMap.lines.forEach((line) => {
        const s1 = siteMap.get(line.sites[0]);
        const s2 = siteMap.get(line.sites[1]);
        if (!s1 || !s2) return;

        const p1 = siteToPixel(s1.point);
        const p2 = siteToPixel(s2.point);

        const isSelected = selection.type === 'edge' && selection.id === line.code;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);

        if (line.type === 2 && line.curve_control_points && line.curve_control_points.length > 0) {
          const cp1 = siteToPixel(line.curve_control_points[0]);
          if (line.curve_control_points.length >= 2) {
            const cp2 = siteToPixel(line.curve_control_points[1]);
            ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
          } else {
            ctx.quadraticCurveTo(cp1.x, cp1.y, p2.x, p2.y);
          }
        } else {
          ctx.lineTo(p2.x, p2.y);
        }

        ctx.strokeStyle = isSelected ? '#38bdf8' : line.type === 2 ? '#a855f7' : '#22c55e';
        ctx.lineWidth = isSelected ? 4 / viewport.scale : 2 / viewport.scale;
        ctx.stroke();

        if (line.type === 2) {
          const cps = line.curve_control_points || [];
          cps.forEach((cpPoint, index) => {
            const cpPx = siteToPixel(cpPoint);
            ctx.beginPath();
            ctx.moveTo(index === 0 ? p1.x : p2.x, index === 0 ? p1.y : p2.y);
            ctx.lineTo(cpPx.x, cpPx.y);
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 1 / viewport.scale;
            ctx.setLineDash([3 / viewport.scale, 3 / viewport.scale]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.arc(cpPx.x, cpPx.y, 5 / viewport.scale, 0, Math.PI * 2);
            ctx.fillStyle = '#a855f7';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5 / viewport.scale;
            ctx.stroke();
          });
        }

        let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        let midX = (p1.x + p2.x) / 2;
        let midY = (p1.y + p2.y) / 2;

        if (line.type === 2 && line.curve_control_points && line.curve_control_points.length > 0) {
          const cp1 = siteToPixel(line.curve_control_points[0]);
          midX = 0.25 * p1.x + 0.5 * cp1.x + 0.25 * p2.x;
          midY = 0.25 * p1.y + 0.5 * cp1.y + 0.25 * p2.y;
        }

        const arrowSize = 8 / viewport.scale;
        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-arrowSize, -arrowSize / 2);
        ctx.lineTo(0, 0);
        ctx.lineTo(-arrowSize, arrowSize / 2);
        ctx.strokeStyle = isSelected ? '#38bdf8' : line.type === 2 ? '#a855f7' : '#22c55e';
        ctx.lineWidth = 2 / viewport.scale;
        ctx.stroke();
        ctx.restore();
      });

      // Sites
      trafficMap.sites.forEach((site) => {
        const p = siteToPixel(site.point);
        const isSelected = selection.type === 'node' && selection.id === site.code;
        const isEdgeStart = state.edgeStartSiteCode === site.code;

        ctx.beginPath();
        ctx.arc(p.x, p.y, (isSelected || isEdgeStart ? 8 : 6) / viewport.scale, 0, Math.PI * 2);

        ctx.fillStyle = isEdgeStart ? '#f59e0b' : isSelected ? '#38bdf8' : site.type === 3 ? '#ef4444' : '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 / viewport.scale;
        ctx.stroke();

        if (site.stop_dir !== undefined && site.stop_dir >= 0) {
          const headingRad = (site.stop_dir * Math.PI) / 180.0;
          const arrowLen = 16 / viewport.scale;
          const hx = p.x + arrowLen * Math.cos(headingRad);
          const hy = p.y - arrowLen * Math.sin(headingRad);

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(hx, hy);
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2 / viewport.scale;
          ctx.stroke();
        }

        ctx.font = `${Math.max(10, 12 / viewport.scale)}px sans-serif`;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(site.name || `${site.code}`, p.x + 8 / viewport.scale, p.y - 8 / viewport.scale);
      });
    }

    ctx.restore();
  }, [state]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setState((prev) => {
      const newScale = Math.min(Math.max(prev.viewport.scale * zoomFactor, 0.1), 30.0);
      const newX = mouseX - (mouseX - prev.viewport.x) * (newScale / prev.viewport.scale);
      const newY = mouseY - (mouseY - prev.viewport.y) * (newScale / prev.viewport.scale);

      return {
        ...prev,
        viewport: { x: newX, y: newY, scale: newScale },
      };
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || activeTool === 'pan') {
      isPanning.current = true;
      startPanPos.current = { x: e.clientX - viewport.x, y: e.clientY - viewport.y };
      return;
    }

    const trafficPt = clientToTraffic(e.clientX, e.clientY);

    // Brush or Eraser
    if ((activeTool === 'brush' || activeTool === 'eraser') && state.baseMapCanvas) {
      isDrawing.current = true;
      paintOnCanvas(e.clientX, e.clientY);
      return;
    }

    // Add Node
    if (activeTool === 'add_node') {
      const maxCode = state.trafficMap.sites.reduce((max, s) => Math.max(max, s.code), 0);
      const newCode = maxCode + 1;
      const newSite: TrafficSite = {
        code: newCode,
        name: `${newCode}`,
        point: trafficPt,
        type: 1,
        collision: 3,
        full_collision: 3,
        stop_dir: -1,
      };

      setState((prev) => ({
        ...prev,
        trafficMap: {
          ...prev.trafficMap,
          sites: [...prev.trafficMap.sites, newSite],
        },
        selection: { type: 'node', id: newCode },
      }));
      return;
    }

    // Add Edge
    if (activeTool === 'add_edge') {
      const clickedSite = findSiteNearTrafficPoint(trafficPt, 500);
      if (clickedSite) {
        if (state.edgeStartSiteCode === null) {
          setState((prev) => ({ ...prev, edgeStartSiteCode: clickedSite.code }));
        } else if (state.edgeStartSiteCode !== clickedSite.code) {
          const maxCode = state.trafficMap.lines.reduce((max, l) => Math.max(max, l.code), 0);
          const newLine: TrafficLine = {
            code: maxCode + 1,
            name: `${maxCode + 1}`,
            sites: [state.edgeStartSiteCode, clickedSite.code],
            type: 1,
            speed: 400,
            full_speed: 400,
            path_dir: 0,
          };
          setState((prev) => ({
            ...prev,
            trafficMap: {
              ...prev.trafficMap,
              lines: [...prev.trafficMap.lines, newLine],
            },
            edgeStartSiteCode: null,
            selection: { type: 'edge', id: newLine.code },
          }));
        }
      }
      return;
    }

    // Add Zone
    if (activeTool === 'add_zone') {
      setState((prev) => ({
        ...prev,
        pendingZonePoints: [...prev.pendingZonePoints, trafficPt],
      }));
      return;
    }

    // Select Tool
    if (activeTool === 'select' || state.mainTab === 'split_view') {
      const site = findSiteNearTrafficPoint(trafficPt, 500);
      if (site) {
        if (onNodeClickForVda) {
          onNodeClickForVda(site);
        }
        isDraggingItem.current = { type: 'site', code: site.code };
        setState((prev) => ({ ...prev, selection: { type: 'node', id: site.code } }));
        return;
      }

      for (const line of state.trafficMap.lines) {
        if (line.type === 2 && line.curve_control_points) {
          for (let idx = 0; idx < line.curve_control_points.length; idx++) {
            const cp = line.curve_control_points[idx];
            const dx = cp.x - trafficPt.x;
            const dy = cp.y - trafficPt.y;
            if (Math.sqrt(dx * dx + dy * dy) <= 400) {
              isDraggingItem.current = { type: 'control_point', lineCode: line.code, pointIndex: idx };
              setState((prev) => ({
                ...prev,
                selection: { type: 'edge', id: line.code, controlPointIndex: idx },
              }));
              return;
            }
          }
        }
      }

      const edge = findEdgeNearTrafficPoint(trafficPt, 400);
      if (edge) {
        setState((prev) => ({ ...prev, selection: { type: 'edge', id: edge.code } }));
        return;
      }

      setState((prev) => ({ ...prev, selection: { type: null, id: null } }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const px = (cx - viewport.x) / viewport.scale;
    const py = (cy - viewport.y) / viewport.scale;

    const worldRaw = CoordinateTransform.pixelToWorld(px, py, mapConfig);
    const worldAligned = CoordinateTransform.applyOffsetToWorld(
      worldRaw.x,
      worldRaw.y,
      state.projectInfo
    );
    const trafficPt = CoordinateTransform.worldToTraffic(worldAligned.x, worldAligned.y);

    setState((prev) => ({
      ...prev,
      hoverCoords: {
        pixelX: Math.round(px),
        pixelY: Math.round(py),
        worldX: parseFloat(worldAligned.x.toFixed(3)),
        worldY: parseFloat(worldAligned.y.toFixed(3)),
        trafficX: trafficPt.x,
        trafficY: trafficPt.y,
      },
    }));

    if (isPanning.current) {
      setState((prev) => ({
        ...prev,
        viewport: {
          ...prev.viewport,
          x: e.clientX - startPanPos.current.x,
          y: e.clientY - startPanPos.current.y,
        },
      }));
      return;
    }

    if (isDrawing.current && (activeTool === 'brush' || activeTool === 'eraser')) {
      paintOnCanvas(e.clientX, e.clientY);
      return;
    }

    if (isDraggingItem.current && activeTool === 'select') {
      if (isDraggingItem.current.type === 'site') {
        const siteCode = isDraggingItem.current.code;
        setState((prev) => ({
          ...prev,
          trafficMap: {
            ...prev.trafficMap,
            sites: prev.trafficMap.sites.map((s) =>
              s.code === siteCode ? { ...s, point: trafficPt } : s
            ),
          },
        }));
      } else if (isDraggingItem.current.type === 'control_point') {
        const { lineCode, pointIndex } = isDraggingItem.current;
        setState((prev) => ({
          ...prev,
          trafficMap: {
            ...prev.trafficMap,
            lines: prev.trafficMap.lines.map((l) => {
              if (l.code !== lineCode) return l;
              const newPoints = [...(l.curve_control_points || [])];
              newPoints[pointIndex] = trafficPt;
              return { ...l, curve_control_points: newPoints };
            }),
          },
        }));
      }
    }
  };

  const handleMouseUp = () => {
    isPanning.current = false;
    isDrawing.current = false;
    isDraggingItem.current = null;
  };

  const paintOnCanvas = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !state.baseMapCanvas) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;

    const px = (cx - viewport.x) / viewport.scale;
    const py = (cy - viewport.y) / viewport.scale;

    const ctx = state.baseMapCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = activeTool === 'eraser' ? '#ffffff' : state.brush.value === 0 ? '#000000' : '#808080';
    ctx.beginPath();
    ctx.arc(px, py, state.brush.size / 2, 0, Math.PI * 2);
    ctx.fill();

    setState((prev) => ({ ...prev }));
  };

  const findSiteNearTrafficPoint = (pt: TrafficSitePoint, radiusMm: number): TrafficSite | null => {
    for (const site of state.trafficMap.sites) {
      const dx = site.point.x - pt.x;
      const dy = site.point.y - pt.y;
      if (Math.sqrt(dx * dx + dy * dy) <= radiusMm) {
        return site;
      }
    }
    return null;
  };

  const findEdgeNearTrafficPoint = (pt: TrafficSitePoint, radiusMm: number): TrafficLine | null => {
    const siteMap = new Map<number, TrafficSite>();
    state.trafficMap.sites.forEach((s) => siteMap.set(s.code, s));

    for (const line of state.trafficMap.lines) {
      const s1 = siteMap.get(line.sites[0]);
      const s2 = siteMap.get(line.sites[1]);
      if (!s1 || !s2) continue;

      const p1 = s1.point;
      const p2 = s2.point;

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;

      let t = ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));

      const projX = p1.x + t * dx;
      const projY = p1.y + t * dy;

      const dist = Math.sqrt((pt.x - projX) ** 2 + (pt.y - projY) ** 2);
      if (dist <= radiusMm) {
        return line;
      }
    }
    return null;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900 cursor-crosshair">
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full block"
      />
    </div>
  );
};

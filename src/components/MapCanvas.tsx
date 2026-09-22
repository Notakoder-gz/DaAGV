import React, { useRef, useEffect } from 'react';
import { EditorState } from '../store/editorStore';
import { CoordinateTransform } from '../utils/coordinateTransform';
import { TrafficSitePoint, TrafficSite, TrafficLine } from '../types/map';

interface MapCanvasProps {
  state: EditorState;
  setState: React.Dispatch<React.SetStateAction<EditorState>>;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ state, setState }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isPanning = useRef(false);
  const startPanPos = useRef({ x: 0, y: 0 });
  const isDrawing = useRef(false);

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

    // 1. Render Base Map
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

      const siteToPixel = (pt: TrafficSitePoint) => {
        const worldMeters = CoordinateTransform.trafficToWorld(pt);
        const rawWorld = CoordinateTransform.removeOffsetFromWorld(
          worldMeters.x,
          worldMeters.y,
          state.projectInfo
        );
        return CoordinateTransform.worldToPixel(rawWorld.x, rawWorld.y, mapConfig);
      };

      // Zones
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

      // Pending Zone Points
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

      // Edges
      trafficMap.lines.forEach((line) => {
        const s1 = siteMap.get(line.sites[0]);
        const s2 = siteMap.get(line.sites[1]);
        if (!s1 || !s2) return;

        const p1 = siteToPixel(s1.point);
        const p2 = siteToPixel(s2.point);

        const isSelected = selection.type === 'edge' && selection.id === line.code;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        ctx.strokeStyle = isSelected ? '#38bdf8' : line.type === 2 ? '#a855f7' : '#22c55e';
        ctx.lineWidth = isSelected ? 4 / viewport.scale : 2 / viewport.scale;
        ctx.stroke();

        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const arrowSize = 8 / viewport.scale;

        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-arrowSize, -arrowSize / 2);
        ctx.lineTo(0, 0);
        ctx.lineTo(-arrowSize, arrowSize / 2);
        ctx.strokeStyle = isSelected ? '#38bdf8' : '#22c55e';
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

    if ((activeTool === 'brush' || activeTool === 'eraser') && state.baseMapCanvas) {
      isDrawing.current = true;
      paintOnCanvas(e.clientX, e.clientY);
      return;
    }

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

    if (activeTool === 'add_zone') {
      setState((prev) => ({
        ...prev,
        pendingZonePoints: [...prev.pendingZonePoints, trafficPt],
      }));
      return;
    }

    if (activeTool === 'select') {
      const site = findSiteNearTrafficPoint(trafficPt, 500);
      if (site) {
        setState((prev) => ({ ...prev, selection: { type: 'node', id: site.code } }));
        return;
      }
      setState((prev) => ({ ...prev, selection: { type: null, id: null } }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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
    }
  };

  const handleMouseUp = () => {
    isPanning.current = false;
    isDrawing.current = false;
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

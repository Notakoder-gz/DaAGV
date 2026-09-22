import React from 'react';
import { EditorState, ActiveTool } from '../store/editorStore';
import {
  Hand,
  MousePointer,
  Move,
  Paintbrush,
  Eraser,
  MapPin,
  GitCommitHorizontal,
  Square,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

interface ToolbarProps {
  state: EditorState;
  setState: React.Dispatch<React.SetStateAction<EditorState>>;
}

export const Toolbar: React.FC<ToolbarProps> = ({ state, setState }) => {
  const tools: Array<{ id: ActiveTool; label: string; icon: React.ReactNode }> = [
    { id: 'pan', label: 'Pan Canvas', icon: <Hand className="w-4 h-4" /> },
    { id: 'select', label: 'Select Element', icon: <MousePointer className="w-4 h-4" /> },
    { id: 'align', label: 'Map Alignment', icon: <Move className="w-4 h-4" /> },
    { id: 'add_node', label: 'Add Node/Site', icon: <MapPin className="w-4 h-4" /> },
    { id: 'add_edge', label: 'Add Edge/Path', icon: <GitCommitHorizontal className="w-4 h-4" /> },
    { id: 'add_zone', label: 'Draw Polygon Zone', icon: <Square className="w-4 h-4" /> },
    { id: 'brush', label: 'Paint Wall (Black)', icon: <Paintbrush className="w-4 h-4" /> },
    { id: 'eraser', label: 'Clear Area (White)', icon: <Eraser className="w-4 h-4" /> },
  ];

  const handleZoom = (factor: number) => {
    setState((prev) => ({
      ...prev,
      viewport: {
        ...prev.viewport,
        scale: Math.min(Math.max(prev.viewport.scale * factor, 0.1), 30.0),
      },
    }));
  };

  const resetView = () => {
    setState((prev) => ({
      ...prev,
      viewport: { x: 300, y: 200, scale: 0.8 },
    }));
  };

  return (
    <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-10 select-none">
      <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
        {tools.map((tool) => {
          const isActive = state.activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  activeTool: tool.id,
                  edgeStartSiteCode: null,
                }))
              }
              title={tool.label}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tool.icon}
              <span className="hidden md:inline">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {state.activeTool === 'add_zone' && state.pendingZonePoints.length > 0 && (
        <div className="flex items-center space-x-2">
          <span className="text-xs text-amber-400">
            {state.pendingZonePoints.length} points placed
          </span>
          <button
            onClick={() => {
              if (state.pendingZonePoints.length >= 3) {
                const newZone = {
                  id: `zone_${Date.now()}`,
                  name: `Zone ${state.trafficMap.zones.length + 1}`,
                  type: 'keep_out',
                  points: state.pendingZonePoints,
                };
                setState((prev) => ({
                  ...prev,
                  trafficMap: {
                    ...prev.trafficMap,
                    zones: [...prev.trafficMap.zones, newZone],
                  },
                  pendingZonePoints: [],
                  selection: { type: 'zone', id: newZone.id },
                }));
              }
            }}
            className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 rounded text-white font-medium"
          >
            Complete Polygon
          </button>
          <button
            onClick={() => setState((prev) => ({ ...prev, pendingZonePoints: [] }))}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Viewport Zoom Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => handleZoom(1.2)}
          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-400 w-12 text-center font-mono">
          {Math.round(state.viewport.scale * 100)}%
        </span>
        <button
          onClick={() => handleZoom(0.8)}
          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

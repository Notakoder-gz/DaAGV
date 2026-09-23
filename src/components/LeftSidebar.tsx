import React, { useRef } from 'react';
import { EditorState } from '../store/editorStore';
import { Eye, EyeOff, Layers, Upload, Download, Paintbrush, Eraser } from 'lucide-react';

interface LeftSidebarProps {
  state: EditorState;
  setState: React.Dispatch<React.SetStateAction<EditorState>>;
  onImportFiles: (files: FileList) => void;
  onExportProject: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  state,
  setState,
  onImportFiles,
  onExportProject,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleLayerVisibility = (layerKey: 'baseMap' | 'trafficMap') => {
    setState((prev) => ({
      ...prev,
      layers: {
        ...prev.layers,
        [layerKey]: {
          ...prev.layers[layerKey],
          visible: !prev.layers[layerKey].visible,
        },
      },
    }));
  };

  const handleOpacityChange = (layerKey: 'baseMap' | 'trafficMap', value: number) => {
    setState((prev) => ({
      ...prev,
      layers: {
        ...prev.layers,
        [layerKey]: {
          ...prev.layers[layerKey],
          opacity: value,
        },
      },
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-full select-none text-xs">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".json,.png,.pgm,.jpg,.jpeg,.yaml"
        className="hidden"
      />

      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Header */}
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-500" />
            <span>Map Workspace & Layers</span>
          </h2>
          <p className="text-slate-400 mt-0.5 font-mono">
            ID: {state.projectInfo.project_id || 'Untitled Project'}
          </p>
        </div>

        {/* Project Import / File Management */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span className="flex items-center space-x-1.5">
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              <span>Project Import</span>
            </span>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold rounded-lg text-xs transition-colors"
          >
            Load Map Files (.json, .png, .yaml)
          </button>
        </div>

        {/* Layers Control */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
            Layer Visibility & Opacity
          </h3>

          {/* Layer 1: Base SLAM Grid */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleLayerVisibility('baseMap')}
                  className="text-slate-400 hover:text-white"
                >
                  {state.layers.baseMap.visible ? (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-600" />
                  )}
                </button>
                <span className="font-medium text-slate-200">Layer 1: Base SLAM Grid</span>
              </div>
              <span className="text-slate-500 font-mono">
                {Math.round(state.layers.baseMap.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={state.layers.baseMap.opacity}
              onChange={(e) => handleOpacityChange('baseMap', parseFloat(e.target.value))}
              className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded"
            />
          </div>

          {/* Layer 2: Business Traffic Map */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleLayerVisibility('trafficMap')}
                  className="text-slate-400 hover:text-white"
                >
                  {state.layers.trafficMap.visible ? (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-600" />
                  )}
                </button>
                <span className="font-medium text-slate-200">Layer 2: Traffic / Graph</span>
              </div>
              <span className="text-slate-500 font-mono">
                {Math.round(state.layers.trafficMap.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={state.layers.trafficMap.opacity}
              onChange={(e) => handleOpacityChange('trafficMap', parseFloat(e.target.value))}
              className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded"
            />
          </div>
        </div>

        {/* Brush Settings */}
        {(state.activeTool === 'brush' || state.activeTool === 'eraser') && (
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span className="flex items-center space-x-1.5">
                {state.activeTool === 'brush' ? (
                  <Paintbrush className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Eraser className="w-3.5 h-3.5 text-pink-400" />
                )}
                <span>Brush Size ({state.brush.size}px)</span>
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              value={state.brush.size}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  brush: { ...prev.brush, size: parseInt(e.target.value, 10) },
                }))
              }
              className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded"
            />
          </div>
        )}
      </div>

      {/* Export Action */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
        <button
          onClick={onExportProject}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Map & Traffic Files</span>
        </button>
      </div>
    </div>
  );
};

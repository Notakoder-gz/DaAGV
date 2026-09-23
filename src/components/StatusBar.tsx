import React from 'react';
import { EditorState } from '../store/editorStore';

interface StatusBarProps {
  state: EditorState;
}

export const StatusBar: React.FC<StatusBarProps> = ({ state }) => {
  const { hoverCoords, mapConfig, projectInfo, viewport } = state;

  return (
    <div className="h-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-3 text-[11px] font-mono text-slate-400 select-none z-20">
      <div className="flex items-center space-x-4">
        <span>
          <span className="text-slate-500">Raster Pixel:</span> ({hoverCoords.pixelX}, {hoverCoords.pixelY})
        </span>
        <span>
          <span className="text-slate-500">SLAM World (m):</span> ({hoverCoords.worldX}, {hoverCoords.worldY})
        </span>
        <span className="text-blue-400">
          <span className="text-slate-500">Traffic Frame (mm):</span> ({hoverCoords.trafficX}, {hoverCoords.trafficY})
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <span>
          <span className="text-slate-500">Origin Offset (mm):</span> ({projectInfo.map_origin_offset_x}, {projectInfo.map_origin_offset_y}, {projectInfo.map_origin_offset_theta}°)
        </span>
        <span>
          <span className="text-slate-500">Resolution:</span> {mapConfig.resolution} m/px
        </span>
        <span>
          <span className="text-slate-500">Zoom:</span> {Math.round(viewport.scale * 100)}%
        </span>
      </div>
    </div>
  );
};

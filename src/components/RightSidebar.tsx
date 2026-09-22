import React from 'react';
import { EditorState } from '../store/editorStore';
import { TrafficSite, TrafficLine, TrafficZone } from '../types/map';
import { Settings, Trash2, MapPin, GitCommitHorizontal, Square, Move } from 'lucide-react';

interface RightSidebarProps {
  state: EditorState;
  setState: React.Dispatch<React.SetStateAction<EditorState>>;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ state, setState }) => {
  const { selection, trafficMap, projectInfo, mapConfig } = state;

  const selectedSite =
    selection.type === 'node'
      ? trafficMap.sites.find((s) => s.code === selection.id)
      : null;

  const selectedLine =
    selection.type === 'edge'
      ? trafficMap.lines.find((l) => l.code === selection.id)
      : null;

  const selectedZone =
    selection.type === 'zone'
      ? trafficMap.zones.find((z) => z.id === selection.id)
      : null;

  const handleDelete = () => {
    if (!selection.type || selection.id === null) return;

    setState((prev) => {
      let updatedSites = prev.trafficMap.sites;
      let updatedLines = prev.trafficMap.lines;
      let updatedZones = prev.trafficMap.zones;

      if (selection.type === 'node') {
        updatedSites = updatedSites.filter((s) => s.code !== selection.id);
        // Also remove connected lines
        updatedLines = updatedLines.filter(
          (l) => l.sites[0] !== selection.id && l.sites[1] !== selection.id
        );
      } else if (selection.type === 'edge') {
        updatedLines = updatedLines.filter((l) => l.code !== selection.id);
      } else if (selection.type === 'zone') {
        updatedZones = updatedZones.filter((z) => z.id !== selection.id);
      }

      return {
        ...prev,
        trafficMap: {
          ...prev.trafficMap,
          sites: updatedSites,
          lines: updatedLines,
          zones: updatedZones,
        },
        selection: { type: null, id: null },
      };
    });
  };

  const updateSiteProperty = (key: keyof TrafficSite, value: any) => {
    if (!selectedSite) return;
    setState((prev) => ({
      ...prev,
      trafficMap: {
        ...prev.trafficMap,
        sites: prev.trafficMap.sites.map((s) =>
          s.code === selectedSite.code ? { ...s, [key]: value } : s
        ),
      },
    }));
  };

  const updateLineProperty = (key: keyof TrafficLine, value: any) => {
    if (!selectedLine) return;
    setState((prev) => ({
      ...prev,
      trafficMap: {
        ...prev.trafficMap,
        lines: prev.trafficMap.lines.map((l) =>
          l.code === selectedLine.code ? { ...l, [key]: value } : l
        ),
      },
    }));
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col justify-between h-full select-none text-xs">
      <div className="p-4 space-y-5 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Settings className="w-4 h-4 text-blue-500" />
            <span>Context Properties</span>
          </h2>
          {selection.type && (
            <button
              onClick={handleDelete}
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors"
              title="Delete Element"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Alignment Controls Panel */}
        {state.activeTool === 'align' && (
          <div className="bg-slate-950 p-3 rounded-lg border border-blue-500/30 space-y-3">
            <div className="flex items-center space-x-2 text-blue-400 font-semibold">
              <Move className="w-4 h-4" />
              <span>Base Map Alignment</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Adjust project offsets to align Base SLAM Grid with Traffic Map.
            </p>

            <div className="space-y-2 font-mono">
              <div>
                <label className="text-slate-400 text-[10px]">Offset X (mm):</label>
                <input
                  type="number"
                  value={projectInfo.map_origin_offset_x}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setState((prev) => ({
                      ...prev,
                      projectInfo: { ...prev.projectInfo, map_origin_offset_x: val },
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-200 mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px]">Offset Y (mm):</label>
                <input
                  type="number"
                  value={projectInfo.map_origin_offset_y}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setState((prev) => ({
                      ...prev,
                      projectInfo: { ...prev.projectInfo, map_origin_offset_y: val },
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-200 mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px]">Rotation Theta (deg):</label>
                <input
                  type="number"
                  step="0.1"
                  value={projectInfo.map_origin_offset_theta}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setState((prev) => ({
                      ...prev,
                      projectInfo: { ...prev.projectInfo, map_origin_offset_theta: val },
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-200 mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Selected Node Properties */}
        {selectedSite && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold border-b border-slate-800 pb-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Waypoint Site #{selectedSite.code}</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-slate-400">Site Name / ID:</label>
                <input
                  type="text"
                  value={selectedSite.name}
                  onChange={(e) => updateSiteProperty('name', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded text-slate-200 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-slate-400 text-[10px]">X (mm):</label>
                  <input
                    type="number"
                    value={selectedSite.point.x}
                    onChange={(e) =>
                      updateSiteProperty('point', {
                        ...selectedSite.point,
                        x: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-200 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px]">Y (mm):</label>
                  <input
                    type="number"
                    value={selectedSite.point.y}
                    onChange={(e) =>
                      updateSiteProperty('point', {
                        ...selectedSite.point,
                        y: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-200 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400">Site Type:</label>
                <select
                  value={selectedSite.type}
                  onChange={(e) => updateSiteProperty('type', parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded text-slate-200 mt-1"
                >
                  <option value={1}>Standard Waypoint (Type 1)</option>
                  <option value={3}>Charging Station (Type 3)</option>
                  <option value={6}>Spinning / Turning Point (Type 6)</option>
                  <option value={7}>Pallet Pickup / Drop (Type 7)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400">Collision Threshold:</label>
                <input
                  type="number"
                  value={selectedSite.collision ?? 3}
                  onChange={(e) =>
                    updateSiteProperty('collision', parseInt(e.target.value, 10) || 0)
                  }
                  className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded text-slate-200 mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Selected Line / Edge Properties */}
        {selectedLine && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold border-b border-slate-800 pb-2">
              <GitCommitHorizontal className="w-4 h-4 text-emerald-400" />
              <span>Traffic Edge #{selectedLine.code}</span>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 text-[10px]">From Site:</label>
                  <input
                    type="number"
                    disabled
                    value={selectedLine.sites[0]}
                    className="w-full bg-slate-950/60 border border-slate-800 px-2 py-1 rounded text-slate-400 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px]">To Site:</label>
                  <input
                    type="number"
                    disabled
                    value={selectedLine.sites[1]}
                    className="w-full bg-slate-950/60 border border-slate-800 px-2 py-1 rounded text-slate-400 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400">Max Speed (mm/s):</label>
                <input
                  type="number"
                  value={selectedLine.speed ?? 400}
                  onChange={(e) =>
                    updateLineProperty('speed', parseInt(e.target.value, 10) || 0)
                  }
                  className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded text-slate-200 mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400">Path Type:</label>
                <select
                  value={selectedLine.type}
                  onChange={(e) => updateLineProperty('type', parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded text-slate-200 mt-1"
                >
                  <option value={1}>Straight Line (Type 1)</option>
                  <option value={2}>Bezier Curve (Type 2)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Selected Zone Properties */}
        {selectedZone && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold border-b border-slate-800 pb-2">
              <Square className="w-4 h-4 text-amber-400" />
              <span>Zone Region</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-slate-400">Zone Name:</label>
                <input
                  type="text"
                  value={selectedZone.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setState((prev) => ({
                      ...prev,
                      trafficMap: {
                        ...prev.trafficMap,
                        zones: prev.trafficMap.zones.map((z) =>
                          z.id === selectedZone.id ? { ...z, name } : z
                        ),
                      },
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded text-slate-200 mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400">Zone Type:</label>
                <select
                  value={selectedZone.type}
                  onChange={(e) => {
                    const type = e.target.value as any;
                    setState((prev) => ({
                      ...prev,
                      trafficMap: {
                        ...prev.trafficMap,
                        zones: prev.trafficMap.zones.map((z) =>
                          z.id === selectedZone.id ? { ...z, type } : z
                        ),
                      },
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded text-slate-200 mt-1"
                >
                  <option value="keep_out">Keep-Out Zone (Restricted)</option>
                  <option value="speed_limit">Speed Limit Zone</option>
                  <option value="loading">Loading / Unloading Zone</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {!selection.type && state.activeTool !== 'align' && (
          <div className="text-center py-10 text-slate-500 space-y-2">
            <Settings className="w-8 h-8 mx-auto stroke-1 text-slate-600" />
            <p>Select a waypoint, line, or zone on the canvas to inspect and edit properties.</p>
          </div>
        )}
      </div>
    </div>
  );
};

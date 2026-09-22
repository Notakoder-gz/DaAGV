import { MapConfig, ProjectInfo, TrafficMap, TrafficSite, TrafficLine, TrafficZone, TrafficSitePoint } from '../types/map';

export type ActiveTool =
  | 'pan'
  | 'select'
  | 'align'
  | 'brush'
  | 'eraser'
  | 'add_node'
  | 'add_edge'
  | 'add_zone';

export interface LayerState {
  visible: boolean;
  opacity: number;
}

export interface SelectionState {
  type: 'node' | 'edge' | 'zone' | null;
  id: number | string | null;
}

export interface EditorState {
  // Map Data
  mapConfig: MapConfig;
  projectInfo: ProjectInfo;
  trafficMap: TrafficMap;

  // Base Map Image Canvas element (used for pixel editing and Konva rendering)
  baseMapCanvas: HTMLCanvasElement | null;
  baseMapLoaded: boolean;

  // Tool & Layer Settings
  activeTool: ActiveTool;
  layers: {
    baseMap: LayerState;
    trafficMap: LayerState;
  };

  // Selection
  selection: SelectionState;

  // Edge Creation Temp State
  edgeStartSiteCode: number | null;

  // Zone Creation Temp State
  pendingZonePoints: TrafficSitePoint[];

  // Alignment Temp State (visual offsets applied during alignment mode)
  alignmentOffset: {
    x: number; // mm
    y: number; // mm
    theta: number; // deg
    scale: number; // multiplier e.g. 1.0
  };

  // Brush / Eraser Settings
  brush: {
    size: number; // pixels
    value: 0 | 255 | 128; // 0 = wall (black), 255 = free space (white), 128 = unknown (grey)
  };

  // Canvas Viewport (Pan & Zoom)
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
}

export const initialEditorState: EditorState = {
  mapConfig: {
    width: 2000,
    height: 1200,
    resolution: 0.05,
    origin: { x: -50, y: -30, z: 0 },
    free_th: 0.196,
    occ_th: 0.65,
  },
  projectInfo: {
    project_id: 'perekresto',
    map_origin_offset_x: -3922,
    map_origin_offset_y: -1773,
    map_origin_offset_theta: 357.055,
    navi_type: 1,
  },
  trafficMap: {
    map_info: {
      name: 'DEMO',
      project_id: 'perekresto',
      map_name: 'perekresto@DEMO',
    },
    sites: [],
    lines: [],
    zones: [],
  },
  baseMapCanvas: null,
  baseMapLoaded: false,
  activeTool: 'pan',
  layers: {
    baseMap: { visible: true, opacity: 0.85 },
    trafficMap: { visible: true, opacity: 1.0 },
  },
  selection: { type: null, id: null },
  edgeStartSiteCode: null,
  pendingZonePoints: [],
  alignmentOffset: {
    x: -3922,
    y: -1773,
    theta: 357.055,
    scale: 1.0,
  },
  brush: {
    size: 15,
    value: 0,
  },
  viewport: {
    x: 400,
    y: 300,
    scale: 1.0,
  },
};

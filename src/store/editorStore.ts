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

export type MainTab = 'editor' | 'vda_simulator' | 'split_view';

export interface LayerState {
  visible: boolean;
  opacity: number;
}

export interface SelectionState {
  type: 'node' | 'edge' | 'zone' | 'control_point' | null;
  id: number | string | null;
  controlPointIndex?: number;
}

export interface MqttConfig {
  ip: string;
  port: number;
  clientId: string;
  topicPrefix: string;
  connected: boolean;
}

export interface EditorState {
  mainTab: MainTab;

  // Map Data
  mapConfig: MapConfig;
  projectInfo: ProjectInfo;
  trafficMap: TrafficMap;

  // Base Map Image Canvas element
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

  // Alignment Temp State
  alignmentOffset: {
    x: number; // mm
    y: number; // mm
    theta: number; // deg
    scale: number; // multiplier e.g. 1.0
  };

  // Brush / Eraser Settings
  brush: {
    size: number;
    value: 0 | 255 | 128;
  };

  // Canvas Viewport (Pan & Zoom)
  viewport: {
    x: number;
    y: number;
    scale: number;
  };

  // Hover Coordinates
  hoverCoords: {
    pixelX: number;
    pixelY: number;
    worldX: number;
    worldY: number;
    trafficX: number;
    trafficY: number;
  };

  // MQTT Connection State
  mqtt: MqttConfig;
}

export const initialEditorState: EditorState = {
  mainTab: 'editor',
  mapConfig: {
    width: 2000,
    height: 1200,
    resolution: 0.05,
    origin: { x: -50, y: -30, z: 0 },
    free_th: 0.196,
    occ_th: 0.65,
  },
  projectInfo: {
    project_id: 'new_project',
    map_origin_offset_x: 0,
    map_origin_offset_y: 0,
    map_origin_offset_theta: 0,
    navi_type: 1,
  },
  trafficMap: {
    map_info: {
      name: 'DEMO',
      project_id: 'new_project',
      map_name: 'new_project@DEMO',
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
    x: 0,
    y: 0,
    theta: 0,
    scale: 1.0,
  },
  brush: {
    size: 15,
    value: 0,
  },
  viewport: {
    x: 400,
    y: 300,
    scale: 0.8,
  },
  hoverCoords: {
    pixelX: 0,
    pixelY: 0,
    worldX: 0,
    worldY: 0,
    trafficX: 0,
    trafficY: 0,
  },
  mqtt: {
    ip: '192.168.1.100',
    port: 1883,
    clientId: 'amr_editor_client',
    topicPrefix: 'uagv/v2/XRobot/AMR-001',
    connected: false,
  },
};

export interface MapOrigin {
  x: number; // in meters
  y: number; // in meters
  z: number; // in meters
}

export interface MapConfig {
  width: number;
  height: number;
  resolution: number;
  origin: MapOrigin;
  free_th: number;
  occ_th: number;
}

export interface ProjectInfo {
  project_id: string;
  map_origin_offset_x: number; // in mm
  map_origin_offset_y: number; // in mm
  map_origin_offset_theta: number; // in degrees
  navi_type: number;
}

export interface TrafficSitePoint {
  x: number; // in mm
  y: number; // in mm
}

export interface TrafficSite {
  code: number;
  name: string;
  point: TrafficSitePoint;
  type: number;
  collision?: number;
  full_collision?: number;
  rotate_enable?: boolean;
  rotation_speed?: number;
  stop_dir?: number;
  ban_dir?: number;
  allow_avoid?: boolean;
  allow_close_fork_foot_photoelectric?: boolean;
  allow_sync?: boolean;
  device_code?: string;
  fork_rotate_flag?: boolean;
  func_type?: number;
  height_limit?: number;
  local_site_use_type?: number;
  material?: number;
  pallet_collision?: any[];
  remark?: string;
  transmit_point?: number;
  [key: string]: any;
}

export interface TrafficCollision {
  back?: number;
  forward?: number;
  left?: number;
  right?: number;
  rotate?: number;
}

export interface TrafficLine {
  code: number;
  name: string;
  sites: [number, number];
  type: number;
  speed?: number;
  full_speed?: number;
  allow_back?: boolean;
  allow_close_fork_foot_photoelectric?: boolean;
  allow_obstacle_avoid?: boolean;
  body_dir?: number;
  goods_dir?: number;
  path_dir?: number;
  path_length?: number;
  navigation_type?: number;
  obstacle_avoid_type?: number;
  obstacle_avoid_dis_threshold?: number;
  omni_body_dir?: number;
  collision?: TrafficCollision;
  full_collision?: TrafficCollision;
  fork_height_limit?: { highest: number; lowest: number };
  curve_control_points?: Array<TrafficSitePoint>;
  remark?: string;
  reposition_path?: any[];
  reposition_sites?: any[];
  [key: string]: any;
}

export interface TrafficZone {
  id: string;
  name: string;
  type: 'keep_out' | 'speed_limit' | 'loading' | string;
  speed_limit?: number;
  points: Array<TrafficSitePoint>;
  color?: string;
}

export interface TrafficMapInfo {
  name: string;
  project_id: string;
  map_name: string;
  width?: number;
  height?: number;
  site_size?: { x: number; y: number };
  site_zoom?: number;
  camera?: {
    x: number;
    y: number;
    zoom: number;
    rotate_angle: number;
    camera_name?: string;
  };
  [key: string]: any;
}

export interface TrafficMap {
  filename?: string;
  map_info: TrafficMapInfo;
  sites: TrafficSite[];
  lines: TrafficLine[];
  zones: TrafficZone[];
}

export interface LoadedProject {
  id: string;
  mapConfig: MapConfig;
  projectInfo: ProjectInfo;
  trafficMaps: Record<string, TrafficMap>; // map filename -> TrafficMap
  selectedTrafficMapKey: string;
  imageCanvas: HTMLCanvasElement | null;
}

export interface RosYamlMap {
  image: string;
  resolution: number;
  origin: [number, number, number];
  negate: number;
  occupied_thresh: number;
  free_thresh: number;
}

export interface VdaAction {
  actionType: string;
  actionId: string;
  actionDescription?: string;
  actionParameters?: Array<{ key: string; value: string | number | boolean }>;
}

export interface VdaNode {
  nodeId: string;
  sequenceId: number;
  released: boolean;
  actions: VdaAction[];
  nodePosition?: {
    x: number;
    y: number;
    theta?: number;
    mapId: string;
  };
}

export interface VdaEdge {
  edgeId: string;
  sequenceId: number;
  released: boolean;
  startNodeId: string;
  endNodeId: string;
  actions: VdaAction[];
  maxSpeed?: number;
}

export interface VdaOrderPayload {
  headerId: number;
  timestamp: string;
  version: string;
  manufacturer: string;
  serialNumber: string;
  orderId: string;
  orderUpdateId: number;
  nodes: VdaNode[];
  edges: VdaEdge[];
}

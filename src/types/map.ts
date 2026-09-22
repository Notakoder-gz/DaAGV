export interface MapOrigin {
  x: number; // in meters
  y: number; // in meters
  z: number; // in meters
}

export interface MapConfig {
  width: number; // pixels
  height: number; // pixels
  resolution: number; // meters per pixel
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
  allow_avoid?: boolean;
  remark?: string;
  [key: string]: any;
}

export interface TrafficLine {
  code: number;
  name: string;
  sites: [number, number]; // [start_site_code, end_site_code]
  type: number;
  speed?: number;
  full_speed?: number;
  allow_back?: boolean;
  curve_control_points?: Array<TrafficSitePoint>;
  remark?: string;
  [key: string]: any;
}

export interface TrafficZone {
  id: string;
  name: string;
  type: 'keep_out' | 'speed_limit' | 'loading' | string;
  speed_limit?: number;
  points: Array<TrafficSitePoint>; // in mm
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
  map_info: TrafficMapInfo;
  sites: TrafficSite[];
  lines: TrafficLine[];
  zones: TrafficZone[];
}

export interface RosYamlMap {
  image: string;
  resolution: number;
  origin: [number, number, number]; // [x_m, y_m, theta_rad]
  negate: number;
  occupied_thresh: number;
  free_thresh: number;
}

export interface ProjectDataset {
  id: string;
  mapConfig: MapConfig;
  projectInfo: ProjectInfo;
  trafficMap: TrafficMap;
  imageCanvas?: HTMLCanvasElement;
  imageSrc?: string;
}

import { MapConfig, ProjectInfo, TrafficSitePoint } from '../types/map';

export class CoordinateTransform {
  /**
   * Convert pixel coordinates (px, py) on base image to SLAM world meters (wx, wy)
   */
  static pixelToWorld(
    px: number,
    py: number,
    mapConfig: MapConfig
  ): { x: number; y: number } {
    const { resolution, height, origin } = mapConfig;
    const wx = origin.x + px * resolution;
    const wy = origin.y + (height - py) * resolution;
    return { x: wx, y: wy };
  }

  /**
   * Convert SLAM world meters (wx, wy) to pixel coordinates (px, py) on base image
   */
  static worldToPixel(
    wx: number,
    wy: number,
    mapConfig: MapConfig
  ): { x: number; y: number } {
    const { resolution, height, origin } = mapConfig;
    const px = (wx - origin.x) / resolution;
    const py = height - (wy - origin.y) / resolution;
    return { x: px, y: py };
  }

  /**
   * Convert traffic map coordinates (mm) to SLAM world meters (m)
   */
  static trafficToWorld(point: TrafficSitePoint): { x: number; y: number } {
    return {
      x: point.x / 1000.0,
      y: point.y / 1000.0,
    };
  }

  /**
   * Convert SLAM world meters (m) to traffic map coordinates (mm)
   */
  static worldToTraffic(wx: number, wy: number): TrafficSitePoint {
    return {
      x: Math.round(wx * 1000.0),
      y: Math.round(wy * 1000.0),
    };
  }

  /**
   * Apply project offset (offset_x, offset_y in mm, offset_theta in degrees)
   */
  static applyOffsetToWorld(
    wx: number,
    wy: number,
    projectInfo: ProjectInfo
  ): { x: number; y: number } {
    const offsetX = projectInfo.map_origin_offset_x / 1000.0;
    const offsetY = projectInfo.map_origin_offset_y / 1000.0;
    const thetaRad = (projectInfo.map_origin_offset_theta * Math.PI) / 180.0;

    const rx = wx * Math.cos(thetaRad) - wy * Math.sin(thetaRad);
    const ry = wx * Math.sin(thetaRad) + wy * Math.cos(thetaRad);

    return {
      x: rx + offsetX,
      y: ry + offsetY,
    };
  }

  /**
   * Inverse offset transformation
   */
  static removeOffsetFromWorld(
    tx: number,
    ty: number,
    projectInfo: ProjectInfo
  ): { x: number; y: number } {
    const offsetX = projectInfo.map_origin_offset_x / 1000.0;
    const offsetY = projectInfo.map_origin_offset_y / 1000.0;
    const thetaRad = (projectInfo.map_origin_offset_theta * Math.PI) / 180.0;

    const dx = tx - offsetX;
    const dy = ty - offsetY;

    const wx = dx * Math.cos(-thetaRad) - dy * Math.sin(-thetaRad);
    const wy = dx * Math.sin(-thetaRad) + dy * Math.cos(-thetaRad);

    return { x: wx, y: wy };
  }
}

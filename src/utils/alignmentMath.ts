import { MapConfig, ProjectInfo, RosYamlMap } from '../types/map';

export interface AlignmentTransformParams {
  deltaX_mm: number;
  deltaY_mm: number;
  deltaTheta_deg: number;
}

export class AlignmentMath {
  /**
   * Recalculates `project_info.json` origin offsets when the base map is visually translated or rotated under traffic graph.
   */
  static updateProjectOffset(
    currentInfo: ProjectInfo,
    params: AlignmentTransformParams
  ): ProjectInfo {
    const newX = currentInfo.map_origin_offset_x + params.deltaX_mm;
    const newY = currentInfo.map_origin_offset_y + params.deltaY_mm;
    let newTheta = (currentInfo.map_origin_offset_theta + params.deltaTheta_deg) % 360;
    if (newTheta < 0) newTheta += 360;

    return {
      ...currentInfo,
      map_origin_offset_x: Math.round(newX),
      map_origin_offset_y: Math.round(newY),
      map_origin_offset_theta: parseFloat(newTheta.toFixed(4)),
    };
  }

  /**
   * Recalculates SLAM world origin parameters in `map.json` and standard ROS `.yaml`
   * when base map raster is scaled or transformed.
   */
  static updateMapOrigin(
    currentConfig: MapConfig,
    deltaOriginX_m: number,
    deltaOriginY_m: number,
    scaleFactor: number = 1.0
  ): MapConfig {
    const newResolution = currentConfig.resolution * scaleFactor;
    const newOriginX = currentConfig.origin.x + deltaOriginX_m;
    const newOriginY = currentConfig.origin.y + deltaOriginY_m;

    return {
      ...currentConfig,
      resolution: parseFloat(newResolution.toFixed(6)),
      origin: {
        ...currentConfig.origin,
        x: parseFloat(newOriginX.toFixed(6)),
        y: parseFloat(newOriginY.toFixed(6)),
      },
    };
  }

  /**
   * Generates matching ROS YAML origin from SLAM world origin
   */
  static generateRosOrigin(mapConfig: MapConfig, projectInfo: ProjectInfo): RosYamlMap {
    const thetaRad = (projectInfo.map_origin_offset_theta * Math.PI) / 180.0;
    return {
      image: 'new_map.png',
      resolution: mapConfig.resolution,
      origin: [mapConfig.origin.x, mapConfig.origin.y, parseFloat(thetaRad.toFixed(6))],
      negate: 0,
      occupied_thresh: mapConfig.occ_th,
      free_thresh: mapConfig.free_th,
    };
  }
}

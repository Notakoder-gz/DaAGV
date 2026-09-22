import { MapConfig, ProjectInfo, TrafficMap, RosYamlMap } from '../types/map';

export class MapSerializer {
  static parseMapJson(jsonString: string): MapConfig {
    const data = JSON.parse(jsonString);
    return {
      width: data.width || 1000,
      height: data.height || 1000,
      resolution: data.resolution || 0.05,
      origin: {
        x: data.origin?.x ?? 0,
        y: data.origin?.y ?? 0,
        z: data.origin?.z ?? 0,
      },
      free_th: data.free_th ?? 0.196,
      occ_th: data.occ_th ?? 0.65,
    };
  }

  static serializeMapJson(config: MapConfig): string {
    return JSON.stringify(
      {
        free_th: config.free_th,
        height: config.height,
        occ_th: config.occ_th,
        origin: {
          x: config.origin.x,
          y: config.origin.y,
          z: config.origin.z,
        },
        resolution: config.resolution,
        width: config.width,
      },
      null,
      2
    );
  }

  static parseProjectInfo(jsonString: string): ProjectInfo {
    const data = JSON.parse(jsonString);
    return {
      project_id: data.project_id || 'default_project',
      map_origin_offset_x: data.map_origin_offset_x ?? 0,
      map_origin_offset_y: data.map_origin_offset_y ?? 0,
      map_origin_offset_theta: data.map_origin_offset_theta ?? 0,
      navi_type: data.navi_type ?? 1,
    };
  }

  static serializeProjectInfo(info: ProjectInfo): string {
    return JSON.stringify(
      {
        map_origin_offset_theta: info.map_origin_offset_theta,
        map_origin_offset_x: info.map_origin_offset_x,
        map_origin_offset_y: info.map_origin_offset_y,
        navi_type: info.navi_type,
        project_id: info.project_id,
      },
      null,
      4
    );
  }

  static parseTrafficMap(jsonString: string): TrafficMap {
    const data = JSON.parse(jsonString);
    return {
      map_info: data.map_info || {
        name: 'DEMO',
        project_id: 'default',
        map_name: 'default@DEMO',
      },
      sites: Array.isArray(data.sites) ? data.sites : [],
      lines: Array.isArray(data.lines) ? data.lines : [],
      zones: Array.isArray(data.zones) ? data.zones : [],
    };
  }

  static serializeTrafficMap(trafficMap: TrafficMap): string {
    return JSON.stringify(
      {
        lines: trafficMap.lines,
        map_info: trafficMap.map_info,
        sites: trafficMap.sites,
        zones: trafficMap.zones || [],
      },
      null,
      2
    );
  }

  static parseRosYaml(yamlString: string): RosYamlMap {
    const lines = yamlString.split('\n');
    const result: any = {
      image: 'map.png',
      resolution: 0.05,
      origin: [0, 0, 0],
      negate: 0,
      occupied_thresh: 0.65,
      free_thresh: 0.196,
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const parts = trimmed.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        if (key === 'image') {
          result.image = value.replace(/['"]/g, '');
        } else if (key === 'resolution') {
          result.resolution = parseFloat(value);
        } else if (key === 'origin') {
          const match = value.match(/\[\s*([^,]+),\s*([^,]+),\s*([^\]]+)\s*\]/);
          if (match) {
            result.origin = [
              parseFloat(match[1]),
              parseFloat(match[2]),
              parseFloat(match[3]),
            ];
          }
        } else if (key === 'negate') {
          result.negate = parseInt(value, 10);
        } else if (key === 'occupied_thresh') {
          result.occupied_thresh = parseFloat(value);
        } else if (key === 'free_thresh') {
          result.free_thresh = parseFloat(value);
        }
      }
    }

    return result as RosYamlMap;
  }

  static serializeRosYaml(rosYaml: RosYamlMap): string {
    return `image: ${rosYaml.image}
resolution: ${rosYaml.resolution}
origin: [${rosYaml.origin[0]}, ${rosYaml.origin[1]}, ${rosYaml.origin[2]}]
negate: ${rosYaml.negate}
occupied_thresh: ${rosYaml.occupied_thresh}
free_thresh: ${rosYaml.free_thresh}
`;
  }
}

import { describe, it, expect } from 'vitest';
import { CoordinateTransform } from '../src/utils/coordinateTransform';
import { MapSerializer } from '../src/utils/mapSerializer';
import { MapConfig, ProjectInfo, TrafficSitePoint } from '../src/types/map';

describe('MapSerializer', () => {
  it('should correctly parse and serialize map.json', () => {
    const rawJson = `{
      "free_th": 0.196,
      "height": 1166,
      "occ_th": 0.65,
      "origin": {
        "x": -49.54825751000485,
        "y": -51.03416764280329,
        "z": 0.0
      },
      "resolution": 0.05,
      "width": 2167
    }`;

    const parsed = MapSerializer.parseMapJson(rawJson);
    expect(parsed.width).toBe(2167);
    expect(parsed.height).toBe(1166);
    expect(parsed.resolution).toBe(0.05);
    expect(parsed.origin.x).toBeCloseTo(-49.548, 3);

    const serialized = MapSerializer.parseMapJson(MapSerializer.serializeMapJson(parsed));
    expect(serialized).toEqual(parsed);
  });

  it('should parse and serialize project_info.json', () => {
    const rawInfo = `{
      "map_origin_offset_theta": 357.055,
      "map_origin_offset_x": -3922,
      "map_origin_offset_y": -1773,
      "navi_type": 1,
      "project_id": "perekresto"
    }`;

    const parsed = MapSerializer.parseProjectInfo(rawInfo);
    expect(parsed.project_id).toBe('perekresto');
    expect(parsed.map_origin_offset_x).toBe(-3922);
    expect(parsed.map_origin_offset_y).toBe(-1773);
    expect(parsed.map_origin_offset_theta).toBe(357.055);
  });

  it('should parse and serialize ROS yaml', () => {
    const rawYaml = `image: map.png
resolution: 0.050000
origin: [-49.548258, -51.034168, 0.000000]
negate: 0
occupied_thresh: 0.65
free_thresh: 0.196`;

    const parsed = MapSerializer.parseRosYaml(rawYaml);
    expect(parsed.image).toBe('map.png');
    expect(parsed.resolution).toBe(0.05);
    expect(parsed.origin[0]).toBeCloseTo(-49.548258, 5);
  });
});

describe('CoordinateTransform', () => {
  const mapConfig: MapConfig = {
    width: 2000,
    height: 1000,
    resolution: 0.05,
    origin: { x: -50, y: -25, z: 0 },
    free_th: 0.196,
    occ_th: 0.65,
  };

  it('should accurately convert pixel to world and back', () => {
    const px = 400;
    const py = 300;

    const world = CoordinateTransform.pixelToWorld(px, py, mapConfig);
    expect(world.x).toBeCloseTo(-30, 4);
    expect(world.y).toBeCloseTo(10, 4);

    const pixel = CoordinateTransform.worldToPixel(world.x, world.y, mapConfig);
    expect(pixel.x).toBeCloseTo(px, 4);
    expect(pixel.y).toBeCloseTo(py, 4);
  });

  it('should accurately convert traffic (mm) to world (m) and back', () => {
    const trafficPt: TrafficSitePoint = { x: 36340, y: -1666 };
    const world = CoordinateTransform.trafficToWorld(trafficPt);

    expect(world.x).toBe(36.34);
    expect(world.y).toBe(-1.666);

    const back = CoordinateTransform.worldToTraffic(world.x, world.y);
    expect(back.x).toBe(trafficPt.x);
    expect(back.y).toBe(trafficPt.y);
  });
});

import { describe, it, expect } from 'vitest';
import { AlignmentMath } from '../src/utils/alignmentMath';
import { ProjectInfo, MapConfig } from '../src/types/map';

describe('AlignmentMath', () => {
  it('should update project_info offset x, y, theta correctly', () => {
    const initialInfo: ProjectInfo = {
      project_id: 'perekresto',
      map_origin_offset_x: -3922,
      map_origin_offset_y: -1773,
      map_origin_offset_theta: 357.055,
      navi_type: 1,
    };

    const updated = AlignmentMath.updateProjectOffset(initialInfo, {
      deltaX_mm: 100,
      deltaY_mm: -50,
      deltaTheta_deg: 5.0,
    });

    expect(updated.map_origin_offset_x).toBe(-3822);
    expect(updated.map_origin_offset_y).toBe(-1823);
    expect(updated.map_origin_offset_theta).toBeCloseTo(2.055, 3);
  });

  it('should generate ROS origin with accurate theta in radians', () => {
    const mapConfig: MapConfig = {
      width: 2000,
      height: 1000,
      resolution: 0.05,
      origin: { x: -49.5, y: -51.0, z: 0 },
      free_th: 0.196,
      occ_th: 0.65,
    };

    const projInfo: ProjectInfo = {
      project_id: 'test',
      map_origin_offset_x: 0,
      map_origin_offset_y: 0,
      map_origin_offset_theta: 180.0,
      navi_type: 1,
    };

    const rosYaml = AlignmentMath.generateRosOrigin(mapConfig, projInfo);
    expect(rosYaml.origin[0]).toBe(-49.5);
    expect(rosYaml.origin[1]).toBe(-51.0);
    expect(rosYaml.origin[2]).toBeCloseTo(Math.PI, 4);
  });
});

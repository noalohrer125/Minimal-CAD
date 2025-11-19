import { Injectable } from '@angular/core';
import * as THREE from 'three';

@Injectable({
  providedIn: 'root'
})
export class StlService {

  fmt(n: number) { return n.toFixed(6); }

  geometryToASCIIStl(geom: THREE.BufferGeometry): string {
    // ensure triangles (no index)
    const g = geom.index ? geom.toNonIndexed() : geom.clone();
    const pos = g.getAttribute('position');
    let out = '';
    for (let i = 0; i < pos.count; i += 3) {
      const ax = pos.getX(i), ay = pos.getY(i), az = pos.getZ(i);
      const bx = pos.getX(i + 1), by = pos.getY(i + 1), bz = pos.getZ(i + 1);
      const cx = pos.getX(i + 2), cy = pos.getY(i + 2), cz = pos.getZ(i + 2);

      // compute normal = (b-a) x (c-a)
      const ux = bx - ax, uy = by - ay, uz = bz - az;
      const vx = cx - ax, vy = cy - ay, vz = cz - az;
      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;

      out += `  facet normal ${this.fmt(nx)} ${this.fmt(ny)} ${this.fmt(nz)}\n`;
      out += `    outer loop\n`;
      out += `      vertex ${this.fmt(ax)} ${this.fmt(ay)} ${this.fmt(az)}\n`;
      out += `      vertex ${this.fmt(bx)} ${this.fmt(by)} ${this.fmt(bz)}\n`;
      out += `      vertex ${this.fmt(cx)} ${this.fmt(cy)} ${this.fmt(cz)}\n`;
      out += `    endloop\n`;
      out += `  endfacet\n`;
    }
    return out;
  }

  /**
   * Parses a JSON-string in your format and triggers download of an ASCII STL.
   * - units: input positions/sizes assumed in cm -> exported in mm (multiplied by 10)
   * - supported types: "Square" (box), "Circle" (cylinder)
   */
  downloadStlFromJsonString(jsonString: string, filename = 'model.stl') {
    const arr = JSON.parse(jsonString);
    let body = '';
    for (const obj of arr) {
      let geom: THREE.BufferGeometry | null = null;

      if (obj.type === 'Square') {
        // Three.BoxGeometry(width, height, depth) where depth corresponds to l
        const w = (obj.w ?? 1) * 10; // cm -> mm
        const h = (obj.h ?? 1) * 10;
        const l = (obj.l ?? 1) * 10;
        geom = new THREE.BoxGeometry(w, h, l);
        // BoxGeometry centers on origin; we want corner-origin as earlier examples?
        // The previous implementation treated position as translation of whole mesh.
      } else if (obj.type === 'Circle') {
        const r = (obj.r ?? 1) * 10;
        const h = (obj.h ?? 1) * 10;
        geom = new THREE.CylinderGeometry(r, r, h, obj.curveSegments ?? 64);
      } else {
        continue; // unsupported type
      }

      // apply rotation (degrees -> radians) and translation (cm->mm)
      const mesh = new THREE.Mesh(geom);
      const rx = THREE.MathUtils.degToRad((obj.rotation?.[0] ?? 0));
      const ry = THREE.MathUtils.degToRad((obj.rotation?.[1] ?? 0));
      const rz = THREE.MathUtils.degToRad((obj.rotation?.[2] ?? 0));
      mesh.rotation.set(rx, ry, rz);

      const px = (obj.position?.[0] ?? 0) * 10;
      const py = (obj.position?.[1] ?? 0) * 10;
      const pz = (obj.position?.[2] ?? 0) * 10;
      mesh.position.set(px, py, pz);

      mesh.updateMatrix();
      geom.applyMatrix4(mesh.matrix);

      // ensure non-indexed and valid triangles inside geometryToASCIIStl
      body += this.geometryToASCIIStl(geom);
    }

    const headerName = 'exported_model';
    const stl = `solid ${headerName}\n` + body + `endsolid ${headerName}\n`;

    const blob = new Blob([stl], { type: 'application/sla' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

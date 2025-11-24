import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class StlService {
  constructor(private http: HttpClient) {}

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
   * - supported types: "Square" (box), "Circle" (cylinder), "Freeform" (extruded shape)
   */
  downloadStlFromJsonString(jsonString: string, filename = 'model.stl', saveToServer = false): void {
    const arr = JSON.parse(jsonString);
    let body = '';
    for (const obj of arr) {
      let geom: THREE.BufferGeometry | null = null;

      if (obj.type === 'Square') {
        const l = (obj.l ?? 1) * 10; // X-width (cm -> mm)
        const w = (obj.w ?? 1) * 10; // Y-depth (cm -> mm)
        const h = (obj.h ?? 1) * 10; // Z-height (cm -> mm)
        geom = new THREE.BoxGeometry(l, w, h);
      } else if (obj.type === 'Circle') {
        const r = (obj.r ?? 1) * 10;
        const h = (obj.h ?? 1) * 10;
        geom = new THREE.CylinderGeometry(r, r, h, obj.curveSegments ?? 200);
      } else if (obj.type === 'Freeform') {
        // Build shape from commands
        const shape = new THREE.Shape();
        shape.autoClose = true;
        let lastX = 0, lastY = 0;

        for (const cmd of obj.commands || []) {
          switch (cmd.type) {
            case 'moveTo':
              shape.moveTo(cmd.x * 10, cmd.y * 10); // cm -> mm
              lastX = cmd.x; lastY = cmd.y;
              break;
            case 'lineTo':
              shape.lineTo(cmd.x * 10, cmd.y * 10); // cm -> mm
              lastX = cmd.x; lastY = cmd.y;
              break;
            case 'quadraticCurveTo':
              // Convert control point to THREE.js format
              const P0 = new THREE.Vector2(lastX, lastY);
              const P1 = new THREE.Vector2(cmd.cpX, cmd.cpY);
              const P2 = new THREE.Vector2(cmd.x, cmd.y);
              const C = new THREE.Vector2(
                2 * P1.x - 0.5 * (P0.x + P2.x),
                2 * P1.y - 0.5 * (P0.y + P2.y)
              );
              shape.quadraticCurveTo(C.x * 10, C.y * 10, P2.x * 10, P2.y * 10); // cm -> mm
              lastX = cmd.x; lastY = cmd.y;
              break;
          }
        }

        const h_mm = (obj.h ?? 1) * 10;
        const extrudeSettings = {
          curveSegments: 1000,
          depth: h_mm,
          bevelEnabled: false
        };
        geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      } else {
        continue; // unsupported type
      }

      // apply rotation and translation to match editor rendering
      const mesh = new THREE.Mesh(geom);
      
      // Apply rotation
      if (obj.type === 'Circle') {
        const rx = THREE.MathUtils.degToRad((obj.rotation?.[0] ?? 0) - 90);
        const ry = THREE.MathUtils.degToRad((obj.rotation?.[1] ?? 0));
        const rz = THREE.MathUtils.degToRad((obj.rotation?.[2] ?? 0));
        mesh.rotation.set(rx, ry, rz);
      } else {
        const rx = THREE.MathUtils.degToRad((obj.rotation?.[0] ?? 0));
        const ry = THREE.MathUtils.degToRad((obj.rotation?.[1] ?? 0));
        const rz = THREE.MathUtils.degToRad((obj.rotation?.[2] ?? 0));
        mesh.rotation.set(rx, ry, rz);
      }

      // Apply position
      const px = (obj.position?.[0] ?? 0) * 10;
      const py = (obj.position?.[1] ?? 0) * 10;
      let pz = (obj.position?.[2] ?? 0) * 10;
      
      // For Box and Cylinder geometries, add h/2 Z-offset (they're centered, but positioned at base)
      // For Freeform (ExtrudeGeometry), no offset needed as extrusion already starts at base
      if (obj.type === 'Square' || obj.type === 'Circle') {
        const h_mm = (obj.h ?? 1) * 10;
        pz += h_mm / 2;
      }
      
      mesh.position.set(px, py, pz);

      mesh.updateMatrix();
      geom.applyMatrix4(mesh.matrix);

      // ensure non-indexed and valid triangles inside geometryToASCIIStl
      body += this.geometryToASCIIStl(geom);
    }

    const headerName = 'exported_model';
    const stl = `solid ${headerName}\n` + body + `endsolid ${headerName}\n`;

    if (saveToServer) {
      try {
        const blob = new Blob([stl], { type: 'application/sla' });
        const formData = new FormData();
        formData.append('file', blob, 'model.stl');

        this.http.post('http://localhost:5000/uploadStlToServer', formData).subscribe({
          next: (response) => {
            console.log('STL uploaded to server:', response);
          },
          error: (error) => {
            console.error('Error uploading STL to server:', error);
            alert('Fehler beim Hochladen der STL-Datei zum Server.');
          }
        });
      } catch (error) {
        console.error('Error preparing STL upload:', error);
        alert('Fehler beim Vorbereiten der STL-Datei.');
      }
    } else {
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
}

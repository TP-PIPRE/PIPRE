import * as THREE from "three";

export class GhostPreview {
  private scene: THREE.Scene;
  private ghosts: THREE.Mesh[] = [];
  private lines: THREE.Line[] = [];
  private markers: THREE.Mesh[] = [];
  private arcGroup: THREE.Group | null = null;
  private active = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  showPath(waypoints: Array<{ x: number; z: number; y?: number }>): void {
    this.clear();

    if (waypoints.length < 2) return;

    const ghostMat = new THREE.MeshBasicMaterial({
      color: "#00f5d4",
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });

    // Create ghost markers at each waypoint
    for (let i = 1; i < waypoints.length; i++) {
      const wp = waypoints[i];
      const ringGeo = new THREE.RingGeometry(0.6, 0.7, 24);
      const ring = new THREE.Mesh(ringGeo, ghostMat.clone());
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(wp.x, wp.y ?? 0.05, wp.z);
      ring.name = "ghost_marker";
      this.scene.add(ring);
      this.markers.push(ring);

      // Dot at center
      const dotGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const dot = new THREE.Mesh(dotGeo, ghostMat.clone());
      dot.material = new THREE.MeshBasicMaterial({
        color: "#00f5d4",
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      });
      dot.position.copy(ring.position);
      this.scene.add(dot);
      this.markers.push(dot);
    }

    // Create ghost robot outline at final position (simplified box)
    const lastWp = waypoints[waypoints.length - 1];
    const outlineGeo = new THREE.BoxGeometry(2.2, 1.0, 3.0);
    const outlineEdges = new THREE.EdgesGeometry(outlineGeo);
    const outlineLine = new THREE.LineSegments(
      outlineEdges,
      new THREE.LineBasicMaterial({
        color: "#00f5d4",
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      })
    );
    outlineLine.position.set(lastWp.x, (lastWp.y ?? 0) + 0.5, lastWp.z);
    this.scene.add(outlineLine);
    this.ghosts.push(outlineLine as unknown as THREE.Mesh);

    // Draw dotted lines connecting waypoints
    const points: THREE.Vector3[] = waypoints.map(
      (wp) => new THREE.Vector3(wp.x, wp.y ?? 0.3, wp.z)
    );
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineDashedMaterial({
      color: "#00f5d4",
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      dashSize: 0.5,
      gapSize: 0.3,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    line.computeLineDistances();
    this.scene.add(line);
    this.lines.push(line);

    this.active = true;
  }

  showRotationArc(position: THREE.Vector3, startAngle: number, degrees: number): void {
    this.clear();

    const radius = 2.5;
    const startRad = startAngle;
    const endRad = startRad + (degrees * Math.PI) / 180;
    const steps = 32;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = startRad + (endRad - startRad) * t;
      points.push(
        new THREE.Vector3(
          position.x + Math.cos(angle) * radius,
          0.3,
          position.z + Math.sin(angle) * radius
        )
      );
    }

    const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
    const arcMat = new THREE.LineBasicMaterial({
      color: "#818cf8",
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const arc = new THREE.Line(arcGeo, arcMat);
    this.scene.add(arc);
    this.lines.push(arc);

    // Arrow at the end
    const arrowGeo = new THREE.ConeGeometry(0.2, 0.5, 8);
    const arrow = new THREE.Mesh(
      arrowGeo,
      new THREE.MeshBasicMaterial({
        color: "#818cf8",
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      })
    );
    const endPoint = points[points.length - 1];
    const prevPoint = points[points.length - 2];
    arrow.position.copy(endPoint);
    arrow.position.y += 0.5;
    arrow.lookAt(
      new THREE.Vector3(
        endPoint.x + (endPoint.x - prevPoint.x),
        0.5,
        endPoint.z + (endPoint.z - prevPoint.z)
      )
    );
    arrow.rotateX(Math.PI / 2);
    this.scene.add(arrow);
    this.markers.push(arrow);

    this.active = true;
  }

  showSingleMarker(x: number, z: number, color: string = "#00f5d4"): void {
    this.clear();

    const ringGeo = new THREE.RingGeometry(0.8, 0.9, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.05, z);
    this.scene.add(ring);
    this.markers.push(ring);

    // Pulse dot
    const dotGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(x, 0.8, z);
    this.scene.add(dot);
    this.markers.push(dot);

    this.active = true;
  }

  animate(time: number): void {
    if (!this.active) return;

    // Pulse ghost markers
    this.markers.forEach((m, i) => {
      if (m.geometry.type === "RingGeometry" || m.geometry.type === "SphereGeometry") {
        const s = 0.9 + Math.sin(time * 3 + i) * 0.1;
        m.scale.setScalar(s);
      }
    });

    // Ghost robot pulse
    this.ghosts.forEach((g) => {
      const mat = g.material as THREE.Material;
      if ("opacity" in mat) {
        mat.opacity = 0.25 + Math.sin(time * 2) * 0.1;
      }
    });
  }

  clear(): void {
    this.active = false;

    this.ghosts.forEach((g) => {
      this.scene.remove(g);
      g.geometry?.dispose();
      if (Array.isArray(g.material)) {
        g.material.forEach((m) => m.dispose());
      } else {
        (g.material as THREE.Material)?.dispose();
      }
    });
    this.ghosts = [];

    this.lines.forEach((l) => {
      this.scene.remove(l);
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });
    this.lines = [];

    this.markers.forEach((m) => {
      this.scene.remove(m);
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
    this.markers = [];

    if (this.arcGroup) {
      this.scene.remove(this.arcGroup);
      this.arcGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      this.arcGroup = null;
    }
  }

  dispose(): void {
    this.clear();
  }
}

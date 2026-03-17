import Phaser from 'phaser';
import type { RoadRow, RoadType, LanePositions } from './constants';
import { OBSTACLE_SIZE_RATIO } from './constants';

const OBSTACLE_KEYS = ['building1', 'building2', 'building3', 'building4', 'building5', 'building6'];
const EMPTY = '__empty__';
const LANES: RoadType[] = ['top', 'mid', 'bottom'];

export class Road {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private laneY: LanePositions;
  private laneH: number;
  private tileW: number;

  rows: RoadRow[] = [];
  startX = 0;
  private straightRemaining = 0;
  private recentObstacles: string[] = [];

  constructor(scene: Phaser.Scene, laneY: LanePositions, laneH: number, tileW: number) {
    this.scene = scene;
    this.laneY = laneY;
    this.laneH = laneH;
    this.tileW = tileW;
    this.container = scene.add.container(0, 0).setDepth(5);
  }

  getContainer() {
    return this.container;
  }

  generateInitial(playerScreenX: number) {
    this.startX = playerScreenX;
    this.straightRemaining = 1;
    this.addRow('mid', this.startX);

    for (let i = 0; i < 25; i++) {
      this.addNextRow();
    }
  }

  addNextRow() {
    const last = this.rows[this.rows.length - 1];
    const nextX = last.x + this.tileW;
    const nextType = this.pickNextRoadType(last.type);
    this.addRow(nextType, nextX);
  }

  cleanupOldRows(currentRowIdx: number): number {
    while (currentRowIdx > 10) {
      const old = this.rows.shift()!;
      old.tiles.forEach(t => t.destroy());
      old.decoration?.destroy();
      currentRowIdx--;
    }
    return currentRowIdx;
  }

  private addRow(type: RoadType, x: number) {
    const prev = this.rows.length > 0 ? this.rows[this.rows.length - 1] : null;
    const isTurn = prev !== null && prev.type !== type;
    const row: RoadRow = { type, x, isTurn, tiles: [] };

    // bg-tiles on all 3 lanes first
    for (const lane of LANES) {
      const bg = this.createTile(x, this.laneY[lane], 'tile-bg');
      row.tiles.push(bg);
      this.container.add(bg);
    }

    if (isTurn) {
      const prevLane = prev!.type;
      const goingDown = LANES.indexOf(type) > LANES.indexOf(prevLane);

      // Departing lane: LEFT→BOTTOM (corner-tr) or LEFT→TOP (corner-br)
      const departKey = goingDown ? 'tile-corner-tr' : 'tile-corner-br';
      const dept = this.createTile(x, this.laneY[prevLane], departKey);
      row.tiles.push(dept);
      this.container.add(dept);

      // Arriving lane: TOP→RIGHT (corner-bl) or BOTTOM→RIGHT (corner-tl)
      const arriveKey = goingDown ? 'tile-corner-bl' : 'tile-corner-tl';
      const arr = this.createTile(x, this.laneY[type], arriveKey);
      row.tiles.push(arr);
      this.container.add(arr);
    } else {
      // Straight road on active lane
      const road = this.createTile(x, this.laneY[type], 'tile-straight');
      row.tiles.push(road);
      this.container.add(road);
    }

    // Obstacles on non-road lanes (not on turns)
    if (!isTurn) {
      const nonRoadLanes = LANES.filter(l => l !== type);
      const candidates = OBSTACLE_KEYS.filter(k => !this.recentObstacles.includes(k));

      if (this.straightRemaining >= 1 && !this.recentObstacles.includes(EMPTY)) {
        candidates.push(EMPTY, EMPTY);
      }

      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      if (pick === EMPTY) {
        this.recentObstacles.push(EMPTY);
      } else {
        const obstacleLane = nonRoadLanes[Math.floor(Math.random() * nonRoadLanes.length)];
        this.placeObstacle(row, obstacleLane, x, pick);
        this.recentObstacles.push(pick);
      }
      if (this.recentObstacles.length > 2) this.recentObstacles.shift();
    }

    this.rows.push(row);
  }

  private createTile(x: number, y: number, key: string): Phaser.GameObjects.Image {
    return this.scene.add.image(x, y, key)
      .setDisplaySize(this.tileW, this.laneH)
      .setOrigin(0.5, 0.5);
  }

  private placeObstacle(row: RoadRow, lane: RoadType, x: number, key: string) {
    const size = this.laneH * OBSTACLE_SIZE_RATIO;
    const obstacle = this.scene.add.image(x, this.laneY[lane], key)
      .setDisplaySize(size, size)
      .setOrigin(0.5, 0.5)
      .setDepth(6);
    this.container.add(obstacle);
    row.decoration = this.scene.add.container(0, 0);
    row.decoration.add(obstacle);
    this.container.add(row.decoration);
  }

  private pickNextRoadType(prevType: RoadType): RoadType {
    if (this.straightRemaining > 0) {
      this.straightRemaining--;
      return prevType;
    }
    this.straightRemaining = Math.floor(Math.random() * 3);
    const idx = LANES.indexOf(prevType);
    if (idx === 0) return 'mid';       // top → mid only
    if (idx === 2) return 'mid';       // bottom → mid only
    return Math.random() < 0.5 ? 'top' : 'bottom'; // mid → top or bottom
  }
}

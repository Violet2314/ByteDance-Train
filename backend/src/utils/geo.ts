/**
 * 地理坐标点
 */
export type GeoPoint = [number, number] // [lng, lat]

/**
 * 射线投射算法：判断点是否在多边形内
 * @param point 待检测点 [lng, lat]
 * @param polygon 多边形顶点数组 [[lng, lat], ...]
 * @returns 是否在多边形内
 */
export function isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
  const [x, y] = point
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    
    const intersect = ((yi > y) !== (yj > y)) 
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    
    if (intersect) {
      inside = !inside
    }
  }

  return inside
}

/**
 * 计算两点之间的距离（Haversine 公式）
 * @param point1 起点 [lng, lat]
 * @param point2 终点 [lng, lat]
 * @returns 距离（米）
 */
export function getDistance(point1: GeoPoint, point2: GeoPoint): number {
  const [lng1, lat1] = point1
  const [lng2, lat2] = point2

  const R = 6371e3 // 地球半径（米）
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * 找到路径中与目标点最近的索引
 * @param target 目标点 [lng, lat]
 * @param path 路径点数组
 * @returns 最近点的索引
 */
export function findClosestPointIndex(target: GeoPoint, path: GeoPoint[]): number {
  let minDist = Infinity
  let closestIndex = 0

  path.forEach((point, index) => {
    const dist = getDistance(target, point)
    if (dist < minDist) {
      minDist = dist
      closestIndex = index
    }
  })

  return closestIndex
}

/**
 * 简化的欧几里得距离（用于快速近似计算）
 * @param point1 起点 [lng, lat]
 * @param point2 终点 [lng, lat]
 * @returns 距离的平方（相对值）
 */
export function getDistanceSquared(point1: GeoPoint, point2: GeoPoint): number {
  const [lng1, lat1] = point1
  const [lng2, lat2] = point2
  return Math.pow(lng2 - lng1, 2) + Math.pow(lat2 - lat1, 2)
}

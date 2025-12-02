import axios from 'axios';

const AMAP_KEY = process.env.AMAP_WEB_KEY || '372f94a059e1a8e2ac6e308c2706486c';

interface Point {
  lat: number;
  lng: number;
}

export async function getDrivingPath(origin: Point, destination: Point): Promise<Point[]> {
  try {
    // 高德地图使用 lng,lat 格式
    const originStr = `${origin.lng.toFixed(6)},${origin.lat.toFixed(6)}`;
    const destStr = `${destination.lng.toFixed(6)},${destination.lat.toFixed(6)}`;
    
    const url = `https://restapi.amap.com/v3/direction/driving?origin=${originStr}&destination=${destStr}&key=${AMAP_KEY}&strategy=0`;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AMap] Requesting driving path: ${url}`);
    }
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === '1' && data.route && data.route.paths && data.route.paths.length > 0) {
      const path = data.route.paths[0];
      const steps = path.steps;
      const points: Point[] = [];
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[AMap] Found path with distance: ${path.distance}m`);
      }

      // 解析 steps 以获取所有 polyline 点
      steps.forEach((step: any) => {
        const polyline = step.polyline; // "lng,lat;lng,lat;..."
        if (polyline) {
          const pairs = polyline.split(';');
          pairs.forEach((pair: string) => {
            const [lng, lat] = pair.split(',').map(Number);
            points.push({ lat, lng });
          });
        }
      });

      return points;
    }
    
    console.warn('AMap direction API returned no route', data);
    return [];
  } catch (error) {
    console.error('Failed to get driving path from AMap', error);
    return [];
  }
}

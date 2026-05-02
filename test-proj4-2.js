const proj4 = require('proj4');

const EPSG24047 = "+proj=utm +zone=47 +ellps=indian +units=m +no_defs";
const WGS84 = "EPSG:4326";
const coord = [ 503535.971802202926483, 2053634.787926535587758 ];

try {
  const result = proj4(EPSG24047, WGS84, [coord[0], coord[1]]);
  console.log("Result page.tsx:", result);
} catch(e) {
  console.log("Error page.tsx:", e.message);
}

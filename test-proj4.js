const proj4 = require('proj4');

const EPSG24047 = "+proj=utm +zone=47 +a=6377276.345 +b=6356075.41314024 +towgs84=206,71,-85,0,0,0,0 +units=m +no_defs";
const WGS84 = "EPSG:4326";

const WGS84_2 = "+proj=longlat +datum=WGS84 +no_defs";

const coord = [ 503535.971802202926483, 2053634.787926535587758 ];

try {
  const result = proj4(EPSG24047, WGS84_2, coord);
  console.log("Result:", result);
} catch(e) {
  console.log("Error:", e);
}

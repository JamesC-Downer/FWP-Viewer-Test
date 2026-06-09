
import fs from 'fs';

// Node 18+ has built-in fetch
const url = "https://map-auea.ramm.com/v2/mapping/settingdata/2100/efaaf999-983e-4b1f-85a7-5c1492c80481/?format=geojson&projection=wgs84&forcePoint=false";

async function run() {
    console.log("Fetching data...");

    const response = await fetch(url);
    const geojson = await response.json();

    console.log("Transforming data...");

    const transformed = {
        type: "FeatureCollection",
        features: geojson.features.map(f => {
            return {
                ...f,
                properties: {
                    renewal_id: f.properties.system_id,
                    road_name: f.properties.road_name || "Unknown",
                    // Add more fields as needed
                }
            };
        })
    };

    // Ensure folder exists
    fs.mkdirSync('data', { recursive: true });

    fs.writeFileSync(
        'data/renewals.geojson',
        JSON.stringify(transformed, null, 2)
    );

    console.log("GeoJSON updated!");
}

run();
``

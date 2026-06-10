
const fs = require('fs');

// Node 18+ has built-in fetch
const url = "https://map-auea.ramm.com/v2/mapping/settingdata/2100/efaaf999-983e-4b1f-85a7-5c1492c80481/?format=geojson&projection=wgs84&forcePoint=false";

async function run() {
    console.log("Fetching data...");

    const response = await fetch(url);
    const geojson = await response.json();

    console.log("Transforming data...");


const transformed = {
    type: "FeatureCollection",
    features: geojson.features.flatMap(f => {

        const props = f.properties;

        // ✅ Map years to labels
        const yearMap = {
            treat_y0: "25/26",
            treat_y1: "26/27",
            treat_y2: "27/28",
            treat_y3: "28/29"
        };

        // ✅ Create one feature per populated treatment year
        return Object.keys(yearMap)
            .filter(key => props[key] && props[key] !== "")
            .map(key => {

                return {
                    ...f,

                    properties: {
                        // ✅ renamed / cleaned fields
                        renewal_id: props.system_id,
                        road_name: props.road_name || "Unknown",

                        treatment: props[key],
                        programme_year: yearMap[key]

                        // 👉 add more renamed fields here if needed
                    }
                };

            });
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

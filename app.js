
mapboxgl.accessToken = 'pk.eyJ1IjoiamFtZXNjYWRvd25lciIsImEiOiJjbW1uejZzbjMwOG1iMnNva3A1dnVsZ3B1In0.PXVr6LEZejBta20KC40iyw';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [175.25, -37.78],
    zoom: 12
});

map.on('load', () => {
    
    map.addSource('roads', {
        type: 'geojson',

        // IMPORTANT: this points to your repo file
        data: './data/roads.geojson'
    });

    
    map.addSource('footpaths', {
        type: 'geojson',
        data: './data/footpaths.geojson'
    });
    
    map.addSource('swcs', {
        type: 'geojson',
        data: './data/swcs.geojson'
    });

    const layers = map.getStyle().layers;
    
    layers.forEach(layer => {
        if (
            layer.type === 'symbol' &&
            layer.id.toLowerCase().includes('cul')   // catches cul-de-sac layers
        ) {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
    });

    
    map.addLayer({
            id: 'roads-layer',
            type: 'fill',
            source: 'roads',
            paint: {
            'fill-color': [
                'match',
                ['get', 'programme_year'],
                '25/26', '#fed976',
                '26/27', '#fd8d3c',
                '27/28', '#e31a1c',
                '28/29', '#800026',
                '#000000'
            ],
                'fill-opacity': 0.5
            }
        });
    
    map.addLayer({
        id: 'footpaths-layer',
        type: 'fill',  // or 'line' depending on geometry
        source: 'footpaths',
        paint: {
            'fill-color': [
                'match',
                ['get', 'programme_year'],
                '26/27', '#e5f5e0',
                '27/28', '#a1d99b',
                '28/29', '#31a354',
                '29/30', '#006d2c',
                '#cccccc'
            ],
            'fill-opacity': 0.6
        }
    });

    map.addLayer({
        id: 'swcs-layer',
        type: 'fill',  // or 'line' depending on geometry
        source: 'swcs',
        paint: {
            'fill-color': [
                'match',
                ['get', 'programme_year'],
                '26/27', '#deebf7',
                '27/28', '#9ecae1',
                '28/29', '#3182bd',
                '29/30', '#08519c',
                '#cccccc'
            ],
            'fill-opacity': 0.6
        }
    });

    setupUI();
    
});


function setupUI() {

    console.log("Setting up UI...");

    const allCheckboxes = document.querySelectorAll('#control-panel input[type="checkbox"]');
    console.log("Checkboxes found:", allCheckboxes.length);

    // ---------- ASSET TOGGLES ----------
    allCheckboxes.forEach(cb => {

        if (!cb.classList.contains("year-filter")) {

            cb.addEventListener('change', () => {
                console.log("Toggling layer:", cb.value);

                map.setLayoutProperty(
                    cb.value,
                    'visibility',
                    cb.checked ? 'visible' : 'none'
                );
            });

        }
    });

    // ---------- YEAR FILTER ----------
    const yearCheckboxes = document.querySelectorAll('.year-filter');

    yearCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateYearFilter);
    });

}


// Add nav controls
map.addControl(new mapboxgl.NavigationControl());


// When user clicks a renewal feature



map.on('click', (e) => {

    const features = map.queryRenderedFeatures(
        [
            [e.point.x - 5, e.point.y - 5],
            [e.point.x + 5, e.point.y + 5]
        ]
    );

    console.log("Features found:", features.length);

    if (!features.length) return;

    // Filter to only your layers
    const validLayers = ['roads-layer', 'footpaths-layer', 'kerb-layer'];

    const filtered = features.filter(f => validLayers.includes(f.layer.id));

    if (!filtered.length) return;

    window.selectedFeatures = filtered;
    window.clickLngLat = e.lngLat;

    let html = `<strong>Select Feature:</strong><br><br>`;

    filtered.forEach((f, index) => {

        const assetType = f.layer.id.replace('-layer', '');
        const name = f.properties.road_name || assetType;

        html += `
            <button onclick="selectFeature(${index})" style="margin-bottom:5px;">
                ${assetType.toUpperCase()} – ${name} (${f.properties.programme_year})
            </button><br>
        `;
    });

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);

/*
    const renewalID = f.properties.renewal_id;
    const road = f.properties.road_name;   // ✅ FIXED (was road_id)
    const programme_year = f.properties.programme_year;
    const treatment = f.properties.treatment;

    const formUrl = `https://forms.office.com/Pages/ResponsePage.aspx?ID=4sZL-u3A7EOdbRRefjahpbdh-kCimPNDuvfbFYBkNKlUNVU3MFRSTlZWUzBXRjIyTUxEQkVVRUs5QS4u` +
        `&rd3642a3a26d141c6a3bb316c9dfe62ce=${encodeURIComponent(renewalID)}` +
        `&rbf50a96cf4884b49857a7ba85328cbd6=${e.lngLat.lat}` +
        `&rd4fae6caa7f0416896a745e1042e1b55=${e.lngLat.lng}`;

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
            <strong>Renewal ID:</strong> ${renewalID}<br>
            <strong>Road:</strong> ${road}<br>
            <strong>Programme Year:</strong> ${programme_year}<br>
            <strong>Treatment:</strong> ${treatment}<br>
            <button onclick="window.open('${formUrl}','_blank')">
                Add Comment
            </button>
        `)
        .addTo(map);
*/

});

function updateYearFilter() {

    const yearCheckboxes = document.querySelectorAll('.year-filter');

    const selectedYears = Array.from(yearCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    console.log("Selected years:", selectedYears);

    const layers = [
        'roads-layer',
        'footpaths-layer',
        'swcs-layer'
    ];

    layers.forEach(layer => {

        if (map.getLayer(layer)) {

            map.setFilter(layer,
                selectedYears.length
                    ? ['in', ['get', 'programme_year'], ['literal', selectedYears]]
                    : ['==', ['get', 'programme_year'], '']
            );

        }

    });
}


function selectFeature(index) {

    const f = window.selectedFeatures[index];
    const e = window.clickLngLat;

    const renewalID = f.properties.renewal_id;
    const road = f.properties.road_name;
    const programme_year = f.properties.programme_year;
    const treatment = f.properties.treatment;

    const formUrl = `https://forms.office.com/...` +
        `&rd3642a3a26d141c6a3bb316c9dfe62ce=${encodeURIComponent(renewalID)}`;

    new mapboxgl.Popup()
        .setLngLat(e)
        .setHTML(`
            <strong>Asset:</strong> ${road}<br>
            <strong>Year:</strong> ${programme_year}<br>
            <strong>Treatment:</strong> ${treatment}<br>
            <button onclick="window.open('${formUrl}','_blank')">
                Add Comment
            </button>
        `)
        .addTo(map);

}


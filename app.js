
mapboxgl.accessToken = 'pk.eyJ1IjoiamFtZXNjYWRvd25lciIsImEiOiJjbW1uejZzbjMwOG1iMnNva3A1dnVsZ3B1In0.PXVr6LEZejBta20KC40iyw';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11//'//mapbox://styles/jamescadowner/cmmnz0qle00g701speyn3avrl',
    center: [175.25, -37.78],
    zoom: 12
});

map.on('load', () => {
    
    map.addSource('renewals', {
        type: 'geojson',

        // IMPORTANT: this points to your repo file
        data: './data/renewals.geojson'
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
            id: 'renewals-layer',
            type: 'fill',
            source: 'renewals',
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
                'fill-opacity': 0.9
            }
        });

        const checkboxes = document.querySelectorAll('#filter input');
    
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateFilter);
    });
    
    function updateFilter() {
    
        const selectedYears = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
    
        if (selectedYears.length === 0) {
            // Show nothing if nothing selected
            map.setFilter('renewals-layer', ['==', ['get', 'programme_year'], '']);
            return;
        }
    
        map.setFilter('renewals-layer', [
            'in',
            ['get', 'programme_year'],
            ['literal', selectedYears]
        ]);
    }



    
});



map.on('idle', () => {

try {
        const layers = map.getStyle().layers;

        if (!layers || layers.length === 0) {
            console.log("No layers found ❌");
            return;
        }

        console.log("Layer count:", layers.length);

        layers.forEach(layer => {
            console.log(layer.id, "|", layer.type);
        });

    } catch (error) {
        console.error("Error reading layers:", error);
    }


    
});


// Add nav controls
map.addControl(new mapboxgl.NavigationControl());

// When user clicks a renewal feature

map.on('click', (e) => {

    const features = map.queryRenderedFeatures(e.point, {
        layers: ['renewals-layer']
    });

    console.log(features); // ✅ DEBUG LINE

    if (!features.length) {
        console.log("No features clicked");
        return;
    }

    const f = features[0];

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
            <strong>Planned Year:</strong> ${programme_year}<br>
            <strong>Treatment:</strong> ${treatment}<br>
            <button onclick="window.open('${formUrl}','_blank')">
                Add Comment
            </button>
        `)
        .addTo(map);


});


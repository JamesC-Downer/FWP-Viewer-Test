
mapboxgl.accessToken = 'pk.eyJ1IjoiamFtZXNjYWRvd25lciIsImEiOiJjbW1uejZzbjMwOG1iMnNva3A1dnVsZ3B1In0.PXVr6LEZejBta20KC40iyw';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jamescadowner/cmmnz0qle00g701speyn3avrl',
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
                'fill-color': '#007cbf',
                'fill-opacity': 0.6
            }
        });
});




let moved = false;

map.on('idle', () => {
    if (!moved && map.getLayer('renewals-layer')) {
        map.moveLayer('renewals-layer');
        moved = true;
    }
});


// Add nav controls
map.addControl(new mapboxgl.NavigationControl());

// When user clicks a renewal feature
map.on('click', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
        layers: ['renewals-layer']
    });

    if (!features.length) return;

    const f = features[0];
    const renewalID = f.properties.jv_id;

    // Build the Microsoft Form URL with pre-filled values
    const formUrl = `https://forms.office.com/Pages/ResponsePage.aspx?ID=4sZL-u3A7EOdbRRefjahpbdh-kCimPNDuvfbFYBkNKlUNVU3MFRSTlZWUzBXRjIyTUxEQkVVRUs5QS4u` +
        `&rd3642a3a26d141c6a3bb316c9dfe62ce=${encodeURIComponent(renewalID)}` +
        `&rbf50a96cf4884b49857a7ba85328cbd6=${e.lngLat.lat}&rd4fae6caa7f0416896a745e1042e1b55=${e.lngLat.lng}`;

    // Show a popup
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
            <strong>Renewal ID:</strong> ${renewalID}<br>
            <button onclick="window.open('${formUrl}','_blank')">
                Add Comment
            </button>
        `)
        .addTo(map);
});

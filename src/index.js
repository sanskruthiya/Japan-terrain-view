import * as maplibregl from "maplibre-gl";
import * as pmtiles from 'pmtiles';
import mlcontour from "maplibre-contour";
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

const init_center = [138.72, 35.35];
const init_zoom = 12;
const init_bearing = 0;
const init_pitch = 45;

const mountains = [
    { name: "Select a mountain...", lat: null, lng: null },
    { name: "富士山 Mt.Fuji", lat: 35.35, lng: 138.72 },
    { name: "阿蘇山 Mt.Aso", lat: 32.8985064, lng: 131.0874754 },
    { name: "槍ヶ岳 Yariga-take", lat: 36.3420332, lng: 137.6476213 },
    { name: "奥穂高岳 Okuhotaka-take", lat: 36.289167, lng: 137.648056 },
    { name: "白馬岳 Hakuba-take", lat: 36.7587181, lng: 137.7585896 },
    { name: "八ヶ岳 Yatsuga-take", lat: 35.97397, lng: 138.31987 },
    { name: "蔵王山 Mt.Zao", lat: 38.1529672, lng: 140.4458267 },
    { name: "筑波山 Mt.Tsukuba", lat: 36.2253757, lng: 140.1074925 },
    { name: "磐梯山 Mt.Bandai", lat: 37.6009417, lng: 140.0722501 },
    { name: "御嶽山 Mt.Ontake", lat: 35.8823266, lng: 137.4485337 }
];

const protocol = new pmtiles.Protocol({ metadata: true });

maplibregl.addProtocol('mapterhorn', async (params, abortController) => {
    const [z, x, y] = params.url.replace('mapterhorn://', '').split('/').map(Number);
    const name = z <= 12 ? 'planet' : `6-${x >> (z - 6)}-${y >> (z - 6)}`;
    const url = `pmtiles://https://download.mapterhorn.com/${name}.pmtiles/${z}/${x}/${y}.webp`;
    const response = await protocol.tile({ ...params, url }, abortController);
    if (response['data'] === null) throw new Error(`Tile z=${z} x=${x} y=${y} not found.`);
    return response;
});

const demSource = new mlcontour.DemSource({
    url: 'https://tiles.mapterhorn.com/{z}/{x}/{y}.webp',
    encoding: 'terrarium',
    maxzoom: 12,
    worker: true
});
demSource.setupMaplibre(maplibregl);

const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json',
    center: init_center,
    zoom: init_zoom,
    minZoom: 4,
    maxZoom: 17,
    maxPitch: 85,
    bearing: init_bearing,
    pitch: init_pitch,
    hash: true,
    attributionControl: false
});

const attCntl = new maplibregl.AttributionControl({
    customAttribution:'<a href="https://github.com/sanskruthiya/Japan-terrain-view">GitHub</a>',
    compact: true
});
map.addControl(attCntl, 'bottom-right');

map.on('load', async () => {
    map.addSource('mapterhorn-dem', {
        'type': 'raster-dem',
        //'tiles': ['mapterhorn://{z}/{x}/{y}'],//use this if you prefer PMTiles
        'url': 'https://tiles.mapterhorn.com/tilejson.json',
        'encoding': 'terrarium',
        'tileSize': 512,
        'minzoom': 5,
        'maxzoom': 14,
        'attribution': '<a href="https://mapterhorn.com/attribution">© Mapterhorn</a>',
    });
    map.addSource('mapterhorn-contour', {
        'type': 'vector',
        'tiles': [
            demSource.contourProtocolUrl({
                thresholds: {
                    12: [100, 500],
                    14: [20, 100]
                },
                elevationKey: 'ele',
                levelKey: 'level',
                contourLayer: 'contours',
                buffer: 1,
                overzoom: 2,
            })
        ],
        'maxzoom': 17
    });
    
    map.setTerrain({ 'source': 'mapterhorn-dem', 'exaggeration': 1 });

    map.addLayer({
        'id': 'mapterhorn_hillshade',
        'type': 'hillshade',
        'source': 'mapterhorn-dem',
        'paint': { 'hillshade-shadow-color': '#473B24' },
        'layout': {
            'visibility': 'visible',
        }
    });
    
    map.addLayer({
        'id': 'mapterhorn_contour',
        'type': 'line',
        'source': 'mapterhorn-contour',
        'source-layer': 'contours',
        'paint': {
            'line-color': 'rgb(215, 151, 060)',
            'line-width': ['match', ['get', 'level'], 2, 2, 1],
        },
        'layout': {
            'visibility': 'visible',
        }
    });
    map.addLayer({
        'id': 'mapterhorn_contour_text',
        'type': 'symbol',
        'source': 'mapterhorn-contour',
        'source-layer': 'contours',
        'paint': {
            'text-color': 'rgb(172, 120, 48)',
            'text-halo-color': 'white',
            'text-halo-width': 2,
        },
        'layout': {
            'symbol-placement': 'line',
            'text-size': 14,
            'text-field': ['concat', ['number-format', ['get', 'ele'], {},], 'm'],
            'text-font': ['Noto Sans Regular'],
            'visibility': 'visible',
        }
    });
    
    map.setSky({
        "sky-color": "#199EF3",
        "sky-horizon-blend": 0.7,
        "horizon-color": "#f0f8ff",
        "horizon-fog-blend": 0.8,
        "fog-color": "#2c7fb8",
        "fog-ground-blend": 0.9,
        "atmosphere-blend": ["interpolate",["linear"],["zoom"],0,1,12,0]
    });
});

map.addControl(
    new maplibregl.NavigationControl({
        visualizePitch: true
    })
);

map.addControl(
    new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true
    })
);

// Create mountain dropdown
function createMountainDropdown() {
    const dropdown = document.createElement('select');
    dropdown.id = 'mountain-dropdown';
    dropdown.className = 'mountain-selector';
    
    mountains.forEach((mountain, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = mountain.name;
        dropdown.appendChild(option);
    });
    
    dropdown.addEventListener('change', (e) => {
        const selectedIndex = parseInt(e.target.value);
        const selectedMountain = mountains[selectedIndex];
        
        if (selectedMountain.lat && selectedMountain.lng) {
            console.log(`Flying to ${selectedMountain.name}: [${selectedMountain.lng}, ${selectedMountain.lat}]`);
            map.flyTo({
                center: [selectedMountain.lng, selectedMountain.lat],
                zoom: 12,
                pitch: 45,
                bearing: 0,
                duration: 5000
            });
        }
    });
    
    document.body.appendChild(dropdown);
}

// Initialize dropdown after map loads
map.on('load', () => {
    createMountainDropdown();
});

const PROTOCOL = "http://";

const ROUTES_API_FULL_URL = "api/szlaki-piesze.json" //musiałem pobrać lokalnie ze względu na CORP serwera API, docelowo można to zrobić dynamicznie


let tileLayer = new L.TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { // wstępna konfiguracja mapy
  attribution: '&copy; <a href="/copyright">autorzy OpenStreetMap</a>'
});

let map = new L.Map('map', { // wstępna konfiguracja mapy c.d.
  'layers': [tileLayer],
  zoomControl: false
});

new L.Control.Zoom({ position: 'bottomright' }).addTo(map);



let routeLayer = { // obiekt, który odpowiada za wszystkie operacje na warstwie szlaków 
  routesApiUrl: ROUTES_API_FULL_URL,

  routeIconsJson: false,

  routesJson: false,

  routeIcons: [],

  routes: new L.FeatureGroup(),

  getRoutesList: async function () { // pobiera json z danymi szlaków
    const response = await fetch(this.routesApiUrl);
    const data = await response.json();
    this.routesJson = data;
    console.log(this.routesJson);
  },

  makeLayer: function () { // pobiera dane pojedynych szlaków i dodaje wysyła je do .makeRoute()
    let obj = this.routesJson;
    t = this;
    Object.keys(obj).forEach(function (key) {

      // console.log(key, obj[key]); // TODO obsługa błędów w api
      let gpx = obj[key].object_gpx;
      let name = obj[key].object_name;
      let color = obj[key].object_hex;
      let link = obj[key].object_url;
      let img = obj[key].object_image;
      let distance = obj[key].object_distance;
      t.makeRoute(gpx, name, color, img, link, distance, img)

    });
  },

  makeRoute: function (gpx, name, color, img, link, distance, img) { //tworzy pojedyncze szlaki i dodaje je do grupy
    let t = this;
    let singleroute = new L.GPX(gpx, {
      async: true,
      marker_options: {
        startIconUrl: null,
        endIconUrl: null,
        shadowUrl: null
      },
      polyline_options: {
        color: color,
        opacity: 0.75,
        weight: 5,
        lineCap: 'round',
        dashArray: '15, 15',
        dashOffset: '0'
      }
    }).on('loaded', function (e) {
      var gpx = e.target;
      map.fitBounds(routeLayer.routes.getBounds()) //wyrównanie mapy do widok wczytanego szlaku
    }).on('error', function (e) {
      console.log('Error loading file: ' + e.err);
    });

    let routeHtml = ''; //treść popup
    if (img !== null) {
      routeHtml += '<img class="leaflet-popup--img" src="' + PROTOCOL + img + '"><br>';
    }
    routeHtml += '<p class="leaflet-popup--header">' + name + '</p>';

    routeHtml += '<span class="leaflet-popup--desc">Długość: ' + distance + 'km</span><br>';
    routeHtml += (link) ? '<p class="leaflet-popup--button"><a class="btn_infobox" target="_parent" href="' + PROTOCOL + link + '">Szczegóły</a></p>' : '';
    singleroute.bindPopup(routeHtml, {
      maxWidth: 200
    });
    this.routes.addLayer(singleroute);
  }
}


async function drawRouteLayer() { // wykonanie wszystkich kroków składających mapę po kolei
  await routeLayer.getRoutesList();
  await routeLayer.makeLayer();
  await routeLayer.routes.addTo(map);
}

drawRouteLayer()
var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });

var projection = ol.proj.get('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(20);
var matrixIds = new Array(20);
for (var z = 0; z < 20; ++z) {
    // generate resolutions and matrixIds arrays for this WMTS
    resolutions[z] = size / Math.pow(2, z);
    matrixIds[z] = z;
}
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');

closer.onclick = function() {
  popup.setPosition(undefined);
  closer.blur();
  return false;
};

var popup = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  }
});

var nlscMatrixIds = new Array(21);
for (var i=0; i<21; ++i) {
  nlscMatrixIds[i] = i;
}

var styleLines = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(86,113,228,0.7)',
      width: 8
  })
});

var stylePoints = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 10,
    fill: new ol.style.Fill({
      color: [215, 48, 39, 0.7]
    })
  }),
  text: new ol.style.Text({
    font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
    fill: new ol.style.Fill({
      color: 'blue'
    })
  })
});

var styleWalk = new ol.style.Style({
  stroke: new ol.style.Stroke({
      color: 'rgba(82,184,48,0.7)',
      width: 8
  }),
  image: new ol.style.Circle({
    radius: 10,
    fill: new ol.style.Fill({
      color: 'rgba(82,184,48,0.7)',
    })
  }),
});

var vectorLines = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'lines.json',
    format: new ol.format.GeoJSON()
  }),
  style:styleLines
});

var vectorPoints = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'points.json',
    format: new ol.format.GeoJSON()
  }),
  style: function(f) {
    var fStyle = stylePoints.clone();
    fStyle.getText().setText(f.get('stop'));
    return fStyle;
  }
});

var vectorWalk = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'walk.json',
    format: new ol.format.GeoJSON()
  }),
  style:styleWalk
});

var baseLayer = new ol.layer.Tile({
    source: new ol.source.WMTS({
        matrixSet: 'EPSG:3857',
        format: 'image/png',
        url: 'https://wmts.nlsc.gov.tw/wmts',
        layer: 'EMAP',
        tileGrid: new ol.tilegrid.WMTS({
            origin: ol.extent.getTopLeft(projectionExtent),
            resolutions: resolutions,
            matrixIds: matrixIds
        }),
        style: 'default',
        wrapX: true,
        attributions: '<a href="https://maps.nlsc.gov.tw/" target="_blank">國土測繪圖資服務雲</a>'
    }),
    opacity: 0.5
});

var target = new ol.Feature({
  stop: '島上正好有草市集',
  img: 'map.jpg',
  geometry: new ol.geom.Point(ol.proj.fromLonLat([120.20619571208957, 22.994718412447156]))
});

var targetLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: [target]
  }),
  style: new ol.style.Style({
    image: new ol.style.Circle({
      radius: 20,
      fill: new ol.style.Fill({
        color: [39, 60, 143, 0.7]
      })
    }),
    text: new ol.style.Text({
      text: '島上正好有草市集',
      font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
      fill: new ol.style.Fill({
        color: [215, 48, 39, 0.7]
      })
    })
  })
});

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.20345985889435, 22.994906062625773]),
  zoom: 17
});

var map = new ol.Map({
  layers: [baseLayer, vectorLines, vectorPoints, vectorWalk, targetLayer],
  overlays: [popup],
  target: 'map',
  view: appView
});

map.addControl(sidebar);

var geolocation = new ol.Geolocation({
  projection: appView.getProjection()
});

geolocation.setTracking(true);

geolocation.on('error', function(error) {
        console.log(error.message);
      });

var positionFeature = new ol.Feature();

positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

geolocation.on('change:position', function() {
  var coordinates = geolocation.getPosition();
  if(coordinates) {
    positionFeature.setGeometry(new ol.geom.Point(coordinates));
  }
});

new ol.layer.Vector({
  map: map,
  source: new ol.source.Vector({
    features: [positionFeature]
  })
});

map.on('singleclick', function(evt) {
  map.getView().setZoom(17);
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    var p = feature.getProperties();
    if(p['stop']) {
      var message = '';
      if(p.img) {
        message += '<img src="img/' + p.img + '" style="width: 400px;" />';
      }      
      message += '<h3>' + p.stop + '</h3>';
      var fCenter = feature.getGeometry().getCoordinates();
      $('#sidebar-main-block').html(message);
      sidebar.open('home');
      map.getView().setCenter(fCenter);
    }
  });
});

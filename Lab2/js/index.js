var myMap,
    placemarkArray,
    circle,
    myPosition,
    currentCoordinates,
    currentPositionBtn = false,
    visibleCircle = false;

ymaps.ready(init);

function Placemark(id, latitude, longitude, balloonContent, visibility) {
  this.type = 'placemark';
  this.id = id;
  this.latitude = latitude;
  this.longitude = longitude;
  this.balloonContent = balloonContent;
  this.draggable = true;
  this.isVisible = visibility;

  this.CreateYandexPlacemark = function (addHtml) {
    var placemark = new ymaps.Placemark([this.latitude, this.longitude],
      { name: this.id,
        balloonContent: this.balloonContent },
      { draggable: this.draggable,
        visible: this.isVisible });

    if (addHtml) {
      this.addHtmlElements(this.balloonContent, this.isVisible);
    }

    return placemark;
  }

  this.editPlacemark = function(newText) {
    this.balloonContent = newText;
    placemarkArray.loadToMap();
  }

  this.deletePlacemark = function(index) {
    placemarkArray.m_array.splice(index, 1);
    placemarkArray.loadToMap();
  }

  this.addHtmlElements = function(text, visibility) {
    var buttonDlt = document.createElement('button');
    buttonDlt.innerHTML = "Удалить метку";
    buttonDlt.className = "btn btn-primary form-control";
    buttonDlt.onclick = function() {
      console.log("пытаемся удалить маркер");
      var lat = latitude;
      var lon = longitude;
      placemarkArray.m_array.forEach(function(item, i) {
        if (lat == item.latitude && lon == item.longitude) {
          console.log("удаляем маркер");
          item.deletePlacemark(i);
        }
      });
    };

    var buttonEdt = document.createElement('button');
    buttonEdt.innerHTML = "Сохранить редактирование";
    buttonEdt.className = "btn btn-primary form-control";
    buttonEdt.onclick = function() {
      console.log("пытаемся переименовать маркер");
      var lat = latitude;
      var lon = longitude;
      placemarkArray.m_array.forEach(function(item, i) {
        if (lat == item.latitude && lon == item.longitude) {
          console.log("переименовываем маркер");
          console.log(i);
          var newText = document.getElementById('description' + item.id).innerHTML;
          item.editPlacemark(newText);
        }
      });
    };

    var buttonVsbl = document.createElement('button');
    buttonVsbl.innerHTML = visibility ? "Скрыть" : "Показать";
    buttonVsbl.className = "btn btn-primary form-control";
    buttonVsbl.onclick = function() {
      var visible;
      var lat = latitude;
      var lon = longitude;
      placemarkArray.m_array.forEach(function(item, i) {
        if (lat == item.latitude && lon == item.longitude) {
          visible = item.isVisible;
          item.isVisible = !visible;
        }
      });

      var text = visible ? "Показать" : "Скрыть" ;
      buttonVsbl.innerHTML = text;
      console.log("пытаемся " + text + " маркер");
      placemarkArray.geoObjectsCollection.each(function(point) {
        var coords = point.geometry.getCoordinates();
        if (lat == coords[0] && lon == coords[1]) {
          if (visible) {
            point.options.set('visible', false);
          } else {
            point.options.set('visible', true);
          }
        }
      });
    };

    var editField = document.createElement('span');
    console.log(id);
    editField.innerHTML = '<span contenteditable = "true" id="description' + this.id + '">' + text + '</span>';
    var section = document.createElement('section');
    section.appendChild(editField);
    section.appendChild(buttonEdt);
    section.appendChild(buttonVsbl);
    section.appendChild(buttonDlt);
    var listTest = document.getElementById('placemarkList');
    listTest.appendChild(section);
  }

  this.setVisibility = function(visible) {
    placemarkArray.geoObjectsCollection.each(function(point, i) {
      var coords = point.geometry.getCoordinates();
      if (latitude == coords[0] && longitude == coords[1]) {
        if (visible) {
          placemarkArray.m_array[i].isVisible = true;
          point.options.set('visible', true);
        } else {
          placemarkArray.m_array[i].isVisible = false;
          point.options.set('visible', false);
        }
      }
    });
  }
}

function CurrentPosition() {
  this.type = 'position';
  this.geoCurrentPosition = null;

  this.addCurrentPositionToMap = function() {
    var geoObject = null;
    ymaps.geolocation.get({
      provider: 'yandex',
      mapStateAutoApply: true
      }).then(function (result) {
        saveInstance(result);
      });
  }
}

function saveInstance(result) {
  myPosition.geoCurrentPosition = result.geoObjects;
  myMap.geoObjects.add(myPosition.geoCurrentPosition);
}

function Circle(latitude, longitude, radius, visibility) {
  this.type = 'circle';
  this.latitude = latitude;
  this.longitude = longitude;
  this.radius = radius;
  this.isVisible = visibility;
  this.draggable = false;
  this.geoCircle = null;

  this.addCircleToMap = function() {
    this.geoCircle = new ymaps.Circle([[this.latitude, this.longitude], this.radius], null, { draggable: this.draggable });
    myMap.geoObjects.add(this.geoCircle);
  }

  this.displayRadius = function() {
    placemarkArray.m_array.forEach(function(item, i) {
      var coords = item.CreateYandexPlacemark(false).geometry.getCoordinates();
      if (!isRaduisMoreThanDistance(latitude, longitude, radius, coords[0], coords[1])) {
        item.setVisibility(false);
        //console.log(JSON.stringify(item));
      }
    });
  }
}

function PlacemarkArray() {
  this.m_array = [];
  this.geoObjectsCollection = new ymaps.GeoObjectCollection();

  this.getElementByCondition = function(predicat) {
    for (var i = 0; i < this.m_array.length; ++i) {
      if (predicat(currentCoordinates[0], currentCoordinates[1],
         this.m_array[i].latitude, this.m_array[i].longitude)) {
           return this.m_array[i];
         }
    }
  }

  this.getIndex = function(predicat) {
    for (var i = 0; i < this.m_array.length; ++i) {
      if (predicat(currentCoordinates[0], currentCoordinates[1],
         this.m_array[i].latitude, this.m_array[i].longitude)) {
           return i;
         }
    }
  }

  this.addPlacemark = function(placemark) {
    console.log("добавили метку " + placemark.balloonContent);
    this.m_array.push(placemark);
    this.loadToMap();
  }

  this.loadToMap = function() {
    $("#placemarkList").empty();
    this.geoObjectsCollection.removeAll();
    for (var i = 0; i < this.m_array.length; ++i) {
        this.geoObjectsCollection.add(this.m_array[i].CreateYandexPlacemark(true), i);
    }
    myMap.geoObjects.add(this.geoObjectsCollection);
  }

  this.hidePlacemarks = function() {
    this.geoObjectsCollection.removeAll();
  }

  this.showPlacemarks = function() {
    this.loadToMap();
  }

  this.saveToLocalStorage = function() {
    localStorage.clear();

    this.m_array.forEach(function(item, i) {
      var data = JSON.stringify(item);
      //console.log(data);
      localStorage.setItem(item.id + '', data);
    });

    var indexToSave = 0;
    if (circle) {
      var data = JSON.stringify(circle, ["type", "latitude", "longitude", "radius", "isVisible", "draggable"]);
      //console.log(data);
      localStorage.setItem(this.m_array.length, data);
      indexToSave = this.m_array.length + 1;
    }

    if (myPosition) {
      //console.log(indexToSave);
      var data = JSON.stringify(myPosition, ["type"]);
      //console.log(data);
      localStorage.setItem(indexToSave, data);
    }
  }

  this.loadFromStorage = function() {
    var storageLength = localStorage.length;
    console.log("Считано данных из памяти: " + storageLength);
    for (var i = 0; i < storageLength; ++i) {
      var data = JSON.parse(localStorage.getItem(i + ''));
      if (data) {
        if (data.type == "circle") {
          visibleCircle = true;
          circle = new Circle(data.latitude, data.longitude, data.radius, true);
          circle.addCircleToMap();
          circle.displayRadius();
        } else {
          if (data.type == "position") {
            currentPositionBtn = true;
            myPosition = new CurrentPosition();
            myPosition.addCurrentPositionToMap();
          } else {
            if (data.type == "placemark") {
              this.m_array.push(new Placemark(
                i, data.latitude, data.longitude, data.balloonContent, data.isVisible));
            }
          }
        }
      }
    }
    placemarkArray.loadToMap();
  }

  this.addHtmlElements = function() {
    $("#placemarkList").empty();
    this.m_array.forEach(function(item, i) {
      item.addHtmlElements(item.balloonContent, item.isVisible);
    });
  }
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI)/180;
}

function isRaduisMoreThanDistance(lat0, lon0, r, lat1, lon1) {
  lat0 = degreesToRadians(lat0);
  lon0 = degreesToRadians(lon0);
  lat1 = degreesToRadians(lat1);
  lon1 = degreesToRadians(lon1);

  // console.log("distance");
  // console.log(Math.round(6378137 * Math.acos(Math.cos(lat0) * Math.cos(lat1) *
  //   Math.cos(lon0 - lon1) + Math.sin(lat0) * Math.sin(lat1))));
  return r >= Math.round(6378137 * Math.acos(Math.cos(lat0) * Math.cos(lat1) *
    Math.cos(lon0 - lon1) + Math.sin(lat0) * Math.sin(lat1)));
}

function currentPosition() {
  if (currentPositionBtn) {
    currentPositionBtn = false;
    myMap.geoObjects.remove(myPosition.geoCurrentPosition);
    myPosition = null;
  } else {
    currentPositionBtn = true;
    myPosition = new CurrentPosition();
    myPosition.addCurrentPositionToMap();
  }
}

function displayPLacemarksInArea() {
  if (visibleCircle) {
    visibleCircle = !visibleCircle;
    myMap.geoObjects.remove(circle.geoCircle);
    circle = null;

    placemarkArray.m_array.forEach(function(item) {
      item.setVisibility(true);
    });
    placemarkArray.addHtmlElements();
  } else {
    var radius = $('.radius').val();

    ymaps.geolocation.get().then(function (result) {
      currentPosition = result.geoObjects.position;
      circle = new Circle(currentPosition[0], currentPosition[1], radius, true);
      circle.addCircleToMap();
      visibleCircle = !visibleCircle;
      circle.displayRadius();
      placemarkArray.addHtmlElements();
    });
  }
}

function isSameCoords(currentLatitude, currentLongitude, latitude, longitude) {
  return (currentLatitude == latitude) && (currentLongitude == longitude);
}

function init() {
  myMap = new ymaps.Map("map", {
      center: [56.63091232, 47.89073766],
      zoom: 17
  }, {
    searchControlProvider: 'yandex#search'
  });

  placemarkArray = new PlacemarkArray();
  placemarkArray.loadFromStorage();

  myMap.events.add("click", function(e) {
    var coords = e.get('coords');
    console.log("координаты");
    console.log(coords[0], coords[1]);

    ymaps.geocode(coords).then(function (res) {
      var firstGeoObject = res.geoObjects.get(0);
      var id = placemarkArray.m_array.length ? placemarkArray.m_array[placemarkArray.m_array.length-1].id+1 : 0;
      if (id) {
        console.log("Индекс маркера: " + placemarkArray.m_array[length-1].id+1);
      }
      placemarkArray.addPlacemark(new Placemark(id, coords[0], coords[1],
        firstGeoObject.properties.get('name'), true));
    });
  });
}

window.onload = function() {
  var holder = document.getElementById('map');
  holder.ondrop = function (e) {
    var file = e.dataTransfer.files[0];
    var fileExtension = file.name.split('.').pop();
    //console.log(file.name.split('.').pop());
    if (fileExtension != "json") {
      alert("Недопустимый тип файла. Перетащите Json файл.");
      return;
    }
    var list,
        reader;
    if (file) {
      var tempList = [],
          isOnMap = false;
      console.log("Есть ссылка на файл");
      reader = new FileReader();
      reader.onload = function (evt) {
        list = JSON.parse(evt.target.result);
        list.forEach(function(item, i){
          var id = placemarkArray.m_array.length ? placemarkArray.m_array[placemarkArray.m_array.length-1].id+1 : 0;
          var placemark = new Placemark(id,
             item.coordinates.latitude, item.coordinates.longitude, item.name, item.isVisible);

          placemarkArray.m_array.forEach(function(item, i) {
            if (isSameCoords(placemark.latitude, placemark.longitude, item.latitude, item.longitude)) {
              isOnMap = true;
              console.log("такая метка уже есть");
            }
          });
          if (!isOnMap) {
            tempList.push(placemark);
            placemarkArray.addPlacemark(placemark);
          }
          isOnMap = false;
        });
        placemarkArray.showPlacemarks();
      }
      reader.readAsText(file);
      return false;
    }
  };

  holder.ondragend = function () {
      return false;
  };

  holder.ondragover = function () {
      return false;
  };

  holder.ondragleave = function() {
    return false;
  };
}

window.onunload = function() {
    placemarkArray.saveToLocalStorage();
}

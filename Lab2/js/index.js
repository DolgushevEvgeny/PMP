var myMap,
    placemarkArray,
    currentCoordinates,
    currentPositionBtn = false,
    visibleCircle = false;

ymaps.ready(init);

function Placemark(id, latitude, longitude, balloonContent) {
  this.id = id;
  this.latitude = latitude;
  this.longitude = longitude;
  this.balloonContent = balloonContent;
  this.draggable = true;
  this.isVisible = true;

  this.CreateYandexPlacemark = function () {
    var placemark = new ymaps.Placemark([this.latitude, this.longitude],
      { name: this.id,
        balloonContent: this.balloonContent },
      { draggable: this.draggable});

    this.addHtmlElements(this.balloonContent);
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

  this.addHtmlElements = function(text) {
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
    buttonVsbl.innerHTML = "Скрыть";
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
        this.geoObjectsCollection.add(this.m_array[i].CreateYandexPlacemark(), i);
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
      console.log(data);
      localStorage.setItem(item.id + '', data);
    });
  }

  this.loadFromStorage = function() {
    var storageLength = localStorage.length;
    console.log("Считано данных из памяти: " + storageLength);
    for (var i = 0; i < storageLength; ++i) {
      var data = JSON.parse(localStorage.getItem(i + ''));
      console.log(data.id);
      this.m_array.push(new Placemark(
        i, data.latitude, data.longitude, data.balloonContent));
    }
    placemarkArray.loadToMap();
  }

  this.addHtmlElements = function() {
    $("#placemarkList").empty();
    this.m_array.forEach(function(item, i) {
      var $section = item.addHtmlElements(item.balloonContent);
      $section.appendTo($(".placemarkList"));
    });
  }

  this.displayRadius = function(radius) {
    var currentPosition,
        myCircle;

    if (visibleCircle) {
      visibleCircle = !visibleCircle;
      myMap.geoObjects.removeAll();
      placemarkArray.loadToMap();
    } else {
      visibleCircle = !visibleCircle;
      ymaps.geolocation.get().then(function (result) {
        currentPosition = result.geoObjects.position;
        myCircle = new ymaps.Circle([currentPosition, radius], null, { draggable: false });
        myMap.geoObjects.add(myCircle);
        placemarkArray.hidePlacemarks();
        for (var i = 0; i < placemarkArray.m_array.length; ++i) {
          var coords = placemarkArray.m_array[i].CreateYandexPlacemark().geometry.getCoordinates();
          if (isRaduisMoreThanDistance(currentPosition[0], currentPosition[1], radius, coords[0], coords[1])) {
            myMap.geoObjects.add(placemarkArray.m_array[i].CreateYandexPlacemark());
          }
        }
      });
    }
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

function closePlacemarkDescription() {
  var placemark = placemarkArray.getElementByCondition(isSameCoords);
  placemark.closePlacemarkDescription();
}

function currentPosition() {
  currentPositionBtn = true;
  ymaps.geolocation.get({
    // Выставляем опцию для определения положения по ip
    provider: 'yandex',
    // Карта автоматически отцентрируется по положению пользователя.
    mapStateAutoApply: true
  }).then(function (result) {
      myMap.geoObjects.add(result.geoObjects);
  });
}

function ternarHide() {
  console.log("скрыли маркеры");
  placemarkArray.hidePlacemarks();
  return !isVisible;
}

function ternarShow() {
  console.log("показали маркеры");
  placemarkArray.showPlacemarks();
  return !isVisible;
}

function displayPLacemarksInArea() {
  var radius = $('.radius').val();
  console.log(radius);
  placemarkArray.displayRadius(radius);
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
        firstGeoObject.properties.get('name')));
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
      var tempList = [];
      console.log("Есть ссылка на файл");
      reader = new FileReader();
      reader.onload = function (evt) {
        list = JSON.parse(evt.target.result);
        list.forEach(function(item, i){
          var placemark = new Placemark(placemarkArray.m_array[placemarkArray.m_array.length-1].id+1,
             item.coordinates.latitude, item.coordinates.longitude, item.name);
          tempList.push(placemark);
          placemarkArray.addPlacemark(placemark);
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

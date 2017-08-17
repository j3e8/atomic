var $atomic = {}; // the user-facing object
var $$atomic = {}; // the internal object



// public
$atomic.app = function(config) {
  $$atomic.config = config;
  $$atomic.parseFHTML(document.body, $$atomic.componentTree);
  console.log($$atomic.componentTree);
  $$atomic.loadComponents();
}



// private
$$atomic.componentTree = {
  // root component
  id: '_root',
  children: null
};

$$atomic.addChildToComponent = function(component, childComponent) {
  if (!component.children) {
    component.children = [];
  }
  component.children.push(childComponent);
}

$$atomic.buildListOfComponentsToLoad = function(component, list) {
  if (component.id != '_root' && !component.isLoaded) {
    var path = component.path || $$atomic.config.defaultComponentEndpoint;
    if (!path) {
      throw new Exception("No default component endpoint provided.");
    }
    if (!list[path]) {
      list[path] = [];
    }
    list[path].push(component.id);
  }
  if (component.children) {
    for (var i=0; i < component.children.length; i++) {
      $$atomic.buildListOfComponentsToLoad(component.children[i], list);
    }
  }
  return list;
}

$$atomic.createComponent = function(data) {
  return data;
}

$$atomic.http = {};
$$atomic.http.get = function(url) {
  return $$atomic.http.request('GET', url);
}
$$atomic.http.delete = function(url) {
  return $$atomic.http.request('DELETE', url);
}
$$atomic.http.post = function(url, data) {
  return $$atomic.http.request('POST', url, data);
}
$$atomic.http.put = function(url, data) {
  return $$atomic.http.request('PUT', url, data);
}

$$atomic.http.request = function(method, url, data) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        resolve({
          status: xhr.status,
          data: xhr.responseText
        });
      }
    }
    xhr.open(method, url, true);
    var postBody = data ? JSON.stringify(data) : null;
    xhr.send(postBody);
  });
}

$$atomic.loadComponents = function() {
  var componentList = {};
  $$atomic.buildListOfComponentsToLoad($$atomic.componentTree, componentList);
  for (var path in componentList) {
    var ids = componentList[path].join('|');
    $$atomic.http.get(path + '?ids=' + ids)
    .then(function(response) {
      return $$atomic.parseComponentResponse(response.data);
    });
  }
}

$$atomic.parseFHTML = function(element, component) {
  if (element.nodeType != Node.ELEMENT_NODE) {
    return;
  }

  var tagName = element.tagName.toLowerCase();
  var newComponent = null;

  if (tagNames.indexOf(tagName) == -1) {
    var componentId = tagName.replace(/[^a-z0-9]/gi);
    newComponent = $$atomic.createComponent({
      id: componentId
    });
    $$atomic.addChildToComponent(component, newComponent);
  }

  if (element.childNodes) {
    for (var i=0; i < element.childNodes.length; i++) {
      $$atomic.parseFHTML(element.childNodes[i], newComponent || component);
    }
  }
}

$$atomic.parseComponentResponse = function(str) {
  var components = [];
  var componentDelimiter = '--component--';
  var fileDelimiter = '--file--';
  var contentDelimiter = '--content--';
  var firstComponentPos = str.indexOf(componentDelimiter) + componentDelimiter.length;
  var componentStrings = str.substring(firstComponentPos).split(componentDelimiter);
  componentStrings.forEach(function(cstr) {
    var parts = cstr.split(fileDelimiter);
    var component = JSON.parse(parts[0]);
    var fileStrings = parts.slice(1);
    fileStrings.forEach(function(fstr) {
      var fileParts = fstr.split(contentDelimiter);
      var fileInfo = JSON.parse(fileParts[0]);
      var fileContent = fileParts[1];
      component[fileInfo.type] = fileContent;
    });
    components.push(component);
  });
  console.log(components);
}

var tagNames = [
  'body',
  'div',
  'footer',
  'header',
  'main',
  'section',
  'span'
];

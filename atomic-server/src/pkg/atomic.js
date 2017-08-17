let fs = require('fs');
let atomic = {};

atomic.get = function(ids, basePath) {
  return findComponentsInDirectoryTree(ids, basePath)
  .then((components) => {
    console.log('FINAL (top level)', components);
    return buildComponentPayload(components);
  });
}

function findComponentsInDirectoryTree(ids, path) {
  let components = [];
  return fsreaddir(path)
  .then((files) => filterFolders(path, files))
  .then((folders) => {
    console.log('folders', folders);
    components = folders.filter((f) => ids.indexOf(f.id) > -1);
    return findComponentsInSubfolders(ids, folders);
  })
  .then((subcomponents) => {
    components = components.concat(subcomponents);
    return Promise.resolve(components);
  });
}

function findComponentsInSubfolders(ids, folders) {
  let iter = folders.entries();
  let subcomponents = [];
  return iterateSubfolders(ids, iter, subcomponents);
}

function iterateSubfolders(ids, iter, subcomponents) {
  let iteration = iter.next();
  if (iteration.done) {
    return Promise.resolve(subcomponents);
  }
  let index = iteration.value[0];
  let subfolder = iteration.value[1];
  return findComponentsInDirectoryTree(ids, subfolder.path)
  .then((components) => {
    subcomponents = subcomponents.concat(components);
    return iterateSubfolders(ids, iter, subcomponents);
  });
}

function filterFolders(path, files) {
  let folders = [];
  let iter = files.entries();
  return iterateFilterFolders(iter, path, folders);
}

function iterateFilterFolders(iter, path, folders) {
  let iteration = iter.next();
  if (iteration.done) {
    return Promise.resolve(folders);
  }
  let index = iteration.value[0];
  let componentId = iteration.value[1];
  let filename = `${path}/${componentId}`;
  return fsstat(filename)
  .then((stats) => {
    if (stats.isDirectory()) {
      folders.push({
        id: componentId,
        path: filename
      });
    }
    return iterateFilterFolders(iter, path, folders);
  });
}

function buildComponentPayload(components) {
  let iter = components.entries();
  return iterateBuildComponents(iter, '');
}

function iterateBuildComponents(iter, output) {
  let componentDelimiter = "\n--component--\n";

  let iteration = iter.next();
  if (iteration.done) {
    return Promise.resolve(output);
  }
  let index = iteration.value[0];
  let component = iteration.value[1];
  return buildComponent(component)
  .then((componentOutput) => {
    output += componentDelimiter;
    output += componentOutput;
    return iterateBuildComponents(iter, output);
  });
}

function buildComponent(component) {
  let fileDelimiter = "\n--file--\n";
  let contentDelimiter = "\n--content--\n";
  let output = JSON.stringify({
    "id": component.id
  });
  let files;
  return fsreaddir(component.path)
  .then((f) => {
    files = f;
    return filterFilesByExtension(files, 'js')
    .then((filteredFiles) => concatenateFiles(component.path, filteredFiles));
  })
  .then((js) => {
    if (js) {
      output += fileDelimiter;
      output += JSON.stringify({
        "type": "js"
      });
      output += contentDelimiter;
      output += js;
    }
    return filterFilesByExtension(files, 'html')
    .then((filteredFiles) => concatenateFiles(component.path, filteredFiles));
  })
  .then((html) => {
    if (html) {
      output += fileDelimiter;
      output += JSON.stringify({
        "type": "html"
      });
      output += contentDelimiter;
      output += html;
    }
    return filterFilesByExtension(files, 'css')
    .then((filteredFiles) => concatenateFiles(component.path, filteredFiles));
  })
  .then((css) => {
    if (css) {
      output += fileDelimiter;
      output += JSON.stringify({
        "type": "css"
      });
      output += contentDelimiter;
      output += css;
    }
    return output;
  });
}

function filterFilesByExtension(files, extension) {
  let ext = extension.toLowerCase();
  let filteredFiles = files.filter((f) => {
    return f.substring(f.lastIndexOf('.') + 1).toLowerCase() == ext;
  });
  return Promise.resolve(filteredFiles);
}

function concatenateFiles(path, files) {
  let iter = files.entries();
  let output = '';
  return iterateConcatenateFiles(iter, path, output);
}

function iterateConcatenateFiles(iter, path, output) {
  let iteration = iter.next();
  if (iteration.done) {
    return Promise.resolve(output);
  }
  let index = iteration.value[0];
  let file = iteration.value[1];

  return fsreadfile(path + '/' + file)
  .then((contents) => {
    output += contents;
    return iterateConcatenateFiles(iter, path, output);
  });
}







function fsreaddir(path) {
  return new Promise(function(resolve, reject) {
    fs.readdir(path, (err, items) => {
      if (err) {
        return reject(err);
      }
      resolve(items);
    });
  });
}

function fsstat(path) {
  return new Promise(function(resolve, reject) {
    fs.stat(path, (err, stats) => {
      if (err) {
        return reject(err);
      }
      resolve(stats);
    });
  });
}

function fsreadfile(path) {
  return new Promise(function(resolve, reject) {
    console.log('fs readFile', path);
    fs.readFile(path, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(data);
    });
  });
}

module.exports = atomic;

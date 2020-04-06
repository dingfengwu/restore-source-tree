'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _sourceMap = require('source-map');

var _commander = require('commander');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var WEBPACK_PREFIX = 'webpack:///';
var WEBPACK_FOOTER = '/** WEBPACK FOOTER **';

var program = new _commander.Command('restore-source-tree').version('0.1.1').usage('[options] <file>').description('Restores file structure from source map').option('-o, --out-dir [dir]', 'Output directory (\'output\' by default)', 'output').option('-n, --include-node-modules', 'Include source files in node_modules').parse(process.argv);

if (program.args.length === 0) {
  program.outputHelp();
  process.exit(1);
}

var readJson = function readJson(filename) {
  try {
    return JSON.parse(_fs2.default.readFileSync(filename, 'utf8'));
  } catch (e) {
    console.error('Parsing file \'' + filename + '\' failed: ' + e.message);
    process.exit(1);
  }
};

var getSourceList = function getSourceList(smc) {
  var sources = smc.sources.filter(function (src) {
    return src.startsWith(WEBPACK_PREFIX);
  }).map(function (src) {
    return [src.replace(WEBPACK_PREFIX, ''), src];
  }).filter(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 1),
        filePath = _ref2[0];

    return !filePath.startsWith('(webpack)');
  });

  if (!program.includeNodeModules) {
    sources = sources.filter(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 1),
          filePath = _ref4[0];

      return !filePath.startsWith('~/');
    });
  }

  return sources;
};

var trimFooter = function trimFooter(str) {
  return str.substr(0, str.indexOf(WEBPACK_FOOTER)).trimRight() + '\n';
};

var saveSourceContent = function saveSourceContent(smc, filePath, src) {
  var content = smc.sourceContentFor(src);
  if (filePath.indexOf('?') > 0){
    var endPoint = filePath.indexOf('?');
    filePath = filePath.substr(0, endPoint);
  }
  var outPath = _path2.default.join(program.outDir, filePath);
  var dir = _path2.default.dirname(outPath);

  if (content.length < 2) return;

  (0, _mkdirp2.default)(dir, function (err) {
    if (err) {
      console.error('Failed creating directory', dir);
      process.exit(1);
    } else {
      _fs2.default.writeFile(outPath, content, function (err) {
        if (err) {
          console.error('Failed writing file', outPath);
          process.exit(1);
        }
      });
    }
  });
};

function processFile(filename) {
  var json = readJson(filename);

  var smc = new _sourceMap.SourceMapConsumer(json);

  var sources = getSourceList(smc);

  sources.forEach(function (_ref5) {
    var _ref6 = _slicedToArray(_ref5, 2),
        filePath = _ref6[0],
        src = _ref6[1];

    return saveSourceContent(smc, filePath, src);
  });

  console.log('Processed ' + sources.length + ' files');
}

var filename = program.args[0];

_fs2.default.access(filename, function (err) {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }

  processFile(filename);
});

var jd_meta_data = {
  eventTrigger: "ON_ARCHIVE_EXTRACTED",
  eventTriggerSettings: { isSynchronous: false },
  id: 1618303886191,
  name: "Delete junk folders and files of movie archives and import movies",
  enabled: true,
};

disablePermissionChecks();

// Delete junk folders and files for movie downloads
// Trigger: "Archive Extraction Finished"

var junkNames = ["sample", "proof"];
var accpetedTypes = ["mkv", "avi", "mp4", "srt"];

const LOG_ENABLED = false;

// Define your API endpoint and parameters
var sonarrHost = "http://localhost:8989";
var sonarrApiKey = "API-KEY";
var radarrHost = "http://localhost:7878";
var radarrApiKey = "API-KEY";

var pushUserId = "MY-JD-PUSH-USER-ID"; // If you uninstall MyJD Remote your user ID will change

var reNames = new RegExp(createRegexStr(junkNames), "i"); // junk names
var reTypes = new RegExp(createRegexStr(accpetedTypes) + "$", "i"); // legitimate file types

var browser = getBrowser();
browser.setHeader("Accept", "application/json");

var extractedFiles = archive.getExtractedFilePaths();

for (i = 0; i < extractedFiles.length; i++) {
  if (reTypes.test(extractedFiles[i].getExtension())) {
    handle_movie(extractedFiles);
    break;
  }
}

function handle_movie(allFiles) {
  var archiveFolder = archive.getExtractToFolder(); // will dynamically get the folder from 'archive info'
  var log = [];

  for (i = 0; i < allFiles.length; i++) {
    var file = allFiles[i];
    var folder = file.getParent();

    var fileName = file.getName();
    var fullPath = file.getAbsolutePath();
    var extension = file.getExtension();

    var folderName = folder.getName();

    var junkFolder = reNames.test(folderName); // name including ...
    var junkFile = reNames.test(fileName); // name including ...
    var junkType = !reTypes.test(extension); // type NOT including ...

    if (junkFolder) {
      if (folder.exists()) {
        folder.deleteRecursive();
      }
    }
    if (junkFile || junkType) {
      if (file.exists()) {
        file.delete();
      }
    }

    if (!(junkFolder || junkFile || junkType)) {
      try {
        import_file(file);
      } catch (error) {
        push_message("could not import: " + error.message);
      }
    }

    // log all files
    log.push({
      path: fullPath,
      folder: {
        name: folderName,
        junk: junkFolder,
      },
      file: {
        name: fileName,
        junk: junkFile,
      },
      type: {
        name: extension,
        junk: junkType,
      },
    });
  }

  if (LOG_ENABLED) {
    var logFilePath = getPath(archiveFolder + "/junk/");
    logFilePath.mkdirs();

    logFile = archiveFolder + "/junk/" + archive.getName() + ".json";
    if (getPath(logFile).exists()) {
      getPath(logFile).delete();
    }

    writeFile(logFile, JSON.stringify(log), true);
  }
}

/*
 @brief: create regex string according to string array
         e.g.: arr = ["sample", "proof"] -> "(sample|proof)"
*/
function createRegexStr(arr) {
  var str = "(";

  for (i = 0; i < arr.length - 1; i++) {
    str = str + arr[i] + "|";
  }
  str = str + arr[arr.length - 1] + ")";

  return str;
}

function isTvShow(name) {
  browser.setHeader("X-Api-Key", sonarrApiKey);

  var parserUrl = sonarrHost + "/api/v3/parse?title=" + name;

  parsingResult = JSON.parse(browser.getPage(parserUrl));

  return parsingResult.hasOwnProperty("series");
}

function isMovie(name) {
  browser.setHeader("X-Api-Key", radarrApiKey);

  var parserUrl = radarrHost + "/api/v3/parse?title=" + name;

  parsingResult = JSON.parse(browser.getPage(parserUrl));

  return parsingResult.hasOwnProperty("movie");
}

function import_file(path) {
  if (isTvShow(path.getName())) {
    push_message("importing tv show: " + path.getName());

    result = browser.postPage(
      sonarrHost + "/api/v3/command",
      '{"name": "DownloadEdepisodesScan","path": "' +
        path +
        '","importMode":"Move"}'
    );
  } else if (isMovie(path.getName())) {
    push_message("importing movie: " + path.getName());

    result = browser.postPage(
      radarrHost + "/api/v3/command",
      '{"name": "DownloadedMoviesScan","path": "' +
        path +
        '","importMode":"Move"}'
    );
  } else {
    parentName = path.getParent().getName();
    if (isTvShow(parentName) || isTvShow(isMovie)) {
      extension = path.getExtension();
      newFileName = parentName + "." + extension;
      push_message("renaming " + path.getName() + "to " + newFileName);
      path = path.renameName(newFileName);

      import_file(path);
    }
  }
}

function push_message(message) {
  var push = getBrowser();
  push.postPage(
    "https://myjd.link/push",
    '{"title":"MyJD","body":"' + message + '","user":"' + pushUserId + '"}'
  );
}

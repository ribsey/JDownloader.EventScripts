var jd_meta_data = {
  eventTrigger: "ON_ARCHIVE_EXTRACTED",
  eventTriggerSettings: { isSynchronous: false },
  id: 1618303886157,
  name: "Trigger Sonarr/Radarr to import file",
  enabled: true,
};

// trigger sonarr or radarr import the movie files
// Trigger 'Archive extraction finished'

disablePermissionChecks();

// Define your API endpoint and parameters
var sonarrHost = "http://localhost:8989";
var sonarrApiKey = "API-KEY";
var radarrHost = "http://localhost:7878";
var radarrApiKey = "API-KEY";

var browser = getBrowser();
browser.setHeader("Accept", "application/json");

var filePaths = archive.getExtractedFilePaths();

for (i = 0; i < filePaths.length; i++) {
  try {
    import_file(filePaths[i]);
  } catch (error) {
    alert("Error occurred: " + error.message);
  }
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
    result = browser.postPage(
      sonarrHost + "/api/v3/command",
      '{"name": "DownloadEdepisodesScan","path": "' +
        path +
        '","importMode":"Move"}'
    );
  } else if (isMovie(path.getName())) {
    result = browser.postPage(
      radarrHost + "/api/v3/command",
      '{"name": "DownloadedMoviesScan","path": "' +
        path +
        '","importMode":"Move"}'
    );
  }
}

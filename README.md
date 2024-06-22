# JDownloader.EventScripts

## Scripts included

| script name                                   | description                                                                                                                                                                  |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audio_to_mp3.js`                             | converts downloaded audio files to mp3                                                                                                                                       |
| `DeleteJunkFoldersAndFilesOfMovieArchives.js` | Checks if the extracted archive is a movie archive, removes unwanted files or directories (like `.nfo`, sample files, etc.) and tells sonarr and radarr which file to import |

## Scripts Converter

For users who use the MyJDownloader website, creating scripts can be painfull, as they are embedded in a JSON.

The `jd_event-scripter_cfg_converter.py` can read such a JSON file and store every script in a seperate file and vice versa.

### Usage

#### JSON to JS

The following script execution reads the `event_scripts.json` file and creates a javascript file for every contained script in the output directory `event_scripts`

```bash
python3 jd_event-scripter_cfg_converter.py event_scripts.json event_scripts
```

#### JS to JSON

The following script execution reads ever javascript file int the directory `event_scripts` file and creates a single JSON file called `event_scripts.json`

```bash
python3 jd_event-scripter_cfg_converter.py event_scripts event_scripts.json
```

To properly import them to the JDownloader again, the following `jd_meta_data` has to exist (the values can vary, of course) at the very beginning of each file. This sets all the from JDownloader needed attributes

```javascript
var jd_meta_data = {
  eventTrigger: "ON_ARCHIVE_EXTRACTED",
  eventTriggerSettings: { isSynchronous: false },
  id: 1618303886191,
  name: "Delete junk folders and files of movie archives and import movies",
  enabled: true,
};
```

var jd_meta_data = {"eventTrigger": "ON_ARCHIVE_EXTRACTED", "eventTriggerSettings": {"isSynchronous": false}, "id": 1618303886191, "name": "Delete Junk folders and files of movie archives", "enabled": true};

// Delete junk folders and files for movie downloads
// Trigger: "Archive Extraction Finished"

var junkNames = ["sample", "proof"];
var accpetedTypes = [".mkv", ".avi", ".mp4", ".srt"];

var reNames = new RegExp(createRegexStr(junkNames), "i"); // junk names
var reTypes = new RegExp(createRegexStr(accpetedTypes) + "$", "i"); // legitimate file types

var files = archive.getExtractedFiles();

if (files != null) {
    // check if extracted archive is a movie
    var movie = false;
    for (i = 0; i < files.length; i++) {
        if (reTypes.test(files[i])) {
            var movie = true;
        }
    }

    if (movie) {
        var archiveFolder = archive.getExtractToFolder(); // will dynamically get the folder from 'archive info'

        // setup log file
        var logFilePath = getPath(archiveFolder + "/junk/");
        logFilePath.mkdirs();

        logFile = archiveFolder + "/junk/" + archive.getName() + ".json";
        if (getPath(logFile).exists()) {
            getPath(logFile).delete();
        }

        if (files.length > 1) writeFile(logFile, "[", false);

        for (i = 0; i < files.length; i++) {
            // regex: string = [fullPath, folderPath, folderName, fileName, fileType]
            var fileName = files[i].match(/(.*[\/|\\]+(.+[^\/|\\]))[\/|\\]+(.+(\..*))$/);

            var junkFolder = reNames.test(fileName[2]); // name including ...
            var junkFile = reNames.test(fileName[3]); // name including ...
            var junkType = !reTypes.test(fileName[4]); // type NOT including ...

            if (junkFolder) {
                var junk = getPath(fileName[1]);
                if (junk.exists()) junk.deleteRecursive();
            }
            if (junkFile || junkType) {
                var junk = getPath(fileName[0]);
                if (junk.exists()) junk.delete();
            }

            // log all files
            var log = {
                path: fileName[0],
                folder: {
                    name: fileName[2],
                    junk: junkFolder
                },
                file: {
                    name: fileName[3],
                    junk: junkFile
                },
                type: {
                    name: fileName[4],
                    junk: junkType
                }
            };
            writeFile(logFile, JSON.stringify(log), true);
            if (i < files.length - 1) writeFile(logFile, "\r\n,", true);
        }

        if (files.length > 1) writeFile(logFile, "]", true);
    }
} else {
    alert("No files extracted!")
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
var jd_meta_data = {
  eventTrigger: "ON_DOWNLOAD_CONTROLLER_STOPPED",
  eventTriggerSettings: { isSynchronous: false },
  id: 1618393886191,
  name: "convert audio to mp3",
  enabled: false,
};

// Convert aac/m4a/ogg files to mp3.
// Trigger required: "A Download Stopped".
// Requires ffmpeg/ffprobe. Uses JD ffmpeg/ffprobe settings if available.
// Overwrites destination file (mp3) if it already exists.

if (link.isFinished()) {
  var fileName = link.name.replace(/(.+)(\..+$)/, "$1");
  var fileType = link.name.replace(/(.+)(\..+$)/, "$2");
  var sourceFile = link.getDownloadPath();
  var audioFile = /\.(aac|m4a|ogg|opus)$/.test(sourceFile);

  if (audioFile) {
    var downloadFolder = package.getDownloadFolder();
    var destFile = downloadFolder + "/" + fileName + ".mp3";
    var ffmpeg = callAPI(
      "config",
      "get",
      "org.jdownloader.controlling.ffmpeg.FFmpegSetup",
      null,
      "binarypath"
    );
    var ffprobe = callAPI(
      "config",
      "get",
      "org.jdownloader.controlling.ffmpeg.FFmpegSetup",
      null,
      "binarypathprobe"
    );
    var data = JSON.parse(
      callSync(
        ffprobe,
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_streams",
        "-show_format",
        sourceFile
      )
    );
    var streamsBitrate = data.streams[0].bit_rate
      ? data.streams[0].bit_rate
      : 0;
    var formatBitrate = data.format.bit_rate ? data.format.bit_rate : 0;
    var bitrate = Math.max(streamsBitrate, formatBitrate) / 1000;
    var deleteSourceFile = false; // Set this to true to delete source file after conversion.

    if (bitrate > 0) {
      callSync(ffmpeg, "-y", "-i", sourceFile, "-b:a", bitrate + "k", destFile);
      if (deleteSourceFile && getPath(destFile).exists())
        deleteFile(sourceFile, false);
    }
  }
}

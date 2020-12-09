// fetch DOM references
var btnStartRecording = document.querySelector("#btn-start-recording");
var btnStopRecording = document.querySelector("#btn-stop-recording");

var videoElement = document.querySelector("video");

var progressBar = document.querySelector("#progress-bar");
var percentage = document.querySelector("#percentage");

var recorder;

// reusable helpers
function postFiles() {
  var blob = recorder.getBlob();

  var filename = "temp.webm"; //TODO: randomize file name, prevent collisions
  var file = new File([blob], filename, { type: "video/webm" });

  videoElement.src = "";
  videoElement.poster = "/img/ajax-loader.gif";

  xhr("/uploadFile", file, (responseText) => {
    var fileURL = JSON.parse(responseText).fileURL;

    console.info("fileURL", fileURL);
    videoElement.src = fileURL;
    videoElement.play();
    videoElement.muted = false;
    videoElement.controls = true;

    document.querySelector("#footer-h2").innerHTML =
      '<a href="' + videoElement.src + '">' + videoElement.src + "</a>";
  });
}

// XHR2/FormData
function xhr(url, data, callback) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = () => {
    if (request.readyState == 4 && request.status == 200) {
      callback(request.responseText);
    }
  };

  request.upload.onprogress = (event) => {
    progressBar.max = event.total;
    progressBar.value = event.loaded;
    progressBar.innerHTML = `Upload Progress ${Math.round(
      (event.loaded / event.total) * 100
    )}%`;
  };

  request.upload.onload = () => {
    percentage.style.display = "none";
    progressBar.style.display = "none";
  };
  request.open("POST", url);

  var formData = new FormData();
  formData.append("file", data, data.name);
  request.send(formData);
}

var mediaStream = null;
// reusable getUserMedia
function captureUserMedia(success_callback) {
  var session = {
    audio: true,
    video: true,
  };

  navigator.getUserMedia(session, success_callback, function (error) {
    alert("Unable to capture your camera. Please check console logs.");
    console.error(error);
  });
}

// UI events handling
btnStartRecording.onclick = function () {
  btnStartRecording.disabled = true;

  captureUserMedia(function (stream) {
    mediaStream = stream;

    videoElement.srcObject = stream;
    videoElement.play();
    videoElement.muted = true;
    videoElement.controls = false;

    recorder = RecordRTC(stream, {
      type: "video",
    });

    recorder.startRecording();

    // enable stop-recording button
    btnStopRecording.disabled = false;
  });
};

btnStopRecording.onclick = function () {
  btnStartRecording.disabled = false;
  btnStopRecording.disabled = true;

  recorder.stopRecording(postFiles);
};

window.onbeforeunload = function () {
  startRecording.disabled = false;
};

function openCity(evt, cityName) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  // Show the current tab, and add an "active" class to the link that opened the tab
  document.getElementById(cityName).style.display = "block";
  evt.currentTarget.className += " active";
}

document.addEventListener("DOMContentLoaded", function () {
  // Get all tab links and tab content elements
  var tablinks = document.getElementsByClassName("tablinks");
  var tabcontent = document.getElementsByClassName("tabcontent");

  // Set the first tab as active by default
  tablinks[0].classList.add("active");
  tabcontent[0].classList.add("active");
  tabcontent[0].classList.add("fade-in");

  // Add click event listener to tab links
  Array.from(tablinks).forEach(function (tablink) {
      tablink.addEventListener("click", function () {
          var targetTab = this.getAttribute("data-tab");

          // Remove active class from all tab links and tab content elements
          Array.from(tablinks).forEach(function (link) {
              link.classList.remove("active");
          });
          Array.from(tabcontent).forEach(function (content) {
              content.classList.remove("active");
              content.classList.remove("fade-in");
          });

          // Add active class to clicked tab link and corresponding tab content
          this.classList.add("active");
          document.getElementById(targetTab).classList.add("active");
          document.getElementById(targetTab).classList.add("fade-in");
      });
  });
});

// Firebase configuration
var firebaseConfig = {
  // Your Firebase configuration here
  apiKey: "AIzaSyB_jLJFUB1L7C8n8-9PHu8sbmxyPoKIr5k",
  authDomain: "proctor-watch.firebaseapp.com",
  databaseURL: "https://proctor-watch-default-rtdb.firebaseio.com",
  projectId: "proctor-watch",
  storageBucket: "proctor-watch.appspot.com",
  messagingSenderId: "375719442930",
  appId: "1:375719442930:web:51fb94434165515540d36b"
};

// Initialize Firebase
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database().ref();

// Function to retrieve and display all warning messages from Realtime Database
function displayWarningMessages() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) {
    console.log("Sidebar element not found.");
    return;
  }

  db.child("warnings").on("value", (snapshot) => {
    const warnings = snapshot.val();
    sidebar.innerHTML = ""; // Clear the sidebar before updating with new warnings

    for (const [key, warning] of Object.entries(warnings)) {
      const { message, timestamp } = warning;

      const warningMessageElement = document.createElement("div");
      warningMessageElement.classList.add("notification", "warning");

      const messageElement = document.createElement("p");
      messageElement.innerText = "Alert: " + message;
      warningMessageElement.appendChild(messageElement);

      const timestampElement = document.createElement("p");
      timestampElement.innerText = "Time: " + timestamp;
      warningMessageElement.appendChild(timestampElement);

      sidebar.appendChild(warningMessageElement);
    }
  }, (error) => {
    console.log("Error getting warning messages:", error);
  });

  db.child("USBnotifications").on("value", (snapshot) => {
    const usbNotifications = snapshot.val();

    for (const [key, notification] of Object.entries(usbNotifications)) {
      const { message, timestamp } = notification;

      const usbNotificationElement = document.createElement("div");
      usbNotificationElement.classList.add("notification", "usb-notification");

      const messageElement = document.createElement("p");
      messageElement.innerText = "USB Alert: " + message;
      usbNotificationElement.appendChild(messageElement);

      const timestampElement = document.createElement("p");
      timestampElement.innerText = "Time: " + timestamp;
      usbNotificationElement.appendChild(timestampElement);

      sidebar.appendChild(usbNotificationElement);
    }
  }, (error) => {
    console.log("Error getting USB notification messages:", error);
  });
}

document.addEventListener("DOMContentLoaded", displayWarningMessages);



// Get a reference to the database service
var database = firebase.database();

// Get the input field and chatbox div
var input = document.getElementById("usermsg");
var chatbox = document.getElementById("chatbox");

// Listen for form submit event
document.getElementById("message-form").addEventListener("submit", function (e) {
  e.preventDefault();
  // Get the current user's name and message from input field
  var user = "Admin";
  var message = input.value;

  // Create a new message reference in the database
  var newMessageRef = database.ref("messages").push();
  // Set the message data to the new reference
  newMessageRef.set({
      user: user,
      message: message,
  });

  // Clear the input field
  input.value = "";
});

// Listen for new messages in the database
database.ref("messages").on("child_added", function (snapshot) {
  // Get the message data
  var data = snapshot.val();
  var user = data.user;
  var message = data.message;

  // Create a new chat message element
  var chatMessage = document.createElement("div");
  chatMessage.innerHTML = "<b>" + user + "</b>: " + message;

  // Apply fade-in effect to the chat message
  chatMessage.style.opacity = 0;
  chatMessage.style.animation = "fade-in 0.5s ease forwards";

  // Append the message element to the chatbox
  chatbox.appendChild(chatMessage);

  // Scroll to the bottom of the chatbox
  chatbox.scrollTop = chatbox.scrollHeight;
});

// Listen for logout event
document.getElementById("logout-button").addEventListener("click", function () {
  // Remove all chat messages from the database
  database.ref("messages").remove();

  // Clear the chatbox on the screen
  chatbox.innerHTML = "";
});

function submitQuestions() {
  var questions = [];
  var questionInputs = document.querySelectorAll("input[id^='question']");

  questionInputs.forEach(function (input, index) {
    var question = {
      questionNumber: index + 1,
      questionText: input.value,
      options: []
    };

    questions.push(question);
  });

  console.log(questions);

  questionInputs.forEach(function (input) {
    input.value = "";
  });

  var examRef = firebase.database().ref("exam/");
  examRef.set(questions)
    .then(function () {
      console.log("Questions saved to the database.");
      alert("Questions sent successfully!");
    })
    .catch(function (error) {
      console.log("Error saving questions: ", error);
      alert("An error occurred while sending questions. Please try again.");
    });
}

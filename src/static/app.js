document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const myActivitiesBtn = document.getElementById("my-activities-btn");
  const myActivitiesList = document.getElementById("my-activities-list");

  // Handle "View My Activities" lookup
  myActivitiesBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    if (!email) {
      myActivitiesList.innerHTML = "<p class='error'>Please enter your email above first.</p>";
      myActivitiesList.classList.remove("hidden");
      return;
    }

    try {
      const response = await fetch(`/activities/student/${encodeURIComponent(email)}`);
      const enrolled = await response.json();
      const entries = Object.entries(enrolled);

      if (entries.length === 0) {
        myActivitiesList.innerHTML = "<p><em>You are not signed up for any activities yet.</em></p>";
      } else {
        myActivitiesList.innerHTML = entries
          .map(
            ([name, details]) =>
              `<div class="my-activity-item">
                <strong>${name}</strong>
                <span>${details.schedule}</span>
                <button class="my-unregister-btn" data-activity="${name}" data-email="${email}">Unregister</button>
              </div>`
          )
          .join("");

        myActivitiesList.querySelectorAll(".my-unregister-btn").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const activity = e.target.getAttribute("data-activity");
            const studentEmail = e.target.getAttribute("data-email");
            const res = await fetch(
              `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(studentEmail)}`,
              { method: "DELETE" }
            );
            if (res.ok) {
              fetchActivities();
              myActivitiesBtn.click(); // refresh the list
            }
          });
        });
      }

      myActivitiesList.classList.remove("hidden");
    } catch (error) {
      myActivitiesList.innerHTML = "<p class='error'>Failed to load your activities.</p>";
      myActivitiesList.classList.remove("hidden");
      console.error("Error fetching student activities:", error);
    }
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const isFull = spotsLeft === 0;

        // Create participants HTML with delete icons
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability${isFull ? ' full' : ''}"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          <button class="register-btn" data-activity="${name}"${isFull ? ' disabled' : ''}>${isFull ? 'Activity Full' : 'Register Student'}</button>
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners
      document.querySelectorAll(".register-btn").forEach((button) => {
        button.addEventListener("click", handleRegister);
      });
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle per-card registration
  async function handleRegister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = document.getElementById("email").value.trim();

    if (!email) {
      messageDiv.textContent = "Please enter your student email at the top first.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to register. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error registering:", error);
    }
  }

  // Initialize app
  fetchActivities();
});

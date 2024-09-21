// app.js

// Access Firebase Realtime Database functions
import {
  getDatabase,
  ref,
  push,
  remove,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// Initialize database
const db = getDatabase();

// HTML Elements
const resourceForm = document.getElementById("resource-form");
const resourceList = document.getElementById("resource-list");
const categoryFilters = document.getElementById("categories");
const categorySelect = document.getElementById("category");
const customCategoryInput = document.getElementById("custom-category");

// Selected categories for filtering
let selectedCategories = [];

// Function to display resources based on selected categories
const displayResources = () => {
  resourceList.innerHTML = "";

  const resourcesRef = ref(db, "resources");

  // Set up real-time listener
  onValue(resourcesRef, (snapshot) => {
    resourceList.innerHTML = ""; // Clear current list
    const resources = snapshot.val();

    if (!resources) {
      resourceList.innerHTML = "<p>No resources found.</p>";
      return;
    }

    // Filter resources by selected categories
    const filteredResources = Object.entries(resources).filter(
      ([id, resource]) =>
        selectedCategories.length > 0
          ? selectedCategories.includes(resource.category)
          : true
    );

    // Display each resource
    filteredResources.forEach(([id, resource]) => {
      const resourceItem = document.createElement("div");
      resourceItem.classList.add("resource-item");

      resourceItem.innerHTML = `
        <h3>${resource.title}</h3>
        Explore: <a href="${resource.link}" target="_blank">${resource.link}</a>
        <p>${resource.description}</p>
        <span class="category-label">${resource.category}</span>
        <button onclick="deleteResource('${id}')">Delete</button>
      `;

      resourceList.appendChild(resourceItem);
    });
  });
};

// Function to add a new resource
const addResource = async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const link = document.getElementById("link").value.trim();
  const description = document.getElementById("description").value.trim();
  let category = categorySelect.value;

  if (!title || !link || !description || !category) {
    alert("Please fill in all fields.");
    return;
  }

  // Handle custom category
  if (category === "Add New Category") {
    const customCategory = customCategoryInput.value.trim();
    if (!customCategory) {
      alert("Please enter a custom category.");
      return;
    }
    category = customCategory;
    customCategoryInput.value = "";

    // Add the new category to the dropdown (excluding 'Add New Category')
    const newOption = document.createElement("option");
    newOption.value = customCategory;
    newOption.textContent = customCategory;
    categorySelect.insertBefore(
      newOption,
      categorySelect.options[categorySelect.options.length - 1]
    );
    categorySelect.value = customCategory;
    customCategoryInput.style.display = "none"; // Hide input after adding
  }

  try {
    // Add resource to Realtime Database
    await push(ref(db, "resources"), {
      title,
      link,
      description,
      category,
    });

    // Reset form
    resourceForm.reset();
    customCategoryInput.style.display = "none"; // Hide custom category input if visible
  } catch (error) {
    console.error("Error adding resource: ", error.message); // Display error message in the console
    alert(`Failed to add resource. Error: ${error.message}`); // Show detailed error message to the user
  }
};

// Function to delete a resource
const deleteResource = async (id) => {
  const confirmDelete = confirm(
    "Are you sure you want to delete this resource?"
  );
  if (!confirmDelete) return;

  try {
    await remove(ref(db, `resources/${id}`));
  } catch (error) {
    console.error("Error deleting resource: ", error);
    alert("Failed to delete resource. Please try again.");
  }
};

// Function to update category filters
const updateCategories = () => {
  const resourcesRef = ref(db, "resources");

  onValue(resourcesRef, (snapshot) => {
    const categories = new Set();
    const resources = snapshot.val();

    if (!resources) return;

    Object.values(resources).forEach((resource) => {
      categories.add(resource.category);
    });

    // Clear existing categories
    categoryFilters.innerHTML = "";

    // Create checkbox for each category
    categories.forEach((cat) => {
      const categoryItem = document.createElement("div");
      categoryItem.classList.add("category-item");

      categoryItem.innerHTML = `
        <input type="checkbox" id="cat-${cat}" value="${cat}">
        <label for="cat-${cat}">${cat}</label>
      `;

      categoryFilters.appendChild(categoryItem);
    });

    // Add event listeners to checkboxes
    const checkboxes = categoryFilters.querySelectorAll(
      'input[type="checkbox"]'
    );
    checkboxes.forEach((checkbox) => {
      // Restore checkbox state based on selectedCategories
      if (selectedCategories.includes(checkbox.value)) {
        checkbox.checked = true;
      }

      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          selectedCategories.push(checkbox.value);
        } else {
          selectedCategories = selectedCategories.filter(
            (cat) => cat !== checkbox.value
          );
        }
        displayResources(); // Refresh resource display based on new filters
      });
    });
  });
};

// Event Listener for "Add New Category" selection
categorySelect.addEventListener("change", () => {
  if (categorySelect.value === "Add New Category") {
    customCategoryInput.style.display = "block";
    customCategoryInput.focus();
  } else {
    customCategoryInput.style.display = "none";
  }
});

// Event Listener for form submission
resourceForm.addEventListener("submit", addResource);

// Initial function calls
displayResources();
updateCategories();

// Expose deleteResource to the global scope so it can be called from inline onclick handlers
window.deleteResource = deleteResource;

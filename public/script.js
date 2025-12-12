//  element
const projectsGrid = document.getElementById("projectsGrid");
const addBtn       = document.getElementById("addProjectBtn");

// popup "เพิ่ม"
const modal          = document.getElementById("projectModal");
const modalPassword  = document.getElementById("modalPassword");
const modalTitle     = document.getElementById("modalTitle");
const modalLinkText  = document.getElementById("modalLinkText");
const modalUrl       = document.getElementById("modalUrl");
const modalError     = document.getElementById("modalError");
const modalCancel    = document.getElementById("modalCancel");
const modalSave      = document.getElementById("modalSave");

// popup "ลบ"
const deleteModal    = document.getElementById("deleteModal");
const deleteClose    = document.getElementById("deleteClose");
const deleteCancel   = document.getElementById("deleteCancel");
const deleteConfirm  = document.getElementById("deleteConfirm");
const deletePassword = document.getElementById("deletePassword");
const deleteError    = document.getElementById("deleteError");

//  data (มาจาก server หมด ไม่ใช้ localStorage แล้ว)
let projects = [];
let deleteTargetID = null;   // จะเก็บเป็น _id ของ project จาก MongoDB

// ------------------------
// ฟังก์ชันคุยกับ backend
// ------------------------

// โหลด projects จาก server
async function loadProjects() {
  try {
    const res = await fetch("/api/projects");
    const data = await res.json();
    // backend ของเราส่ง { projects: [...] }
    projects = data.projects || data;
    renderProjects();
  } catch (err) {
    console.error("loadProjects error:", err);
  }
}

// เพิ่ม project ลง server
async function addProjectToServer(password, title, linkText, url) {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password, title, linkText, url }),
  });

  const data = await res.json();
  return { ok: res.ok && data.ok, message: data.message || "" };
}

// ลบ project บน server
async function deleteProjectOnServer(password, projectId) {
  const res = await fetch(`/api/projects/${projectId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  const data = await res.json();
  return { ok: res.ok && data.ok, message: data.message || "" };
}

// ------------------------
// render การ์ดทั้งหมด
// ------------------------
function renderProjects() {
  // ลบการ์ดเก่า (ยกเว้นปุ่ม +)
  const oldCards = projectsGrid.querySelectorAll(".project-card:not(.add-card)");
  oldCards.forEach(card => card.remove());

  // สร้างการ์ดจาก projects ที่ได้จาก server
  projects.forEach((p) => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `
      <h3>${p.title}</h3>
      <p>link : <a href="${p.url}" target="_blank">${p.linkText}</a></p>
      <button class="delete-btn" data-id="${p._id}">Delete</button>
    `;
    projectsGrid.insertBefore(card, addBtn);
  });

  // ผูก event ปุ่ม Delete
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      deleteTargetID = btn.dataset.id;   // เก็บ _id ของ MongoDB
      openDeletePopup();
    });
  });
}

// ------------------------
// popup เพิ่ม project
// ------------------------
addBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
  modalError.textContent = "";
  modalPassword.value = "";
  modalTitle.value = "";
  modalLinkText.value = "";
  modalUrl.value = "";
  modalPassword.focus();
});

modalCancel.addEventListener("click", () => {
  modal.classList.add("hidden");
});

modalSave.addEventListener("click", async () => {
  const pass     = modalPassword.value.trim();
  const title    = modalTitle.value.trim();
  const linkText = modalLinkText.value.trim() || "Open project";
  const url      = modalUrl.value.trim();

  if (!title || !url) {
    modalError.textContent = "กรอกชื่อโปรเจกต์และ URL ให้ครบก่อน";
    return;
  }

  const result = await addProjectToServer(pass, title, linkText, url);
  if (!result.ok) {
    modalError.textContent = result.message || "เพิ่มโปรเจกต์ไม่สำเร็จ";
    return;
  }

  await loadProjects();          // ดึงข้อมูลใหม่จาก DB
  modal.classList.add("hidden");
});

// ------------------------
// popup ลบ project
// ------------------------
function openDeletePopup() {
  deletePassword.value = "";
  deleteError.textContent = "";
  deleteModal.classList.remove("hidden");
}

deleteClose.addEventListener("click", () => {
  deleteModal.classList.add("hidden");
});

deleteCancel.addEventListener("click", () => {
  deleteModal.classList.add("hidden");
});

deleteConfirm.addEventListener("click", async () => {
  const pass = deletePassword.value.trim();

  if (!deleteTargetID) {
    deleteError.textContent = "ไม่พบโปรเจกต์ที่จะลบ";
    return;
  }

  const result = await deleteProjectOnServer(pass, deleteTargetID);
  if (!result.ok) {
    deleteError.textContent = result.message || "ลบโปรเจกต์ไม่สำเร็จ";
    return;
  }

  await loadProjects();     // ดึงข้อมูลใหม่จาก DB
  deleteModal.classList.add("hidden");
  deleteTargetID = null;
});

// ------------------------
// โหลดข้อมูลจาก server ครั้งแรก
// ------------------------
loadProjects();

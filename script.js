const APPS_SCRIPT_URL = window.LANDING_CONFIG?.APPS_SCRIPT_URL || "";
const DEVELOPER = "장문희";

const modal = document.querySelector("#consult-modal");
const form = document.querySelector("#consult-form");
const success = document.querySelector("#success");
const formError = document.querySelector("#form-error");
let lastFocused;

function openModal(prefill = "") {
  lastFocused = document.activeElement;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  if (prefill) form.elements.inquiry.value = prefill + " 주택형 방문상담을 희망합니다.";
  setTimeout(() => form.elements.name.focus(), 50);
}
function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lastFocused?.focus();
}
document.querySelectorAll(".open-consult").forEach(button => button.addEventListener("click", () => {
  const unit = button.closest(".unit-info") ? document.querySelector("#unit-title").textContent : "";
  openModal(unit);
}));
document.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeModal));
document.addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("open")) closeModal(); });

window.addEventListener("scroll", () => document.querySelector("#header").classList.toggle("scrolled", scrollY > 30));

const unitData = {
  "84A": { count: "563세대", image: "hero_render/교육_4.jpg", features: ["맞통풍을 고려한 판상형 구조", "알파룸·드레스룸·팬트리", "가족 중심의 효율적인 동선"] },
  "84B": { count: "167세대", image: "hero_render/교육_5.jpg", features: ["남향 위주의 침실 배치", "독립적인 침실 구성", "팬트리·드레스룸 수납 계획"] },
  "101": { count: "333세대", image: "hero_render/교육_6.jpg", features: ["여유로운 중대형 공간", "알파룸·팬트리·드레스룸", "맞통풍을 고려한 공간 설계"] }
};
document.querySelectorAll(".unit-tabs button").forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll(".unit-tabs button").forEach(t => t.setAttribute("aria-selected", "false"));
  tab.setAttribute("aria-selected", "true");
  const key = tab.dataset.unit, data = unitData[key];
  document.querySelector("#unit-title").textContent = key === "101" ? "101㎡" : key;
  document.querySelector("#unit-count").textContent = data.count;
  document.querySelector("#unit-image").src = data.image;
  document.querySelector("#unit-image").alt = `${key} 주택형 평면 안내`;
  document.querySelector("#unit-features").innerHTML = data.features.map(v => `<li>${v}</li>`).join("");
}));

const phoneInput = form.elements.phone;
phoneInput.addEventListener("input", () => {
  const n = phoneInput.value.replace(/\D/g, "").slice(0, 11);
  phoneInput.value = n.length > 7 ? `${n.slice(0,3)}-${n.slice(3,7)}-${n.slice(7)}` : n.length > 3 ? `${n.slice(0,3)}-${n.slice(3)}` : n;
});

function validate() {
  let valid = true;
  [["name", "이름을 입력해 주세요."], ["phone", "올바른 전화번호를 입력해 주세요."], ["inquiry", "문의 내용을 입력해 주세요."]].forEach(([name, message]) => {
    const input = form.elements[name];
    const bad = name === "phone" ? !/^01[016789]-\d{3,4}-\d{4}$/.test(input.value) : !input.value.trim();
    input.classList.toggle("invalid", bad);
    input.closest("label").querySelector(".error").textContent = bad ? message : "";
    if (bad) valid = false;
  });
  if (!form.elements.privacy.checked) { formError.textContent = "개인정보 수집 및 이용에 동의해 주세요."; valid = false; }
  else formError.textContent = "";
  return valid;
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!validate()) return;
  const submit = form.querySelector(".submit-btn");
  submit.disabled = true; submit.textContent = "신청 중...";
  const params = new URLSearchParams(location.search);
  const payload = {
    name: form.elements.name.value.trim(),
    phone: form.elements.phone.value,
    inquiry: form.elements.inquiry.value.trim(),
    developer: DEVELOPER,
    pageUrl: location.href,
    userAgent: navigator.userAgent,
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || ""
  };
  try {
    if (!APPS_SCRIPT_URL) {
      throw new Error("APPS_SCRIPT_URL_NOT_CONFIGURED");
    } else {
      const response = await fetch(APPS_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("network");
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "save");
    }
    form.hidden = true; success.hidden = false; form.reset();
  } catch (error) {
    formError.textContent = error.message === "APPS_SCRIPT_URL_NOT_CONFIGURED"
      ? "상담 저장 주소가 아직 설정되지 않았습니다. 010-4896-1691로 전화해 주세요."
      : "신청을 저장하지 못했습니다. 잠시 후 다시 시도하거나 010-4896-1691로 전화해 주세요.";
  } finally { submit.disabled = false; submit.textContent = "방문상담 신청하기"; }
});

const privacy = document.querySelector("#privacy-panel");
document.querySelector("#privacy-open").addEventListener("click", () => { privacy.classList.add("open"); privacy.setAttribute("aria-hidden", "false"); });
document.querySelector("#privacy-close").addEventListener("click", () => { privacy.classList.remove("open"); privacy.setAttribute("aria-hidden", "true"); });

const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); } }), { threshold: .12 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

const complexTexts = [...document.querySelectorAll(".complex-text")];
const complexSlides = [...document.querySelectorAll(".complex-slide")];
const complexDots = [...document.querySelectorAll("[data-complex-dot]")];
let complexIndex = 0;
let complexTimer;

function showComplexSlide(index) {
  complexIndex = index;
  complexTexts.forEach((item, i) => item.classList.toggle("active", i === index));
  complexSlides.forEach((item, i) => item.classList.toggle("active", i === index));
  complexDots.forEach((item, i) => item.classList.toggle("active", i === index));
  document.querySelector("#complex-current").textContent = String(index + 1).padStart(2, "0");
}
function startComplexCarousel() {
  clearInterval(complexTimer);
  complexTimer = setInterval(() => showComplexSlide((complexIndex + 1) % complexSlides.length), 5000);
}
complexDots.forEach(dot => dot.addEventListener("click", () => { showComplexSlide(Number(dot.dataset.complexDot)); startComplexCarousel(); }));
if (complexSlides.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) startComplexCarousel();

const heroPanels = [...document.querySelectorAll(".hero-panel")];
const heroBackgrounds = [...document.querySelectorAll(".hero-bg")];
const heroDots = [...document.querySelectorAll("[data-hero-dot]")];
let heroIndex = 0;
let heroTimer;

function showHeroSlide(index) {
  heroIndex = index;
  heroPanels.forEach((item, i) => item.classList.toggle("active", i === index));
  heroBackgrounds.forEach((item, i) => item.classList.toggle("active", i === index));
  heroDots.forEach((item, i) => item.classList.toggle("active", i === index));
  document.querySelector("#hero-current").textContent = String(index + 1).padStart(2, "0");
}
function startHeroCarousel() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => showHeroSlide((heroIndex + 1) % heroPanels.length), 6000);
}
heroDots.forEach(dot => dot.addEventListener("click", () => { showHeroSlide(Number(dot.dataset.heroDot)); startHeroCarousel(); }));
if (heroPanels.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) startHeroCarousel();

const multiStepForm = document.querySelector("[data-multi-step]");
const formStep = [...multiStepForm.querySelectorAll("[data-step]")];
let currentStep = formStep.findIndex((step) => {
  return step.classList.contains("active");
});
console.log(currentStep);

if (currentStep < 0) {
  currentStep = 0;
  formStep[currentStep].classList.add("active");
  showCurrentStep();
}

multiStepForm.addEventListener("click", (e) => {
  let incrementor;
  if (e.target.matches("[data-next]")) {
    incrementor = 1;
  } else if (e.target.matches("[data-previous]")) {
    incrementor = -1;
  }
  if (incrementor == null) return;

  //validation control
  const inputs = [...formStep[currentStep].querySelectorAll("input")];
  const allValid = inputs.every((input) => input.reportValidity());
  console.log(allValid);
  if (allValid) {
    currentStep += incrementor;
    showCurrentStep();
  }
});

formStep.forEach((step) => {
  step.addEventListener("animationend", (e) => {
    formStep[currentStep].classList.remove("hide");
    e.target.classList.toggle("hide", !e.target.classList.contains("active"));
  });
});

function showCurrentStep() {
  formStep.forEach((step, index) => {
    step.classList.toggle("active", index === currentStep);
  });
}

multiStepForm.addEventListener("submit", (e) => {
  e.preventDefault();
  wheel.spin(Math.random());
  const buttons = [
    ...formStep[2].querySelectorAll("button"),
    ...formStep[2].querySelectorAll("submit"),
  ];
  buttons.forEach((btn) => {
    btn.classList.add("hide");
  });
  setTimeout(() => {
    console.log("submitted");
    const inputs = [...formStep[0].querySelectorAll("input")];
    let data = {
      name: inputs.find((el) => el.id == "name")?.value,
      email: inputs.find((el) => el.id == "email")?.value,
      phone: inputs.find((el) => el.id == "phone")?.value,
      discount: wheel.getCurrentWord(),
    };
    console.log("data", data);
    uploadData(data);
  }, 3000);
});

function wellDone(data) {
  let finish = document.getElementById("finish");
  let h2 = document.createElement("h2");
  h2.textContent = `Weel done ${data.name}! we'll send at ${data.email} a discount coupon of ${data.discount}. Bye!`;
  finish.appendChild(h2);
}

function uploadData(data) {
  const scriptURL = "link to for google sheets";
  var form_data = new FormData();

  for (var key in data) {
    form_data.append(key, data[key]);
  }
  console.log("new FormData:", form_data);
  fetch(scriptURL, { method: "POST", body: form_data })
    .then((response) => {
      console.log(response);
      wellDone(data);
    })
    .catch((error) => {
      console.error(error);
    });
}

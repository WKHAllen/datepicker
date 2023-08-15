function displayDate(date) {
  if (!date) return "null";
  return date.toDateString();
}

function main() {
  const selectedDate = document.getElementById("selected-date");

  // configure all date pickers
  configureGlobalDatePickers({
    svgPath: "/datepicker/svg/",
  });

  // get a handle to the date picker in the DOM
  const datepicker = new DatePicker("date-picker-demo");
  datepicker.setDateMin(new Date(2023, 2, 21));
  datepicker.setDateMax(new Date(2026, 2, 21));
  datepicker.onChange((date) => {
    selectedDate.innerText = `Selected date: ${displayDate(date)}`;
  });
}

window.addEventListener("load", main);

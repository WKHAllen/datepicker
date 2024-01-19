/**
 * A vanilla JS date picker.
 *
 * The only items from this file that are intended for use are the
 * `DatePicker` class and the `configureGlobalDatePickers` function. All other
 * constants, functions, and classes are internal. Additionally, all methods
 * on the `DatePicker` class that are marked with "**INTERNAL**" should not be
 * called manually.
 *
 * An API for styling the date picker is provided via the
 * `configureGlobalDatePickers` function. In some cases, the API may not
 * provide enough flexibility in the way of styling. If this is the case, the
 * styling can be overridden manually with custom CSS. Each element within the
 * date picker has a class identifying it, so manually overriding the default
 * styles should be easy enough.
 *
 * This JS file and the corresponding CSS file need to be linked for the date
 * pickers to work. All SVGs in the `svg` directory need to be served
 * statically at some known path. This path will need to be configured via the
 * `configureGlobalDatePickers` function, else the date picker's icons will
 * not show up.
 */

const NO_ELEMENT = "datepicker element does not exist";
const DATE_OUTSIDE_RANGE = "selected date is outside of the range";
const MIN_DATE_AFTER_MAX = "minimum date is after the maximum date";
const MAX_DATE_BEFORE_MIN = "maximum date is before the minimum date";
const INVALID_DATE = "date is invalid";
const INVALID_YEAR = "invalid year";
const INVALID_MONTH = "invalid month";
const INVALID_DAY = "invalid day";
const UNKNOWN_CONFIG_OPTION = "unknown configuration option";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

let DATE_PICKER_SVG_PATH = "";

class DatePickerError extends Error {}

function selectElementContent(element) {
  const range = new Range();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function clearSelections() {
  const selection = window.getSelection();
  selection.removeAllRanges();
}

function goToEnd(element) {
  const selection = window.getSelection();
  selection.setPosition(element, 1);
}

class ClickOutsideHandle {
  constructor(element, callback) {
    this.element = element;
    this.callback = callback;
    this.eventCallback = (event) => {
      if (!this.element.contains(event.target)) {
        this.callback();
      }
    };

    document.addEventListener("mousedown", this.eventCallback);
  }

  update(reattach) {
    document.removeEventListener("mousedown", this.eventCallback);

    if (reattach) {
      document.addEventListener("mousedown", this.eventCallback);
    }
  }
}

function yearToString(year) {
  return String(year).padStart(4, "0");
}

function monthToString(month) {
  return String(month).padStart(2, "0");
}

function dayToString(day) {
  return String(day).padStart(2, "0");
}

function newYearValue(oldYear, newYear) {
  if (newYear === "") {
    return yearToString(0);
  }

  const parsedYear = Number(newYear);

  if (isNaN(parsedYear)) {
    return oldYear;
  }

  const yearStr = yearToString(parsedYear);
  return yearStr.slice(-4);
}

function newMonthValue(oldMonth, newMonth) {
  if (newMonth === "") {
    return monthToString(0);
  }

  const parsedMonth = Number(newMonth);

  if (isNaN(parsedMonth)) {
    return oldMonth;
  }

  const monthStr = monthToString(parsedMonth);
  return monthStr.slice(-2);
}

function newDayValue(oldDay, newDay) {
  if (newDay === "") {
    return dayToString(0);
  }

  const parsedDay = Number(newDay);

  if (isNaN(parsedDay)) {
    return oldDay;
  }

  const dayStr = dayToString(parsedDay);
  return dayStr.slice(-2);
}

function parseDate(yearStr, monthStr, dayStr) {
  const year = Number(yearStr);

  if (isNaN(year)) {
    throw new DatePickerError(INVALID_YEAR);
  }

  const month = Number(monthStr);

  if (isNaN(month)) {
    throw new DatePickerError(INVALID_MONTH);
  }

  const day = Number(dayStr);

  if (isNaN(day)) {
    throw new DatePickerError(INVALID_DAY);
  }

  return new Date(year, month - 1, day);
}

function isValidDate(date) {
  return date instanceof Date && !isNaN(date);
}

function dateWithinRange(date, min, max) {
  if (min && min > date) {
    return false;
  }

  if (max && max < date) {
    return false;
  }

  return true;
}

function checkState(year, month, day, min, max) {
  const date = parseDate(year, month, day);

  if (!isValidDate(date)) {
    throw new DatePickerError(INVALID_DATE);
  }

  if (!dateWithinRange(date, min, max)) {
    throw new DatePickerError(DATE_OUTSIDE_RANGE);
  }

  return date;
}

function monthName(date) {
  return MONTHS[date.getMonth()];
}

function normalizeDate(date) {
  date.setDate(1);
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
}

function newNormalizedDate(date) {
  const newDate = new Date(date);
  normalizeDate(newDate);
  return newDate;
}

function normalizeDateToDay(date) {
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
}

function newNormalizedDateToDay(date) {
  const newDate = new Date(date);
  normalizeDateToDay(newDate);
  return newDate;
}

function prevMonth(date) {
  const newDate = newNormalizedDate(date);

  if (newDate.getMonth() === 0) {
    newDate.setFullYear(newDate.getFullYear() - 1);
    newDate.setMonth(11);
  } else {
    newDate.setMonth(newDate.getMonth() - 1);
  }

  return newDate;
}

function nextMonth(date) {
  const newDate = newNormalizedDate(date);

  if (newDate.getMonth() === 11) {
    newDate.setFullYear(newDate.getFullYear() + 1);
    newDate.setMonth(0);
  } else {
    newDate.setMonth(newDate.getMonth() + 1);
  }

  return newDate;
}

function thisMonth() {
  return newNormalizedDate(new Date());
}

function prevMonthViewable(viewingMonth, min) {
  if (!min) {
    return true;
  }

  const thisViewingMonth = newNormalizedDate(viewingMonth);
  const thisMin = newNormalizedDate(min);
  return thisMin < thisViewingMonth;
}

function nextMonthViewable(viewingMonth, max) {
  if (!max) {
    return true;
  }

  const thisViewingMonth = newNormalizedDate(viewingMonth);
  const thisMax = newNormalizedDate(max);
  return thisViewingMonth < thisMax;
}

function daysBeforeMonth(viewingMonth) {
  const firstOfMonth = newNormalizedDate(viewingMonth);
  return firstOfMonth.getDay();
}

function daysInMonth(viewingMonth) {
  const lastOfMonth = nextMonth(viewingMonth);
  lastOfMonth.setDate(0);
  return lastOfMonth.getDate();
}

function daysAfterMonth(viewingMonth) {
  const calendarSpace = 42;
  const numDaysBeforeMonth = daysBeforeMonth(viewingMonth);
  const numDaysInMonth = daysInMonth(viewingMonth);
  return calendarSpace - numDaysInMonth - numDaysBeforeMonth;
}

function calendarDay(viewingMonth, day) {
  const thisDay = newNormalizedDate(viewingMonth);
  thisDay.setDate(day);
  return thisDay;
}

function calendarToday() {
  return newNormalizedDateToDay(new Date());
}

function datesEqual(date1, date2) {
  if (!date1 || !date2) return false;
  return date1.getTime() === date2.getTime();
}

/**
 * A JS date picker.
 */
class DatePicker {
  /**
   * A JS date picker. The only thing this requires is the ID of an empty div
   * element. Everything else is handled internally.
   *
   * @param {string} id The ID of the empty element.
   */
  constructor(id) {
    const today = new Date();

    this.id = id;
    this.open = false;
    this.state = null;
    this.year = yearToString(today.getFullYear());
    this.month = monthToString(today.getMonth() + 1);
    this.day = dayToString(today.getDate());
    this.viewingMonth = thisMonth();
    this.clickOutsideHandle = undefined;
    this.minDate = null;
    this.maxDate = null;
    this.disabled = false;
    this.callback = null;

    this.create();
  }

  /**
   * **INTERNAL**
   *
   * Populate the DOM element containing the datepicker. This is called
   * automatically after instantiation, so it usually does not need to be
   * called manually.
   */
  create() {
    const el = document.getElementById(this.id);

    if (el === null) {
      throw new DatePickerError(NO_ELEMENT);
    }

    if (el.children.length > 0) {
      // element has probably been populated already
      return;
    }

    el.classList.add("date-picker-container");

    {
      const picker = document.createElement("div");
      picker.classList.add("date-picker");
      {
        const inputs = document.createElement("div");
        inputs.classList.add("date-picker-section");
        {
          const yearInput = document.createElement("span");
          yearInput.classList.add(
            "date-picker-input",
            "date-picker-input-year"
          );
          yearInput.contentEditable = "true";
          yearInput.addEventListener("focusin", () => {
            selectElementContent(yearInput);
          });
          yearInput.addEventListener("input", (event) => {
            const newTypedValue = event.target.innerText;
            const newValue = newYearValue(this.year, newTypedValue);
            yearInput.textContent = newValue;
            goToEnd(yearInput);
            this.year = newValue;
            this.updateState(newValue, null, null);
          });
          yearInput.textContent = this.year;
          inputs.appendChild(yearInput);
        }
        {
          const delim = document.createElement("span");
          delim.textContent = "-";
          inputs.appendChild(delim);
        }
        {
          const monthInput = document.createElement("span");
          monthInput.classList.add(
            "date-picker-input",
            "date-picker-input-month"
          );
          monthInput.contentEditable = "true";
          monthInput.addEventListener("focusin", () => {
            selectElementContent(monthInput);
          });
          monthInput.addEventListener("input", (event) => {
            const newTypedValue = event.target.innerText;
            const newValue = newMonthValue(this.month, newTypedValue);
            monthInput.textContent = newValue;
            goToEnd(monthInput);
            this.month = newValue;
            this.updateState(null, newValue, null);
          });
          monthInput.textContent = this.month;
          inputs.appendChild(monthInput);
        }
        {
          const delim = document.createElement("span");
          delim.textContent = "-";
          inputs.appendChild(delim);
        }
        {
          const dayInput = document.createElement("span");
          dayInput.classList.add("date-picker-input", "date-picker-input-day");
          dayInput.contentEditable = "true";
          dayInput.addEventListener("focusin", () => {
            selectElementContent(dayInput);
          });
          dayInput.addEventListener("input", (event) => {
            const newTypedValue = event.target.innerText;
            const newValue = newDayValue(this.day, newTypedValue);
            dayInput.textContent = newValue;
            goToEnd(dayInput);
            this.day = newValue;
            this.updateState(null, null, newValue);
          });
          dayInput.textContent = this.day;
          inputs.appendChild(dayInput);
        }
        picker.appendChild(inputs);
      }
      {
        const openButtonContainer = document.createElement("div");
        openButtonContainer.classList.add("date-picker-section");
        openButtonContainer.addEventListener("focusin", clearSelections);
        {
          const openButton = document.createElement("button");
          openButton.setAttribute("type", "button");
          openButton.classList.add(
            "date-picker-icon-button",
            "date-picker-icon-button-open"
          );
          openButton.addEventListener("click", () => {
            this.open = true;
            this.update();
          });
          {
            const openButtonIcon = document.createElement("img");
            openButtonIcon.classList.add("date-picker-icon-button-icon");
            openButtonIcon.src = `${DATE_PICKER_SVG_PATH}/calendar-days-solid.svg`;
            openButton.appendChild(openButtonIcon);
          }
          openButtonContainer.appendChild(openButton);
        }
        picker.appendChild(openButtonContainer);
      }
      el.appendChild(picker);
    }
    {
      const popupContainer = document.createElement("div");
      popupContainer.classList.add("date-picker-popup-container");
      {
        const popup = document.createElement("div");
        popup.classList.add("date-picker-popup");
        this.clickOutsideHandle = new ClickOutsideHandle(popup, () => {
          this.open = false;
          this.update();
        });
        {
          const calendar = document.createElement("div");
          calendar.classList.add("date-picker-calendar");
          {
            const monthControls = document.createElement("div");
            monthControls.classList.add("date-picker-calendar-month-controls");
            {
              const prevMonthButton = document.createElement("button");
              prevMonthButton.setAttribute("type", "button");
              prevMonthButton.classList.add(
                "date-picker-icon-button",
                "date-picker-icon-button-left"
              );
              prevMonthButton.addEventListener("click", () => {
                this.viewingMonth = prevMonth(this.viewingMonth);
                this.update();
              });
              {
                const prevMonthButtonIcon = document.createElement("img");
                prevMonthButtonIcon.classList.add(
                  "date-picker-icon-button-icon"
                );
                prevMonthButtonIcon.src = `${DATE_PICKER_SVG_PATH}/angle-left-solid.svg`;
                prevMonthButton.appendChild(prevMonthButtonIcon);
              }
              monthControls.appendChild(prevMonthButton);
            }
            {
              const viewingMonth = document.createElement("span");
              viewingMonth.classList.add("date-picker-calendar-month");
              viewingMonth.textContent = `${monthName(
                this.viewingMonth
              )} ${this.viewingMonth.getFullYear()}`;
              monthControls.appendChild(viewingMonth);
            }
            {
              const nextMonthButton = document.createElement("button");
              nextMonthButton.setAttribute("type", "button");
              nextMonthButton.classList.add(
                "date-picker-icon-button",
                "date-picker-icon-button-right"
              );
              nextMonthButton.addEventListener("click", () => {
                this.viewingMonth = nextMonth(this.viewingMonth);
                this.update();
              });
              {
                const nextMonthButtonIcon = document.createElement("img");
                nextMonthButtonIcon.classList.add(
                  "date-picker-icon-button-icon"
                );
                nextMonthButtonIcon.src = `${DATE_PICKER_SVG_PATH}/angle-right-solid.svg`;
                nextMonthButton.appendChild(nextMonthButtonIcon);
              }
              monthControls.appendChild(nextMonthButton);
            }
            calendar.appendChild(monthControls);
          }
          {
            const daysOfWeek = document.createElement("div");
            daysOfWeek.classList.add("date-picker-calendar-days-of-week");
            {
              const sunday = document.createElement("span");
              sunday.textContent = "Su";
              daysOfWeek.appendChild(sunday);
            }
            {
              const monday = document.createElement("span");
              monday.textContent = "Mo";
              daysOfWeek.appendChild(monday);
            }
            {
              const tuesday = document.createElement("span");
              tuesday.textContent = "Tu";
              daysOfWeek.appendChild(tuesday);
            }
            {
              const wednesday = document.createElement("span");
              wednesday.textContent = "We";
              daysOfWeek.appendChild(wednesday);
            }
            {
              const thursday = document.createElement("span");
              thursday.textContent = "Th";
              daysOfWeek.appendChild(thursday);
            }
            {
              const friday = document.createElement("span");
              friday.textContent = "Fr";
              daysOfWeek.appendChild(friday);
            }
            {
              const saturday = document.createElement("span");
              saturday.textContent = "Sa";
              daysOfWeek.appendChild(saturday);
            }
            calendar.appendChild(daysOfWeek);
          }
          {
            const calendarView = document.createElement("div");
            calendarView.classList.add("date-picker-calendar-view");
            // populated in the `update` method
            calendar.appendChild(calendarView);
          }
          popup.appendChild(calendar);
        }
        popupContainer.appendChild(popup);
      }
      el.appendChild(popupContainer);
    }

    this.update();
  }

  /**
   * **INTERNAL**
   *
   * Triggers an update of the entire date picker. All updates are handled
   * internally, so this method typically will not need to be called manually.
   */
  update() {
    // update popup click-outside event listener
    this.clickOutsideHandle.update(this.open);

    // open/close popup
    const popupContainer = document.querySelector(
      `#${this.id} .date-picker-popup-container`
    );
    if (this.open) {
      popupContainer.classList.add("date-picker-popup-container-open");
    } else {
      popupContainer.classList.remove("date-picker-popup-container-open");
    }

    // update calendar month name
    const viewingMonth = document.querySelector(
      `#${this.id} .date-picker-calendar-month`
    );
    viewingMonth.textContent = `${monthName(
      this.viewingMonth
    )} ${this.viewingMonth.getFullYear()}`;

    // enable/disable previous month button
    const prevMonthButton = document.querySelector(
      `#${this.id} .date-picker-icon-button-left`
    );
    const prevMonthDisabled = !prevMonthViewable(
      this.viewingMonth,
      this.minDate
    );
    if (prevMonthDisabled) {
      prevMonthButton.disabled = true;
    } else {
      prevMonthButton.disabled = false;
    }

    // enable/disable next month button
    const nextMonthButton = document.querySelector(
      `#${this.id} .date-picker-icon-button-right`
    );
    const nextMonthDisabled = !nextMonthViewable(
      this.viewingMonth,
      this.maxDate
    );
    if (nextMonthDisabled) {
      nextMonthButton.disabled = true;
    } else {
      nextMonthButton.disabled = false;
    }

    // days in calendar view
    const calendarView = document.querySelector(
      `#${this.id} .date-picker-calendar-view`
    );
    const today = calendarToday();
    const numDaysBeforeMonth = daysBeforeMonth(this.viewingMonth);
    const numDaysInMonth = daysInMonth(this.viewingMonth);
    const numDaysAfterMonth = daysAfterMonth(this.viewingMonth);
    const calendarDaysPrev = new Array(numDaysBeforeMonth).fill(0).map(() => {
      const day = document.createElement("div");
      day.classList.add(
        "date-picker-calendar-day",
        "date-picker-calendar-day-hidden"
      );
      return day;
    });
    const calendarDaysCurrent = new Array(numDaysInMonth)
      .fill(0)
      .map((_, i) => {
        const thisDay = calendarDay(this.viewingMonth, i + 1);
        const daySelected = datesEqual(this.state, thisDay);
        const dayToday = datesEqual(thisDay, today);
        const dayDisabled = !dateWithinRange(
          thisDay,
          this.minDate,
          this.maxDate
        );
        const day = document.createElement("div");
        day.classList.add("date-picker-calendar-day");
        if (daySelected) day.classList.add("date-picker-calendar-day-selected");
        if (dayToday) day.classList.add("date-picker-calendar-day-today");
        if (dayDisabled) day.classList.add("date-picker-calendar-day-disabled");
        {
          const dayButton = document.createElement("button");
          dayButton.setAttribute("type", "button");
          dayButton.classList.add("date-picker-calendar-day-button");
          dayButton.disabled = dayDisabled;
          dayButton.addEventListener("click", () => {
            this.state = thisDay;
            this.open = false;
            const yearStr = yearToString(thisDay.getFullYear());
            const monthStr = monthToString(thisDay.getMonth() + 1);
            const dayStr = dayToString(thisDay.getDate());
            const yearInput = document.querySelector(
              `#${this.id} .date-picker-input-year`
            );
            const monthInput = document.querySelector(
              `#${this.id} .date-picker-input-month`
            );
            const dayInput = document.querySelector(
              `#${this.id} .date-picker-input-day`
            );
            yearInput.textContent = yearStr;
            monthInput.textContent = monthStr;
            dayInput.textContent = dayStr;
            this.year = yearStr;
            this.month = monthStr;
            this.day = dayStr;
            this.update();
            if (this.callback) {
              this.callback(this.state);
            }
          });
          {
            const dayButtonText = document.createElement("div");
            dayButton.classList.add("date-picker-calendar-day-button-text");
            dayButton.innerText = String(i + 1);
            dayButton.appendChild(dayButtonText);
          }
          day.appendChild(dayButton);
        }
        return day;
      });
    const calendarDaysNext = new Array(numDaysAfterMonth).fill(0).map(() => {
      const day = document.createElement("div");
      day.classList.add(
        "date-picker-calendar-day",
        "date-picker-calendar-day-hidden"
      );
      return day;
    });
    calendarView.replaceChildren(
      ...calendarDaysPrev,
      ...calendarDaysCurrent,
      ...calendarDaysNext
    );

    // disabled classes and attributes
    const el = document.getElementById(this.id);
    if (this.disabled) {
      el.classList.add("date-picker-container-disabled");
    } else {
      el.classList.remove("date-picker-container-disabled");
    }
    const yearInput = document.querySelector(
      `#${this.id} .date-picker-input-year`
    );
    const monthInput = document.querySelector(
      `#${this.id} .date-picker-input-month`
    );
    const dayInput = document.querySelector(
      `#${this.id} .date-picker-input-day`
    );
    yearInput.contentEditable = (!this.disabled).toString();
    monthInput.contentEditable = (!this.disabled).toString();
    dayInput.contentEditable = (!this.disabled).toString();
    const openButton = document.querySelector(
      `#${this.id} .date-picker-icon-button-open`
    );
    openButton.disabled = this.disabled;
  }

  /**
   * **INTERNAL**
   *
   * Updates the date picker state and causes a re-render. This behavior is
   * handled internally, so this method should not be called manually.
   *
   * @param {string | null} newYear The new year string.
   * @param {string | null} newMonth The new month string.
   * @param {string | null} newDay The new day string.
   */
  updateState(newYear, newMonth, newDay) {
    const year = newYear ?? this.year;
    const month = newMonth ?? this.month;
    const day = newDay ?? this.day;

    try {
      const newState = checkState(year, month, day, this.minDate, this.maxDate);
      this.state = newState;
    } catch (err) {
      if (err instanceof DatePickerError) {
        this.state = null;
      } else {
        throw err;
      }
    }

    this.update();

    if (this.callback) {
      this.callback(this.state);
    }
  }

  /**
   * Gets the selected date. This will return `null` if a date has not been
   * selected. Note that this will return the most recently selected valid
   * date. If the date entered into the box is not valid, it will not be the
   * returned date.
   *
   * @returns {Date | null} The most recently selected valid date.
   */
  get() {
    return this.state;
  }

  /**
   * Sets the selected date. This will throw an error if the date is invalid
   * or not within the allowed range. `null` can be passed to deselect the
   * selected date.
   *
   * @param {Date | null} date The date to select.
   */
  set(date) {
    if (date === null) {
      this.state = null;
    } else {
      if (!isValidDate(date)) {
        throw new DatePickerError(INVALID_DATE);
      }

      if (!dateWithinRange(date, this.minDate, this.maxDate)) {
        throw new DatePickerError(DATE_OUTSIDE_RANGE);
      }

      this.state = date;
    }

    this.update();
  }

  /**
   * Has a date been selected?
   *
   * @returns {boolean} Whether a date has been selected.
   */
  isSelected() {
    return this.state !== null;
  }

  /**
   * Is the currently entered date valid?
   *
   * @returns {boolean} Whether the currently entered date is valid.
   */
  isValid() {
    try {
      const date = parseDate(this.year, this.month, this.day);

      if (!isValidDate(date)) {
        return false;
      }
    } catch (err) {
      if (err instanceof DatePickerError) {
        return false;
      } else {
        throw err;
      }
    }

    return true;
  }

  /**
   * Is the currently selected date within the specified range?
   *
   * @returns {boolean} Whether the currently selected date is within the specified range.
   */
  isWithinRange() {
    try {
      const date = parseDate(this.year, this.month, this.day);

      if (!dateWithinRange(date, this.minDate, this.maxDate)) {
        return false;
      }
    } catch (err) {
      if (err instanceof DatePickerError) {
        return false;
      } else {
        throw err;
      }
    }

    return true;
  }

  /**
   * Sets the earliest date that can be selected. This will throw an error if
   * the date is invalid, or if the date is after the max date. `null` can be
   * passed to remove the minimum date restriction.
   *
   * @param {Date | null} dateMin The minimum date.
   */
  setDateMin(dateMin) {
    if (dateMin === null) {
      this.minDate = null;
    } else {
      if (!isValidDate(dateMin)) {
        throw new DatePickerError(INVALID_DATE);
      }

      if (this.maxDate && dateMin >= this.maxDate) {
        throw new DatePickerError(MIN_DATE_AFTER_MAX);
      }

      this.minDate = dateMin;
    }

    this.update();
  }

  /**
   * Sets the latest date that can be selected. This will throw an error if
   * the date is invalid, or if the date is before the min date. `null` can be
   * passed to remove the maximum date restriction.
   *
   * @param {Date | null} dateMax The maximum date.
   */
  setDateMax(dateMax) {
    if (dateMax === null) {
      this.maxDate = null;
    } else {
      if (!isValidDate(dateMax)) {
        throw new DatePickerError(INVALID_DATE);
      }

      if (this.minDate && dateMax <= this.minDate) {
        throw new DatePickerError(MAX_DATE_BEFORE_MIN);
      }

      this.maxDate = dateMax;
    }

    this.update();
  }

  /**
   * Opens or closes the date picker popup.
   *
   * @param {boolean} open Whether the date picker is open.
   */
  setOpen(open) {
    this.open = open;
    this.update();
  }

  /**
   * Enables or disables the date picker.
   *
   * @param {boolean} disabled Whether the date picker should be disabled.
   */
  setDisabled(disabled) {
    this.disabled = disabled;
    this.update();
  }

  /**
   * Set a callback that will be called when the selected date changes.
   *
   * @param {(date: Date) => void} callback The callback function.
   */
  onChange(callback) {
    this.callback = callback;
  }
}

/**
 * Alter the configuration for all date pickers globally. This will throw an
 * error if an invalid configuration option is encountered.
 *
 * Configuration options:
 *  - `svgPath`: The path where the icon SVG files are statically served. This
 *      option must be set, else icons on date picker buttons will not
 *      display.
 *  - `primaryColor`: The application's primary color. This will be used to
 *      indicate which day has been selected on the date picker calendar.
 *  - `primaryTextColor`: The color of the text to display on a background of
 *      the primary color. This should usually be white, or a similar light
 *      color.
 *  - `inputBackgroundColor`: The background color for the date picker input
 *      element.
 *  - `inputTextColor`: The text color for the date picker input element.
 *  - `inputTextColorDisabled`: The text color for when the date picker input
 *      element is disabled.
 *  - `inputBorder`: The style property for the date picker input border.
 *  - `inputFocusBorder`: The style property for when the date picker input is
 *      focused.
 *  - `inputBorderRadius`: The border radius on the date picker input element.
 *  - `inputFontSize`: The size of the font in the date picker input element.
 *  - `popupBackgroundColor`: The background color for the date picker popup.
 *  - `popupBorderRadius`: The border radius for the date picker popup.
 *  - `popupBoxShadow`: The date picker popup's box shadow style property.
 *  - `calendarFontSize`: The size of the font on the date picker calendar.
 *  - `daySize`: The size of each day in the date picker calendar.
 *  - `dayTextColor`: The text color for the days on the date picker calendar.
 *  - `dayTextColorDisabled`: The text color for the disabled days on the date
 *      picker calendar.
 *  - `dayBorder`: The border style property that will show on the current
 *      day.
 *  - `iconSize`: The size of each SVG icon.
 *  - `iconFilter`: The filter applied to SVG icons. The SVGs are black by
 *      default, so filters must be used to change their color.
 *  - `iconFilterDisabled`: The filter applied to SVG icons on disabled
 *      elements.
 *
 * All configuration options apart from `svgPath` should be valid CSS values.
 *
 * @param {object} config The global date picker configuration.
 */
function configureGlobalDatePickers(config) {
  const root = document.querySelector(":root");

  for (const [option, value] of Object.entries(config)) {
    switch (option) {
      case "svgPath":
        DATE_PICKER_SVG_PATH = value;
        break;
      case "primaryColor":
        root.style.setProperty("--date-picker-primary-color", value);
        break;
      case "primaryTextColor":
        root.style.setProperty("--date-picker-primary-text-color", value);
        break;
      case "inputBackgroundColor":
        root.style.setProperty("--date-picker-input-bg-color", value);
        break;
      case "inputTextColor":
        root.style.setProperty("--date-picker-input-text-color", value);
        break;
      case "inputTextColorDisabled":
        root.style.setProperty(
          "--date-picker-input-text-color-disabled",
          value
        );
        break;
      case "inputBorder":
        root.style.setProperty("--date-picker-input-border", value);
        break;
      case "inputFocusBorder":
        root.style.setProperty("--date-picker-input-focus-border", value);
        break;
      case "inputBorderRadius":
        root.style.setProperty("--date-picker-input-border-radius", value);
        break;
      case "inputFontSize":
        root.style.setProperty("--date-picker-input-font-size", value);
        break;
      case "popupBackgroundColor":
        root.style.setProperty("--date-picker-popup-bg-color", value);
        break;
      case "popupBorderRadius":
        root.style.setProperty("--date-picker-popup-border-radius", value);
        break;
      case "popupBoxShadow":
        root.style.setProperty("--date-picker-popup-box-shadow", value);
        break;
      case "calendarFontSize":
        root.style.setProperty("--date-picker-calendar-font-size", value);
        break;
      case "daySize":
        root.style.setProperty("--date-picker-day-size", value);
        break;
      case "dayTextColor":
        root.style.setProperty("--date-picker-day-text-color", value);
        break;
      case "dayTextColorDisabled":
        root.style.setProperty("--date-picker-day-text-color-disabled", value);
        break;
      case "dayBorder":
        root.style.setProperty("--date-picker-day-border", value);
        break;
      case "iconSize":
        root.style.setProperty("--date-picker-icon-size", value);
        break;
      case "iconFilter":
        root.style.setProperty("--date-picker-icon-filter", value);
        break;
      case "iconFilterDisabled":
        root.style.setProperty("--date-picker-icon-filter-disabled", value);
        break;
      default:
        throw new DatePickerError(UNKNOWN_CONFIG_OPTION);
    }
  }
}

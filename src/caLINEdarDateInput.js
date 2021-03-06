/**
 * This class controls the date input field element and provides lib users APIs
 * to set, get, listen to date etc.
 */
class CaLINEdarDateInput {
  /* Public APIs */

  /**
   * @param params {Object}
   *    The params provided by users
   *    - calendar {CaLINEdarCalender} The calendar extends `CaLINEdarCalender` so we can get dates to pick
   *    - rtl {bool} Optional. `true` for the RTL mode. Default is `false`
   *    - date {*} Optional. See `setDate`
   *    - event types {Function} Optional. The events to subscribe. See `subscribe` for events.
   *
   *    The params provided by our caLINEdar lib.
   *    Usually a user doesn't have to provide these for the daily usage
   *    if create a CaLINEdarDateInput instance through the `caLINEdar` object.
   *    Having these is for the case if we want to do testing in the future.
   *    - caLINEdar {Object} the caLINEdar object
   *    - input {HTMLInputElement} one input element
   *    - window {Window} the global Window instance
   */
  constructor(params) {
    let {
      rtl,
      date,
      input,
      calendar,
      caLINEdar,
    } = params;

    this.input = input;
    this.caLINEdar = caLINEdar;

    this._win = params.window;
    this._calendar = calendar;
    this._rtl = !!rtl;
    this._events = {};

    if (!this.setDate(date)) {
      this.clearDate();
    }

    for (let prop in params) {
      this.subscribe(prop, params[prop]);
    }

    input.addEventListener("focus", this.onFocus);
    input.addEventListener(caLINEdar.EVENT_PICKER_CLICK, this._onPickerClick);
    input.addEventListener(caLINEdar.EVENT_CLICK_CLEAR_BUTTON, this._onClearBtnClick);
    input.addEventListener(caLINEdar.EVENT_CLICK_OUTSIDE_PICKER, this._onClickOutside);
  }

  /**
   * @return {Date} The currently picked date in the unix time. `null` if none is picked.
   */
  getDate() {
    return this._unixDate ? Math.floor(this._unixDate.getTime() / 1000) : null;
  }

  /**
   * Set the date picked
   *
   * @param date {Date|Integer} 
   *    A unix time or js date based on the unix time.
   *    The definition of a unix time: https://en.wikipedia.org/wiki/Unix_time
   *
   * @return {bool} `true` if set or `false`
   */
  setDate(date) {
    let newDate = null;
    if (date instanceof Date) {
      newDate = date;
    } else if (this.caLINEdar.isInt(date)) {
      // The unit of a unix time is sec
      newDate = new Date(date * 1000);
    }
    
    if (newDate === null) {
      return false;
    }
    // Always align the date and get rid of the ms part.
    newDate = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate()
    );

    let calendar = this._calendar;
    let local = calendar.convertJSDate2LocalDate(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate()
    );
    if (!local) {
      // Don't throw because not a big deal that unable to set a date.
      // However to throw may cause apps go broken down,
      // we don't want our user unable to use the rest of app.
      // But still warn about this case.
      let msg = `CaLINEdarDateInput setDate failed `;
      msg += `because the date: ${date} is unable to be converted into the calendar date`;
      console.warn(msg);
      return false;
    }

    this._unixDate = newDate;
    this._localDate = local;
    this.input.value = calendar.toLocaleDateString(this._unixDate);
    return true;
  }

  /**
   * Clear the date picked
   */
  clearDate() {
    this._unixDate =
    this._localDate = null;
    this.input.value = this._calendar.getDateStringPlaceholder();
  }

  /**
   * Open the calendar to let user pick a date
   */
  openCalendar() {
    if (this.caLINEdar.getCurrentDateInput() !== this) {
      this.caLINEdar.setCurrentDateInput(this);
      this._win.requestAnimationFrame(() => this._openCalendar());
    } else {
      if (!this.caLINEdar.isCalendarOpen()) {
        this._win.requestAnimationFrame(() => this._openCalendar());
      }
    }
  }

  /**
   * Close the calendar
   */
  closeCalendar() {
    if (this.caLINEdar.getCurrentDateInput() !== this) {
      return;
    }
    // Currently we don't handle key inputs.
    // In case the value is changed by key inputs.
    // Before closing, let's set the date again
    // to make sure the date correct.
    // TODO: It is good to support key inputs.
    // However for the schedule and scope,
    // we cannot make everything done in the 1st version.
    // Mark a TODO here to remind us this for the next version.
    if (!this.setDate(this._unixDate)) {
      this.clearDate();
    }
    this.caLINEdar.closeCalendar();
  }

  /**
   * Subscribe a event. The Valid events are:
   * - onChange: Called when the date picked is changed
   *
   * @param eventType {Stirng} The event type
   * @param handler {Functoin}
   *    The event handler. 
   *    When invoked, this CaLINEdarDateInput instance will be passed in.
   */
  subscribe(eventType, handler) {
    if (!this._validEventTypes) {
      this._validEventTypes = [ "onChange" ];
    }

    if (typeof handler === "function" &&
        this._validEventTypes.indexOf(eventType) >= 0
    ) {
      let queue = this._events[eventType] || [];
      queue.push(handler);
      this._events[eventType] = queue;
    }
  }


  /**
   * Unsubscribe a event
   *
   * @param eventType {Stirng} The event type
   * @param handler {Functoin} The event handler to unsubscribe
   */
  unsubscribe(eventType, handler) {
    let queue = this._events[eventType];
    if (queue && typeof handler === "function") {
      this._events[eventType] = queue.filter(h => h !== handler);
    }
  }

  /* Public APIs End */

  // DOM events

  onFocus = e => {
    if (caLINEdar.isSmallScreen()) {
      // In a mobile device, usually focusing an input would
      // bring up a virtual keyboard, which would break our calendar.
      // So we have to force blur to prevent that.
      // Here we do `blur` 2 times.
      // A bit rude but making sure no virtual keyboard is important.
      this.input.blur();
      this._win.requestAnimationFrame(() => this.input.blur());
    }
    this.openCalendar();
  }

  // DOM events end

  // caLINEdar events

  _onClickOutside = e => {
    e.preventDefault();
    e.stopPropagation();
    this.closeCalendar();
  }

  _onClearBtnClick = e => {
    e.preventDefault();
    e.stopPropagation();
    this.clearDate();
    this._notify("onChange");
  }
  
  _onPickerClick = async e => {
    e.preventDefault();
    e.stopPropagation();

    let { picker, target } = e.detail;

    let cls = target.classList;
    if (cls.contains("caLINEdar-panel__btn")) {
      this._onPanelButtonClick(picker, target);
    } else if (
      cls.contains("caLINEdar-table-cell") &&
      target.tagName.toLowerCase() === "td"
    ) {
      this._onPick(picker, target);
    }
  }

  _onPanelButtonClick(picker, target) {
    let value = this._unserializeValue(
      picker.getAttribute("data-caLINEdar-value"));

    // Is Clicking on a year/month-picking button?
    let btnValue = target.getAttribute("data-caLINEdar-value");
    switch (btnValue) {
      case "year-picker-btn":
        if (picker.id !== this.caLINEdar.ID_YEAR_PICKER) {
          this._showYearPicker(value.year, value.month);
          return;
        }
        break;

      case "month-picker-btn":
        if (picker.id !== this.caLINEdar.ID_MONTH_PICKER) {
          this._showMonthPicker(value.year, value.month);
          return;
        }
        break;
    }

    // Is going left or right?
    let goLeft = target.classList.contains("left-btn");
    let goRight = target.classList.contains("right-btn");
    switch (picker.id) {
      case this.caLINEdar.ID_DATE_PICKER:
        if (goLeft) {
          this._flipDatePicker(value.year, value.month, "left");
          return;
        }
        if (goRight) {
          this._flipDatePicker(value.year, value.month, "right");
          return;
        }
        break;

      case this.caLINEdar.ID_YEAR_PICKER:
        if (goLeft) {
          this._flipYearPicker(value.anchorYear, value.anchorMonth, value.years, "left");
          return;
        }
        if (goRight) {
          this._flipYearPicker(value.anchorYear, value.anchorMonth, value.years, "right");
          return;
        }
        break;
    }
  }

  _onPick(picker, target) {
    let value = target.getAttribute("data-caLINEdar-value");
    if (!value) {
      return;
    }

    switch (picker.id) {
      case this.caLINEdar.ID_DATE_PICKER:
        value = this._unserializeValue(value);
        
        let jsDate = this._calendar.convertLocalDate2JSDate(
          value.year, value.month, value.date);
        jsDate = new Date(jsDate.year, jsDate.month, jsDate.date);

        if (this.setDate(jsDate)) {
          // The date has changed so refresh the date picker
          this._showDatePicker(
            this._localDate.year,
            this._localDate.month, 
            this._localDate
          );
          this._notify("onChange");
        }
        break;

      case this.caLINEdar.ID_MONTH_PICKER:
        value = this._unserializeValue(value);
        this._showDatePicker(value.year, value.month, this._localDate);
        break;

      case this.caLINEdar.ID_YEAR_PICKER:
        let year = parseInt(value);
        let data = picker.getAttribute("data-caLINEdar-value");
        data = this._unserializeValue(data);
        this._showDatePicker(year, data.anchorMonth, this._localDate);
        break;
    }
  }

  // caLINEdar events end

  _notify(eventType) {
    let queue = this._events[eventType];
    if (queue && queue.length > 0) {
      this._win.requestAnimationFrame(() => {
        queue.forEach(handler => handler(this));
      });
    }
  }

  _openCalendar() {
    let datePicked = this._localDate;
    let dateLocal = datePicked || this._calendar.getNow({ fallback: "last-date" });
    let params = this._getDatePickerParams(dateLocal.year, dateLocal.month, datePicked);
    this.caLINEdar.openCalendar(this.input, params);
  }

  _showDatePicker(year, month, datePicked) {
    let params = this._getDatePickerParams(year, month, datePicked);
    this.caLINEdar.showDatePicker(params);
  }

  _showMonthPicker(year, monthPicked) {
    this.caLINEdar.showMonthPicker(this._getMonthPickerParams(year, monthPicked));
  }

  _showYearPicker(anchorYear, anchorMonth) {
    this.caLINEdar.showYearPicker(this._getYearPickerParams(anchorYear, anchorMonth));
  }

  _flipDatePicker(year, month, dir) {
    let months = this._calendar.getMonths(year);
    let next = this._rtl ? dir === "left" : dir === "right";
    let target = next ? 
      this._calcNextLocalMonth(year, month, months) :
      this._calcPrevLocalMonth(year, month, months);
    let params = this._getDatePickerParams(target.year, target.month, this._localDate);
    this.caLINEdar.showDatePicker(params);
  }

  _flipYearPicker(anchorYear, anchorMonth, years, dir) {
    let factor = dir === "right" ? 1 : -1;
    factor = this._rtl ? factor * -1 : factor;
    anchorYear = anchorYear + factor * years.length;
    this.caLINEdar.showYearPicker(this._getYearPickerParams(anchorYear, anchorMonth));
  }

  _getPickerBtnsParams(year, month) {
    let format = this._calendar.getDateStringFormat(year, month);
    let pickerBtns = [];
    pickerBtns.push({
      text: format.year.text,
      value: "year-picker-btn",
    });
    pickerBtns.push({
      text: format.month.text,
      value: "month-picker-btn",
    });
    if (format.year.pos > format.month.pos) {
      pickerBtns.reverse();
    }
    return pickerBtns;
  }

  _getDatePickerParams(year, month, datePicked) {
    let calendar = this._calendar;
    let pickerBtns = this._getPickerBtnsParams(year, month);
    let days = calendar.getDays();
    let weekHeaders = days.map(d => d.text);

    let months = calendar.getMonths(year);
    let prev = this._calcPrevLocalMonth(year, month, months);
    let next = this._calcNextLocalMonth(year, month, months);
    let noMoreLeft = !calendar.isDateInCalendar(prev.year, prev.month);
    let noMoreRight = !calendar.isDateInCalendar(next.year, next.month);
    if (this._rtl) {
      [ noMoreRight, noMoreLeft] = [ noMoreLeft, noMoreRight ];
    }

    let value = this._serializeValue({ year, month });
    let dates = this._getLocalDatesToDisplay(year, month, datePicked);
    return {
      dates,
      value,
      pickerBtns,
      weekHeaders,
      noMoreLeft,
      noMoreRight,
      rtl: this._rtl,
    };
  }

  _getMonthPickerParams(year, monthPicked) {
    let months = this._calendar.getMonths(year);
    months = months.map(m => {
      m.value = this._serializeValue({
        year,
        month: m.value
      });
      return m;
    });
    let pickerBtns = this._getPickerBtnsParams(year, monthPicked);
    let value = this._serializeValue({ year, month: monthPicked });
    return {
      value,
      months,
      pickerBtns,
      rtl: this._rtl,
      noMoreLeft: true,
      noMoreRight: true,
    };
  }

  _getYearPickerParams(anchorYear, anchorMonth) {
    const COUNT = this.caLINEdar.MAX_COUNT_YEAR_IN_YEAR_PICKER;
    // Collect years to pick (try to put the piced year in the center)
    let years = [];
    let half = Math.floor(COUNT / 2);
    for (let i = half; i > 0; --i) {
      years.push(anchorYear - i);
    }
    years.push(anchorYear);
    let rest = COUNT - years.length;
    for (let i = 1; i <= rest; ++i) {
      years.push(anchorYear + i);
    }

    let noMoreLeft = !this._calendar.isDateInCalendar(years[0] - 1);
    let noMoreRight = !this._calendar.isDateInCalendar(years[COUNT - 1] + 1);
    if (this._rtl) {
      [ noMoreRight, noMoreLeft] = [ noMoreLeft, noMoreRight ];
    }

    // Remove years not in the calendar
    years = years.filter(y => this._calendar.isDateInCalendar(y));

    // Build the pramas
    let value = this._serializeValue({ 
      anchorYear,
      anchorMonth,
      years: years.slice()
    });
    years = years.map(y => {
      return {
        text: y,
        value: y,
      };
    });
    return {
      value,
      years,
      noMoreLeft,
      noMoreRight,
      rtl: this._rtl,
    };
  }

  _datesEqual(a, b) {
    return a && b && 
           a.year === b.year && 
           a.month === b.month && 
           a.date === b.date;
  }

  _serializeValue(v) {
    return JSON.stringify(v);
  }

  _unserializeValue(valueStr) {
    try {
      return JSON.parse(valueStr);
    } catch (e) {
      return null;
    }
  }

  _calcPrevLocalMonth(year, month, months) {
    let currMonthIdx = months.findIndex(m => m.value === month);
    let prevYear = year;
    let prevMonth = -1;
    if (currMonthIdx === 0) {
      // OK the previous month is the last month in the last year
      prevYear -= 1;
      prevMonth = months[months.length - 1].value;
    } else {
      prevMonth = months[currMonthIdx - 1].value;
    }
    return {
      year: prevYear,
      month: prevMonth
    };
  }

  _calcNextLocalMonth(year, month, months) {
    let currMonthIdx = months.findIndex(m => m.value === month);
    let nextYear = year;
    let nextMonth = -1;
    if (currMonthIdx === months.length - 1) {
      // OK the next month is the 1st month in the next year
      nextYear += 1;
      nextMonth = months[0].value;
    } else {
      nextMonth = months[currMonthIdx + 1].value;
    }
    return {
      year: nextYear,
      month: nextMonth
    };
  }

  // It may cost a bit that calendar calculates dates
  // so we cache dates here.
  _getDatesWithCache(year, month) {
    let cache = this._datesCache;
    if (!cache) {
      cache = this._datesCache = {};
    }
    if (!cache[year]) {
      cache[year] = {};
    }
    let dates = cache[year][month];
    if (dates === undefined) {
      cache[year][month]
        = dates = this._calendar.getDates(year, month);
    }
    return dates && dates.map(d => Object.assign({}, d));
  }

  _getLocalDatesToDisplay(year, month, datePicked) {
    let calendar = this._calendar;
    let days = calendar.getDays();
    let months = calendar.getMonths(year);
    let dates = this._getDatesWithCache(year, month);
  
    // For example maybe the 1st date is on Wed.
    // Then we are having 3 empty dates in the start
    let firstDayIdx = days.findIndex(d => d.value === dates[0].day);
    let emptyCountInStart = firstDayIdx;
    let prevDates = null;
    if (emptyCountInStart > 0) {
      let prev = this._calcPrevLocalMonth(year, month, months);
      prevDates = this._getDatesWithCache(prev.year, prev.month);
    }
    if (prevDates) {
      for (let i = prevDates.length - 1; emptyCountInStart > 0, i >= 0;) {
        prevDates[i].grayOut = true;
        dates.unshift(prevDates[i]);
        --i;
        --emptyCountInStart;
      }
    }
    while (emptyCountInStart > 0) {
      // Still empty slots in the start but we can't find dates for them,
      // just fill in `null` to make them empty dates
      dates.unshift(null);
      --emptyCountInStart;
    }

    // Let's see how many empty dates in the tail
    let emptyCountInTail = this.caLINEdar.MAX_COUNT_DATES_IN_DATE_PICKER - dates.length;
    let nextDates = null;
    if (emptyCountInTail > 0) {
      let next = this._calcNextLocalMonth(year, month, months);
      nextDates = this._getDatesWithCache(next.year, next.month);
    }
    if (nextDates) {
      for (let i = 0; emptyCountInTail > 0, i < nextDates.length;) {
        nextDates[i].grayOut = true;
        dates.push(nextDates[i]);
        ++i;
        --emptyCountInTail;
      } 
    }
    while (emptyCountInTail > 0) {
      // Still empty slots in the tail but we can't find dates for them,
      // just fill in `null` to make them empty dates
      dates.push(null);
      --emptyCountInTail;
    }

    dates.forEach(d => {
      if (d) {
        d.special = d.holiday && !d.grayOut;
        d.picked = this._datesEqual(d, datePicked);
        d.text = "" + d.date;
        d.value = this._serializeValue(d);
      }
    });
    return dates;
  }
}

module.exports = CaLINEdarDateInput;

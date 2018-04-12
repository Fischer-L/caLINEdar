import "./caLINEdar.scss";

const caLINEdar = {
  init(window) {
    this._win = window;
    this._doc = window.document;
  },

  // UI methods

  _createInput() {
    if (!this._inputTemplate) {
      this._inputTemplate = this._doc.createElement("input");
      this._inputTemplate.classList.add("caLINEdar-input");
      this._inputTemplate.type = "text";
    }
    return this._inputTemplate.cloneNode(false);
  },

  /**
   * A panel looks like below:
   * <div class="caLINEdar-panel">
   *   <div class="caLINEdar-panel__btn left-btn"></div>
   *   <div class="caLINEdar-subpanel">
   *     <div class="caLINEdar-panel__btn picker-btn"></div>
   *     <div class="caLINEdar-panel__btn picker-btn"></div>
   *   </div>
   *   <div class="caLINEdar-panel__btn right-btn"></div>
   * </div>
   */
  _createPanel() {
    if (!this._panelTemplate) {
      // Lazy creation
      this._panelTemplate = this._doc.createElement("div");
      this._panelTemplate.classList.add("caLINEdar-panel");
      // This is safe innerHTML because generated by us.
      this._panelTemplate.innerHTML = `
        <div class="caLINEdar-panel__btn left-btn"></div>
        <div class="caLINEdar-subpanel">
          <div class="caLINEdar-panel__btn picker-btn"></div>
          <div class="caLINEdar-panel__btn picker-btn"></div>
        </div>
        <div class="caLINEdar-panel__btn right-btn"></div>
      `;
    }
    // To clone a node is basically faster than creating one
    // so we only create once above.
    return this._panelTemplate.cloneNode(true);
  },

  /**
   * A table looks like below:
   * <table class="caLINEdar-table">
   *   <tr class="caLINEdar-table-headers">
   *     <th class="caLINEdar-table-cell">Su</th>
   *     <th class="caLINEdar-table-cell">Mo</th>
   *     <th class="caLINEdar-table-cell">Tu</th>
   *     <th class="caLINEdar-table-cell">We</th>
   *     <th class="caLINEdar-table-cell">Th</th>
   *     <th class="caLINEdar-table-cell">Fr</th>
   *     <th class="caLINEdar-table-cell">Sa</th>
   *   </tr>
   *   <tr class="caLINEdar-table-values">
   *     <td class="caLINEdar-table-cell picked">1</td>
   *     <td class="caLINEdar-table-cell">2</td>
   *     <td class="caLINEdar-table-cell">3</td>
   *     <td class="caLINEdar-table-cell">4</td>
   *     <td class="caLINEdar-table-cell">5</td>
   *     <td class="caLINEdar-table-cell">6</td>
   *     <td class="caLINEdar-table-cell">7</td>
   *   </tr>
   * </table>
   *
   */
  _createTable(options = {}) {
    if (!this._tableTemplate) {
      this._tableTemplate = this._doc.createElement("table");
      this._tableTemplate.classList.add("caLINEdar-table");
    }
    let table = this._tableTemplate.cloneNode(false);

    if (options.headerCount > 0) {
      if (!this._tableThTemplate) {
        this._tableThTemplate = this._doc.createElement("th");
        this._tableThTemplate.classList.add("caLINEdar-table-cell");
      }
      let header = this._createTableRow({ cellCount: 0 });
      header.classList.add("caLINEdar-table-headers");
      for (let i = 0; i < options.headerCount; ++i) {
        header.appendChild(this._tableThTemplate.cloneNode(false));
      }
      table.appendChild(header);
    }
    return table;
  },

  _createTableRow(options = {}) {
    if (!this._tableTrTemplate) {
      this._tableTrTemplate = this._doc.createElement("tr");
    }
    let tr = this._tableTrTemplate.cloneNode(false);

    if (options.cellCount > 0) {
      if (!this._tableTdTemplate) {
        this._tableTdTemplate = this._doc.createElement("td");
        this._tableTdTemplate.classList.add("caLINEdar-table-cell");
      }
      for (let i = 0; i < options.cellCount; ++i) {
        tr.appendChild(this._tableTdTemplate.cloneNode(false));
      }
    }

    return tr;
  },

  _updateTableCells(table, values) {
    let rows = table.querySelectorAll(".caLINEdar-table-values");
    let cellCount = rows[0].querySelectorAll(".caLINEdar-table-cell").length;

    let valuesByRows = [];
    for (let i = 0; i < values.length;) {
      let data = [];
      for (let j = 0; j < cellCount; ++j, ++i) {
        data.push(values[i] || null);
      }
      valuesByRows.push(data);
    }

    for (let i = 0; i < rows.length; ++i) {
      let row = rows[i];
      let data = valuesByRows[i] || null;
      let cells = row.querySelectorAll(".caLINEdar-table-cell");
      for (let j = 0; j < cellCount; ++j) {
        if (data && data[j]) {
          cells[j].textContent = data[j].text; 
          cells[j].setAttribute("data-caLINEdar-value", data[j].value);
          cells[j].classList.add("active");
          if (data[j].picked) {
            cells[j].classList.add("picked");
          }
          if (data[j].special) {
            cells[j].classList.add("special");
          }
          if (data[j].grayOutDate) {
            cells[j].classList.add("gray-out-date");
          }
        } else {
          cells[j].classList.remove("picked");
          cells[j].classList.remove("active");
          cells[j].classList.remove("special");
          cells[j].classList.remove("gray-out-date");
        }
      }
    }
  },

  _createEmptyPicker(options = {}) {
    let rowCount = options.rowCount || 0;
    let cellCount = options.cellCount || 0;
    let headerCount = options.headerCount || 0;
    let pickerBtnCount = options.pickerBtnCount || 0;
    if (cellCount <= 0 || rowCount <= 0 || 
        headerCount < 0 || pickerBtnCount < 0) {
      return null;
    }

    let picker = this._doc.createElement("div");

    let panel = this._createPanel();
    let btns = panel.querySelectorAll(".caLINEdar-panel__btn.picker-btn");
    for (let i = btns.length - 1; i >= pickerBtnCount; --i) {
      btns[i].style.display = "none"; 
    }
    picker.appendChild(panel);

    let table = this._createTable({ headerCount });
    for (let i = 0; i < rowCount; ++i) {
      let row = this._createTableRow({ cellCount });
      row.classList.add("caLINEdar-table-values");
      table.appendChild(row);
    }
    picker.appendChild(table);

    return picker;
  },

  _createYearPicker(years) {
    let picker = this._createEmptyPicker({
      pickerBtnCount: 1,
      headerCount: 0,
      cellCount: 3,
      rowCount: 3,
    });
    picker.classList.add("caLINEdar-year-picker");

    let btn = picker.querySelector(".caLINEdar-panel__btn.picker-btn");
    btn.textContent = years.find(y => y.picked).text;

    let table = picker.querySelector(".caLINEdar-table");
    this._updateTableCells(table, years);

    return picker;
  },

  _openCalendarHolder() {
    if (!this._calendar) {
      this._calendar = this._doc.createElement("div");
      this._calendar.classList.add("caLINEdar");
      this._doc.body.appendChild(this._calendar);
    }
    this._calendar.style.display = "";
  },

  _closeCalendarHolder() {
    if (this._calendar) {
      this._calendar.style.display = "none";
    }
  },

  async positionCalendar(window, anchorInput) {
    if (!this._calendar) {
      return;
    }
    return new Promise(resolve => {
      window.requestAnimationFrame(() => {
        let winW = window.innerWidth;
        let winH = window.innerHeight;

        let calendarW = parseInt(this._calendar.getAttribute("data-caLINEdar-width"));
        let calendarH = parseInt(this._calendar.getAttribute("data-caLINEdar-height"));
        if (!calendarW) {
          // `getBoundingClientRect` is expensive so cache it. 
          let rect = this._calendar.getBoundingClientRect();
          calendarW = rect.width;
          calendarH = rect.height;
          this._calendar.setAttribute("data-caLINEdar-width", calendarW);
          this._calendar.setAttribute("data-caLINEdar-height", calendarH)
        }

        // Unfortunately, we can't cache `anchorInput`
        // because its dimesion may change, not in our control.
        let inputRect = anchorInput.getBoundingClientRect();

        // First decdie our calendar on top of or below `anchorInput`
        if (winH - inputRect.bottom > calendarH + 10) {
          // OK there is enough room below `anchorInput`
          this._calendar.classList.remove("on-top");
          this._calendar.style.top = (inputRect.bottom + 8) + "px";
        } else {
          this._calendar.classList.add("on-top");
          this._calendar.style.top = (inputRect.top - calendarH - 8) + "px";
        }

        // Second decdie our calendar's horizontal postion
        if (winW - inputRect.left > calendarW + 10) {
          // OK there is enough room on the right side of `anchorInput`
          this._calendar.classList.remove("arrow-on-right");
          this._calendar.style.left = inputRect.left + "px";
        } else {
          this._calendar.classList.add("arrow-on-right");
          this._calendar.style.left = (inputRect.right - calendarW) + "px";
        }

        resolve();
      });
    });
  },

  async openCalendar(anchorInput, pickerBtns, weekHeaders, dates) {
    this._openCalendarHolder();
    await this.openDatePicker(pickerBtns, weekHeaders, dates);
    await this.positionCalendar(this._win, anchorInput);
  },

  openDatePicker(pickerBtns, weekHeaders, dates) {
    if (!this._calendar) {
      throw new Error("Should open the calendar once first then open the data picker");
    }
    if (!this._datePicker) {
      this._datePicker = this._createEmptyPicker({
        pickerBtnCount: 2,
        headerCount: 7,
        cellCount: 7,
        rowCount: 6,
      });
      this._datePicker.classList.add("caLINEdar-date-picker");
      this._calendar.appendChild(this._datePicker);
    }
    this.closeMonthPicker();
    this._datePicker.style.display = "";
    return this.updateDatePicker(pickerBtns, weekHeaders, dates);
  },

  closeDatePicker() {
    if (this._datePicker) {
      this._datePicker.style.display = "none";
    }
  },

  async updateDatePicker(pickerBtns, weekHeaders, dates) {
    return new Promise(resolve => {
      this._win.requestAnimationFrame(() => {
        let picker = this._datePicker;

        let btns = picker.querySelectorAll(".caLINEdar-panel__btn.picker-btn");
        for (let i = 0; i < pickerBtns.length; ++i) {
          btns[i].textContent = pickerBtns[i].text;
          btns[i].setAttribute("data-caLINEdar-value", pickerBtns[i].value);
        }

        let table = picker.querySelector(".caLINEdar-table");
        let headers = table.querySelector(".caLINEdar-table-headers")
                           .querySelectorAll(".caLINEdar-table-cell");
        for (let i = 0; i < headers.length; ++i) {
          headers[i].textContent = weekHeaders[i];
        }

        this._updateTableCells(table, dates);
        resolve();
      });
    });
  },

  openMonthPicker(months) {
    if (!this._calendar) {
      throw new Error("Should open the calendar once first then open the month picker");
    }
    if (!this._monthPicker) {
      this._monthPicker = this._createEmptyPicker({
        pickerBtnCount: 1,
        headerCount: 0,
        cellCount: 4,
        rowCount: 3,
      });
      this._monthPicker.classList.add("caLINEdar-month-picker");
      this._calendar.appendChild(this._monthPicker);
    }
    this.closeDatePicker();
    this._monthPicker.style.display = "";
    return this.updateMonthPicker(months);
  },

  closeMonthPicker() {
    if (this._monthPicker) {
      this._monthPicker.style.display = "none";
    }
  },

  updateMonthPicker(months) {
    return new Promise(resolve => {
      this._win.requestAnimationFrame(() => {
        let picker = this._monthPicker;

        let btn = picker.querySelector(".caLINEdar-panel__btn.picker-btn");
        btn.textContent = months.find(m => m.picked).text;

        let table = picker.querySelector(".caLINEdar-table");
        this._updateTableCells(table, months);
        resolve();
      });
    });
  },

  // UI methods end
};

module.exports = caLINEdar;

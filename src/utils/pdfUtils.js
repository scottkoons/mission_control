import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { getMonthDisplayName, groupTasksByMonth, getMonthKey } from './dateUtils';
import { multiSort, SORT_ASC } from './sortUtils';

// Colors for PDF
const colors = {
  headerBg: '#9ca3af',     // Gray for table headers
  text: '#1f2937',         // Dark text
  textLight: '#ffffff',    // White text
  border: '#d1d5db',       // Light gray border
  danger: '#dc2626',       // Red for overdue
};

// Helper to convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Format date as "7 Jan" style
const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(date, 'd MMM');
};

// Get date status: 'overdue', 'soon', or 'normal'
const getDateStatus = (dateStr) => {
  if (!dateStr) return 'normal';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';  // Before today = red
  if (diffDays <= 3) return 'soon';     // Today or within 3 days = yellow
  return 'normal';                       // More than 3 days = normal
};

// Get text color based on date status
const getDateColor = (dateStr) => {
  const status = getDateStatus(dateStr);
  if (status === 'overdue') return [220, 38, 38];   // Red
  if (status === 'soon') return [202, 138, 4];      // Yellow/amber
  return [31, 41, 55];                               // Normal dark text
};

// Add header and page numbers to all pages
const addHeaderAndPageNumbers = (doc) => {
  const totalPages = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const generatedDate = format(new Date(), 'M/d/yyyy');

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);

    // Header - generated date left aligned on all pages
    doc.text(`Generated Date: ${generatedDate}`, margin, 15);

    // Page number - bottom right
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
  }
};

// Get table configuration based on orientation
const getTableConfig = (tableWidth, orientation, tasks) => {
  const isLandscape = orientation === 'landscape';

  if (isLandscape) {
    // Landscape: Task, Notes, Draft Date, Final Date
    const taskColWidth = tableWidth * 0.25;
    const notesColWidth = tableWidth * 0.50;
    const dateColWidth = tableWidth * 0.125;

    return {
      head: [['Task', 'Notes', 'Draft Date', 'Final Date']],
      body: tasks.map((task) => [
        task.taskName || '',
        task.notes || '',
        formatShortDate(task.draftDue),
        formatShortDate(task.finalDue),
      ]),
      columnStyles: {
        0: { cellWidth: taskColWidth },
        1: { cellWidth: notesColWidth },
        2: { cellWidth: dateColWidth, halign: 'right' },
        3: { cellWidth: dateColWidth, halign: 'right' },
      },
      draftDateCol: 2,
      finalDateCol: 3,
    };
  } else {
    // Portrait: Task, Draft Date, Final Date (no Notes)
    const taskColWidth = tableWidth * 0.60;
    const dateColWidth = tableWidth * 0.20;

    return {
      head: [['Task', 'Draft Date', 'Final Date']],
      body: tasks.map((task) => [
        task.taskName || '',
        formatShortDate(task.draftDue),
        formatShortDate(task.finalDue),
      ]),
      columnStyles: {
        0: { cellWidth: taskColWidth },
        1: { cellWidth: dateColWidth, halign: 'right' },
        2: { cellWidth: dateColWidth, halign: 'right' },
      },
      draftDateCol: 1,
      finalDateCol: 2,
    };
  }
};

// Export PDF - Flat View
export const exportPDFFlat = (tasks, notes = '', orientation = 'landscape', sortMode = 'date', filename = 'tasks-flat.pdf') => {
  const doc = new jsPDF(orientation);
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const tableWidth = pageWidth - (margin * 2);

  // Filter out completed tasks
  const activeTasks = tasks.filter((task) => !task.completedAt);

  // Separate dated and unscheduled tasks
  let dated = activeTasks.filter((t) => t.draftDue || t.finalDue);
  let unscheduled = activeTasks.filter((t) => !t.draftDue && !t.finalDue);

  // Sort based on sortMode (matching FlatView.jsx logic exactly)
  if (sortMode === 'manual') {
    // Manual mode: sort by month first, then by sortOrder within each month
    dated.sort((a, b) => {
      const monthA = getMonthKey(a.draftDue) || '';
      const monthB = getMonthKey(b.draftDue) || '';
      if (monthA !== monthB) {
        return monthA.localeCompare(monthB);
      }
      // Within same month, use sortOrder (then createdAt for stability)
      const orderDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
      if (orderDiff !== 0) return orderDiff;
      // Secondary sort by createdAt for tasks with same/no sortOrder
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });
    // Unscheduled tasks also sort by sortOrder
    unscheduled.sort((a, b) => {
      const orderDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
      if (orderDiff !== 0) return orderDiff;
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });
  } else {
    // Date mode: sort by draft due date
    dated = multiSort(dated, [{ field: 'draftDue', direction: SORT_ASC }]);
  }

  const sortedTasks = [...dated, ...unscheduled];

  let yPos = 25;

  // Section title
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
  doc.text('All Tasks', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Get table configuration based on orientation
  const tableConfig = getTableConfig(tableWidth, orientation, sortedTasks);

  // Table
  doc.autoTable({
    startY: yPos,
    head: tableConfig.head,
    body: tableConfig.body,
    headStyles: {
      fillColor: [156, 163, 175],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [31, 41, 55],
      cellPadding: 4,
      lineColor: [209, 213, 219],
      lineWidth: 0.5,
    },
    columnStyles: tableConfig.columnStyles,
    margin: { left: margin, right: margin },
    tableWidth: tableWidth,
    didParseCell: function (data) {
      if (data.section === 'body') {
        const task = sortedTasks[data.row.index];
        if (data.column.index === tableConfig.draftDateCol && task.draftDue) {
          data.cell.styles.textColor = getDateColor(task.draftDue);
        }
        if (data.column.index === tableConfig.finalDateCol && task.finalDue) {
          data.cell.styles.textColor = getDateColor(task.finalDue);
        }
      }
    },
  });

  yPos = doc.lastAutoTable.finalY + 8;

  // Notes section
  if (notes) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
    doc.text('Notes:', margin, yPos);
    yPos += 5;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(notes, tableWidth);
    doc.text(splitNotes, margin, yPos);
  }

  addHeaderAndPageNumbers(doc);
  doc.save(filename);
};

// Export PDF - Grouped View
export const exportPDFGrouped = (tasks, monthlyNotes = {}, dateMode = 'draft', orientation = 'landscape', sortMode = 'date', filename = 'tasks-grouped.pdf') => {
  const doc = new jsPDF(orientation);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const tableWidth = pageWidth - (margin * 2);

  // Filter out completed tasks, then group by month
  const activeTasks = tasks.filter((task) => !task.completedAt);
  const dateField = dateMode === 'draft' ? 'draftDue' : 'finalDue';
  const { groups, sortedKeys } = groupTasksByMonth(activeTasks, dateField);

  let yPos = 25;
  let isFirstSection = true;

  sortedKeys.forEach((monthKey) => {
    // Sort tasks within each month based on sortMode (matching Dashboard.jsx logic exactly)
    let monthTasks;
    if (sortMode === 'manual') {
      // Manual mode: sort by sortOrder first, then by draftDue, then by createdAt for stability
      monthTasks = multiSort(groups[monthKey], [
        { field: 'sortOrder', direction: SORT_ASC },
        { field: 'draftDue', direction: SORT_ASC },
        { field: 'createdAt', direction: SORT_ASC },
      ]);
    } else {
      // Date mode: sort by draftDue first, then by sortOrder, then by createdAt
      monthTasks = multiSort(groups[monthKey], [
        { field: 'draftDue', direction: SORT_ASC },
        { field: 'sortOrder', direction: SORT_ASC },
        { field: 'createdAt', direction: SORT_ASC },
      ]);
    }
    const monthName = getMonthDisplayName(monthKey);
    const notes = monthlyNotes[monthKey] || '';

    // Estimate section height
    const estimatedHeight = 20 + (monthTasks.length * 12) + (notes ? 30 : 10);

    // Check if we need a new page (but never on first section to avoid blank first page)
    if (!isFirstSection && yPos + estimatedHeight > pageHeight - 30) {
      doc.addPage();
      yPos = 30; // Start below header on new pages
    }
    isFirstSection = false;

    // Month title - centered
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
    doc.text(monthName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    // Get table configuration based on orientation
    const tableConfig = getTableConfig(tableWidth, orientation, monthTasks);

    // Table
    doc.autoTable({
      startY: yPos,
      head: tableConfig.head,
      body: tableConfig.body,
      headStyles: {
        fillColor: [156, 163, 175],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [31, 41, 55],
        cellPadding: 4,
        lineColor: [209, 213, 219],
        lineWidth: 0.5,
      },
      columnStyles: tableConfig.columnStyles,
      margin: { left: margin, right: margin },
      tableWidth: tableWidth,
      didParseCell: function (data) {
        if (data.section === 'body') {
          const task = monthTasks[data.row.index];
          if (data.column.index === tableConfig.draftDateCol && task.draftDue) {
            data.cell.styles.textColor = getDateColor(task.draftDue);
          }
          if (data.column.index === tableConfig.finalDateCol && task.finalDue) {
            data.cell.styles.textColor = getDateColor(task.finalDue);
          }
        }
      },
    });

    yPos = doc.lastAutoTable.finalY + 6;

    // Notes section
    if (notes) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
      doc.text('Notes:', margin, yPos);
      yPos += 5;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const splitNotes = doc.splitTextToSize(notes, tableWidth);
      doc.text(splitNotes, margin, yPos);
      yPos += splitNotes.length * 4 + 10;
    } else {
      yPos += 15;
    }
  });

  addHeaderAndPageNumbers(doc);
  doc.save(filename);
};

// Export PDF - Calendar View
export const exportPDFCalendar = (tasks, dateFilter = 'all', orientation = 'landscape', filename = 'tasks-calendar.pdf') => {
  const doc = new jsPDF(orientation);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Get unique months with non-recurring tasks
  const monthsWithTasks = new Set();
  tasks.forEach((task) => {
    if (task.isRecurring || task.completedAt) return;
    if (task.draftDue) monthsWithTasks.add(getMonthKey(task.draftDue));
    if (task.finalDue) monthsWithTasks.add(getMonthKey(task.finalDue));
  });

  const sortedMonths = Array.from(monthsWithTasks).sort();

  if (sortedMonths.length === 0) {
    doc.setFontSize(14);
    doc.text('No tasks to display', pageWidth / 2, pageHeight / 2, { align: 'center' });
    doc.save(filename);
    return;
  }

  sortedMonths.forEach((monthKey, index) => {
    if (index > 0) doc.addPage();

    const [year, month] = monthKey.split('-');
    const currentDate = new Date(parseInt(year), parseInt(month) - 1, 1);

    // Month title
    doc.setFontSize(16);
    doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
    doc.text(format(currentDate, 'MMMM yyyy'), pageWidth / 2, 20, { align: 'center' });

    // Calendar grid
    const startX = 20;
    const startY = 30;
    const cellWidth = (pageWidth - 40) / 7;
    const cellHeight = (pageHeight - 50) / 7;

    // Day headers
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    doc.setFontSize(10);
    doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
    weekDays.forEach((day, i) => {
      doc.text(day, startX + i * cellWidth + cellWidth / 2, startY, { align: 'center' });
    });

    // Calendar days
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    let row = 0;
    let col = 0;

    days.forEach((day) => {
      const x = startX + col * cellWidth;
      const y = startY + 5 + row * cellHeight;

      // Cell border
      doc.setDrawColor(hexToRgb(colors.border).r, hexToRgb(colors.border).g, hexToRgb(colors.border).b);
      doc.rect(x, y, cellWidth, cellHeight);

      // Day number
      const isCurrentMonth = isSameMonth(day, currentDate);
      doc.setFontSize(9);
      doc.setTextColor(isCurrentMonth ? 31 : 156, isCurrentMonth ? 41 : 163, isCurrentMonth ? 55 : 175);
      doc.text(format(day, 'd'), x + cellWidth - 5, y + 5, { align: 'right' });

      // Tasks for this day
      let taskY = y + 12;
      tasks.forEach((task) => {
        if (task.isRecurring || task.completedAt) return;

        let showTask = false;
        let taskType = '';

        if ((dateFilter === 'all' || dateFilter === 'draft') && task.draftDue) {
          if (isSameDay(parseISO(task.draftDue), day)) {
            showTask = true;
            taskType = 'D: ';
          }
        }

        if ((dateFilter === 'all' || dateFilter === 'final') && task.finalDue) {
          if (isSameDay(parseISO(task.finalDue), day)) {
            if (!showTask) {
              showTask = true;
              taskType = 'F: ';
            }
          }
        }

        if (showTask && taskY < y + cellHeight - 3) {
          doc.setFontSize(6);
          doc.setTextColor(taskType.startsWith('D') ? 59 : 16, taskType.startsWith('D') ? 130 : 185, taskType.startsWith('D') ? 246 : 129);
          const taskText = taskType + (task.taskName || 'Task').substring(0, 15);
          doc.text(taskText, x + 2, taskY);
          taskY += 5;
        }
      });

      col++;
      if (col >= 7) {
        col = 0;
        row++;
      }
    });
  });

  doc.save(filename);
};

// Export PDF - By Company View
export const exportPDFByCompany = (tasks, companies = [], companyNotes = {}, orientation = 'landscape', filename = 'tasks-by-company.pdf') => {
  const doc = new jsPDF(orientation);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const tableWidth = pageWidth - (margin * 2);

  // Filter out completed tasks, then group by company
  const activeTasks = tasks.filter((task) => !task.completedAt);
  const grouped = {};
  activeTasks.forEach((task) => {
    const key = task.companyId || 'unassigned';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(task);
  });

  // Sort company keys
  const companyKeys = Object.keys(grouped).filter(k => k !== 'unassigned');
  companyKeys.sort((a, b) => {
    const companyA = companies.find(c => c.id === a);
    const companyB = companies.find(c => c.id === b);
    return (companyA?.name || '').localeCompare(companyB?.name || '');
  });

  const sortedKeys = [...companyKeys];
  if (grouped['unassigned']) {
    sortedKeys.push('unassigned');
  }

  let yPos = 25;
  let isFirstSection = true;

  sortedKeys.forEach((companyId) => {
    const companyTasks = grouped[companyId];
    const company = companies.find(c => c.id === companyId);
    const companyName = companyId === 'unassigned' ? 'Unassigned' : (company?.name || 'Unknown Company');
    const notes = companyNotes[companyId] || '';

    const estimatedHeight = 20 + (companyTasks.length * 12) + (notes ? 30 : 10);

    // Check if we need a new page (but never on first section to avoid blank first page)
    if (!isFirstSection && yPos + estimatedHeight > pageHeight - 30) {
      doc.addPage();
      yPos = 30; // Start below header on new pages
    }
    isFirstSection = false;

    // Company title
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
    doc.text(companyName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    // Get table configuration based on orientation
    const tableConfig = getTableConfig(tableWidth, orientation, companyTasks);

    // Table
    doc.autoTable({
      startY: yPos,
      head: tableConfig.head,
      body: tableConfig.body,
      headStyles: {
        fillColor: [156, 163, 175],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [31, 41, 55],
        cellPadding: 4,
        lineColor: [209, 213, 219],
        lineWidth: 0.5,
      },
      columnStyles: tableConfig.columnStyles,
      margin: { left: margin, right: margin },
      tableWidth: tableWidth,
      didParseCell: function (data) {
        if (data.section === 'body') {
          const task = companyTasks[data.row.index];
          if (data.column.index === tableConfig.draftDateCol && task.draftDue) {
            data.cell.styles.textColor = getDateColor(task.draftDue);
          }
          if (data.column.index === tableConfig.finalDateCol && task.finalDue) {
            data.cell.styles.textColor = getDateColor(task.finalDue);
          }
        }
      },
    });

    yPos = doc.lastAutoTable.finalY + 6;

    // Notes section
    if (notes) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
      doc.text('Notes:', margin, yPos);
      yPos += 5;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const splitNotes = doc.splitTextToSize(notes, tableWidth);
      doc.text(splitNotes, margin, yPos);
      yPos += splitNotes.length * 4 + 10;
    } else {
      yPos += 15;
    }
  });

  addHeaderAndPageNumbers(doc);
  doc.save(filename);
};

// Export PDF - By Category View
export const exportPDFByCategory = (tasks, categories = [], categoryNotes = {}, orientation = 'landscape', filename = 'tasks-by-category.pdf') => {
  const doc = new jsPDF(orientation);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const tableWidth = pageWidth - (margin * 2);

  // Filter out completed tasks, then group by category
  const activeTasks = tasks.filter((task) => !task.completedAt);
  const grouped = {};
  activeTasks.forEach((task) => {
    const key = task.categoryId || 'unassigned';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(task);
  });

  // Sort category keys
  const categoryKeys = Object.keys(grouped).filter(k => k !== 'unassigned');
  categoryKeys.sort((a, b) => {
    const categoryA = categories.find(c => c.id === a);
    const categoryB = categories.find(c => c.id === b);
    return (categoryA?.name || '').localeCompare(categoryB?.name || '');
  });

  const sortedKeys = [...categoryKeys];
  if (grouped['unassigned']) {
    sortedKeys.push('unassigned');
  }

  let yPos = 25;
  let isFirstSection = true;

  sortedKeys.forEach((categoryId) => {
    const categoryTasks = grouped[categoryId];
    const category = categories.find(c => c.id === categoryId);
    const categoryName = categoryId === 'unassigned' ? 'Unassigned' : (category?.name || 'Unknown Category');
    const notes = categoryNotes[categoryId] || '';

    const estimatedHeight = 20 + (categoryTasks.length * 12) + (notes ? 30 : 10);

    // Check if we need a new page (but never on first section to avoid blank first page)
    if (!isFirstSection && yPos + estimatedHeight > pageHeight - 30) {
      doc.addPage();
      yPos = 30; // Start below header on new pages
    }
    isFirstSection = false;

    // Category title
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
    doc.text(categoryName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    // Get table configuration based on orientation
    const tableConfig = getTableConfig(tableWidth, orientation, categoryTasks);

    // Table
    doc.autoTable({
      startY: yPos,
      head: tableConfig.head,
      body: tableConfig.body,
      headStyles: {
        fillColor: [156, 163, 175],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [31, 41, 55],
        cellPadding: 4,
        lineColor: [209, 213, 219],
        lineWidth: 0.5,
      },
      columnStyles: tableConfig.columnStyles,
      margin: { left: margin, right: margin },
      tableWidth: tableWidth,
      didParseCell: function (data) {
        if (data.section === 'body') {
          const task = categoryTasks[data.row.index];
          if (data.column.index === tableConfig.draftDateCol && task.draftDue) {
            data.cell.styles.textColor = getDateColor(task.draftDue);
          }
          if (data.column.index === tableConfig.finalDateCol && task.finalDue) {
            data.cell.styles.textColor = getDateColor(task.finalDue);
          }
        }
      },
    });

    yPos = doc.lastAutoTable.finalY + 6;

    // Notes section
    if (notes) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
      doc.text('Notes:', margin, yPos);
      yPos += 5;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const splitNotes = doc.splitTextToSize(notes, tableWidth);
      doc.text(splitNotes, margin, yPos);
      yPos += splitNotes.length * 4 + 10;
    } else {
      yPos += 15;
    }
  });

  addHeaderAndPageNumbers(doc);
  doc.save(filename);
};

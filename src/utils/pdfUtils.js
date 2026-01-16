import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { formatDate, getMonthDisplayName, groupTasksByMonth, getMonthKey } from './dateUtils';

// Colors for PDF
const colors = {
  primary: '#E8922D',
  secondary: '#38BDF8',
  success: '#10B981',
  warning: '#FBBF24',
  danger: '#F43F5E',
  text: '#24292F',
  textSecondary: '#57606A',
  border: '#D0D7DE',
  surface: '#F6F8FA',
};

// Get badge color based on status
const getBadgeColor = (date, isComplete) => {
  if (isComplete) return colors.success;
  if (!date) return colors.textSecondary;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return colors.danger;
  if (diffDays <= 3) return colors.warning;
  return colors.secondary;
};

// Export PDF - Flat View
export const exportPDFFlat = (tasks, filename = 'tasks-flat.pdf') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(18);
  doc.setTextColor(colors.text);
  doc.text('Marketing Task List', pageWidth / 2, 20, { align: 'center' });

  // Subtitle with date
  doc.setFontSize(10);
  doc.setTextColor(colors.textSecondary);
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, 28, { align: 'center' });

  // Sort tasks: dated first by draft due, then unscheduled
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.draftDue && !b.draftDue) return 0;
    if (!a.draftDue) return 1;
    if (!b.draftDue) return -1;
    return new Date(a.draftDue) - new Date(b.draftDue);
  });

  // Table data
  const tableData = sortedTasks.map((task) => [
    task.taskName || 'Untitled',
    task.notes || '-',
    task.draftDue ? formatDate(task.draftDue) : '-',
    task.finalDue ? formatDate(task.finalDue) : '-',
  ]);

  // AutoTable
  doc.autoTable({
    startY: 35,
    head: [['Task Name', 'Notes', 'Draft Due', 'Final Due']],
    body: tableData,
    headStyles: {
      fillColor: colors.primary,
      textColor: '#FFFFFF',
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: colors.text,
    },
    alternateRowStyles: {
      fillColor: colors.surface,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 70 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
    },
    didParseCell: function (data) {
      // Color date cells based on status
      if (data.section === 'body') {
        const task = sortedTasks[data.row.index];
        if (data.column.index === 2 && task.draftDue) {
          data.cell.styles.textColor = getBadgeColor(task.draftDue, task.draftComplete);
        }
        if (data.column.index === 3 && task.finalDue) {
          data.cell.styles.textColor = getBadgeColor(task.finalDue, task.finalComplete);
        }
      }
    },
  });

  doc.save(filename);
};

// Export PDF - Grouped View
export const exportPDFGrouped = (tasks, monthlyNotes = {}, dateMode = 'draft', filename = 'tasks-grouped.pdf') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(colors.text);
  doc.text('Marketing Task List', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(colors.textSecondary);
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')} | Grouped by: ${dateMode === 'draft' ? 'Draft Date' : 'Final Date'}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Group tasks by month
  const dateField = dateMode === 'draft' ? 'draftDue' : 'finalDue';
  const { groups, sortedKeys } = groupTasksByMonth(tasks, dateField);

  sortedKeys.forEach((monthKey, monthIndex) => {
    const monthTasks = groups[monthKey];
    const monthName = getMonthDisplayName(monthKey);

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Month header
    doc.setFillColor(colors.surface);
    doc.rect(14, yPos - 5, pageWidth - 28, 10, 'F');
    doc.setFontSize(12);
    doc.setTextColor(colors.text);
    doc.setFont(undefined, 'bold');
    doc.text(monthName, pageWidth / 2, yPos + 2, { align: 'center' });
    doc.setFont(undefined, 'normal');
    yPos += 12;

    // Table for this month
    const tableData = monthTasks.map((task) => [
      task.taskName || 'Untitled',
      task.notes || '-',
      task.draftDue ? formatDate(task.draftDue) : '-',
      task.finalDue ? formatDate(task.finalDue) : '-',
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Task Name', 'Notes', 'Draft Due', 'Final Due']],
      body: tableData,
      headStyles: {
        fillColor: colors.primary,
        textColor: '#FFFFFF',
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: colors.text,
      },
      alternateRowStyles: {
        fillColor: '#FFFFFF',
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 65 },
        2: { cellWidth: 28 },
        3: { cellWidth: 28 },
      },
      margin: { left: 14, right: 14 },
      didParseCell: function (data) {
        if (data.section === 'body') {
          const task = monthTasks[data.row.index];
          if (data.column.index === 2 && task.draftDue) {
            data.cell.styles.textColor = getBadgeColor(task.draftDue, task.draftComplete);
          }
          if (data.column.index === 3 && task.finalDue) {
            data.cell.styles.textColor = getBadgeColor(task.finalDue, task.finalComplete);
          }
        }
      },
    });

    yPos = doc.lastAutoTable.finalY + 5;

    // Monthly notes
    const notes = monthlyNotes[monthKey];
    if (notes) {
      doc.setFontSize(8);
      doc.setTextColor(colors.textSecondary);
      doc.setFont(undefined, 'italic');
      const splitNotes = doc.splitTextToSize(`Notes: ${notes}`, pageWidth - 32);
      doc.text(splitNotes, 16, yPos + 3);
      yPos += splitNotes.length * 4 + 5;
      doc.setFont(undefined, 'normal');
    }

    yPos += 10;
  });

  doc.save(filename);
};

// Export PDF - Calendar View
export const exportPDFCalendar = (tasks, dateFilter = 'all', filename = 'tasks-calendar.pdf') => {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Get unique months with non-recurring tasks
  const monthsWithTasks = new Set();
  tasks.forEach((task) => {
    if (task.isRecurring) return;
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
    doc.setTextColor(colors.text);
    doc.text(format(currentDate, 'MMMM yyyy'), pageWidth / 2, 15, { align: 'center' });

    // Calendar grid
    const startX = 15;
    const startY = 25;
    const cellWidth = (pageWidth - 30) / 7;
    const cellHeight = (pageHeight - 40) / 7;

    // Day headers
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    doc.setFontSize(10);
    doc.setTextColor(colors.textSecondary);
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
      doc.setDrawColor(colors.border);
      doc.rect(x, y, cellWidth, cellHeight);

      // Day number
      const isCurrentMonth = isSameMonth(day, currentDate);
      doc.setFontSize(9);
      doc.setTextColor(isCurrentMonth ? colors.text : colors.textSecondary);
      doc.text(format(day, 'd'), x + cellWidth - 5, y + 5, { align: 'right' });

      // Tasks for this day
      let taskY = y + 10;
      tasks.forEach((task) => {
        if (task.isRecurring) return;

        let showTask = false;
        let taskType = '';

        if ((dateFilter === 'all' || dateFilter === 'draft') && task.draftDue) {
          if (isSameDay(new Date(task.draftDue), day)) {
            showTask = true;
            taskType = 'D: ';
          }
        }

        if ((dateFilter === 'all' || dateFilter === 'final') && task.finalDue) {
          if (isSameDay(new Date(task.finalDue), day)) {
            if (!showTask) {
              showTask = true;
              taskType = 'F: ';
            }
          }
        }

        if (showTask && taskY < y + cellHeight - 3) {
          doc.setFontSize(6);
          doc.setTextColor(taskType.startsWith('D') ? colors.secondary : colors.success);
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
export const exportPDFByCompany = (tasks, companies = [], filename = 'tasks-by-company.pdf') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(colors.text);
  doc.text('Tasks by Company', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(colors.textSecondary);
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Group tasks by company
  const grouped = {};
  tasks.forEach((task) => {
    const key = task.companyId || 'unassigned';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(task);
  });

  // Sort company keys alphabetically by company name
  const companyKeys = Object.keys(grouped).filter(k => k !== 'unassigned');
  companyKeys.sort((a, b) => {
    const companyA = companies.find(c => c.id === a);
    const companyB = companies.find(c => c.id === b);
    const nameA = companyA?.name || '';
    const nameB = companyB?.name || '';
    return nameA.localeCompare(nameB);
  });

  // Add unassigned at the end if it exists
  const sortedKeys = [...companyKeys];
  if (grouped['unassigned']) {
    sortedKeys.push('unassigned');
  }

  sortedKeys.forEach((companyId) => {
    const companyTasks = grouped[companyId];
    const company = companies.find(c => c.id === companyId);
    const companyName = companyId === 'unassigned' ? 'Unassigned' : (company?.name || 'Unknown Company');

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Company header
    doc.setFillColor(colors.surface);
    doc.rect(14, yPos - 5, pageWidth - 28, 10, 'F');
    doc.setFontSize(12);
    doc.setTextColor(colors.text);
    doc.setFont(undefined, 'bold');
    doc.text(companyName, pageWidth / 2, yPos + 2, { align: 'center' });
    doc.setFont(undefined, 'normal');
    yPos += 12;

    // Table for this company
    const tableData = companyTasks.map((task) => [
      task.taskName || 'Untitled',
      task.notes || '-',
      task.draftDue ? formatDate(task.draftDue) : '-',
      task.finalDue ? formatDate(task.finalDue) : '-',
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Task Name', 'Notes', 'Draft Due', 'Final Due']],
      body: tableData,
      headStyles: {
        fillColor: colors.primary,
        textColor: '#FFFFFF',
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: colors.text,
      },
      alternateRowStyles: {
        fillColor: '#FFFFFF',
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 65 },
        2: { cellWidth: 28 },
        3: { cellWidth: 28 },
      },
      margin: { left: 14, right: 14 },
      didParseCell: function (data) {
        if (data.section === 'body') {
          const task = companyTasks[data.row.index];
          if (data.column.index === 2 && task.draftDue) {
            data.cell.styles.textColor = getBadgeColor(task.draftDue, task.draftComplete);
          }
          if (data.column.index === 3 && task.finalDue) {
            data.cell.styles.textColor = getBadgeColor(task.finalDue, task.finalComplete);
          }
        }
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  });

  doc.save(filename);
};

// Export PDF - By Category View
export const exportPDFByCategory = (tasks, categories = [], filename = 'tasks-by-category.pdf') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(colors.text);
  doc.text('Tasks by Category', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(colors.textSecondary);
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Group tasks by category
  const grouped = {};
  tasks.forEach((task) => {
    const key = task.categoryId || 'unassigned';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(task);
  });

  // Sort category keys alphabetically by category name
  const categoryKeys = Object.keys(grouped).filter(k => k !== 'unassigned');
  categoryKeys.sort((a, b) => {
    const categoryA = categories.find(c => c.id === a);
    const categoryB = categories.find(c => c.id === b);
    const nameA = categoryA?.name || '';
    const nameB = categoryB?.name || '';
    return nameA.localeCompare(nameB);
  });

  // Add unassigned at the end if it exists
  const sortedKeys = [...categoryKeys];
  if (grouped['unassigned']) {
    sortedKeys.push('unassigned');
  }

  sortedKeys.forEach((categoryId) => {
    const categoryTasks = grouped[categoryId];
    const category = categories.find(c => c.id === categoryId);
    const categoryName = categoryId === 'unassigned' ? 'Unassigned' : (category?.name || 'Unknown Category');

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Category header
    doc.setFillColor(colors.surface);
    doc.rect(14, yPos - 5, pageWidth - 28, 10, 'F');
    doc.setFontSize(12);
    doc.setTextColor(colors.text);
    doc.setFont(undefined, 'bold');
    doc.text(categoryName, pageWidth / 2, yPos + 2, { align: 'center' });
    doc.setFont(undefined, 'normal');
    yPos += 12;

    // Table for this category
    const tableData = categoryTasks.map((task) => [
      task.taskName || 'Untitled',
      task.notes || '-',
      task.draftDue ? formatDate(task.draftDue) : '-',
      task.finalDue ? formatDate(task.finalDue) : '-',
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Task Name', 'Notes', 'Draft Due', 'Final Due']],
      body: tableData,
      headStyles: {
        fillColor: colors.primary,
        textColor: '#FFFFFF',
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: colors.text,
      },
      alternateRowStyles: {
        fillColor: '#FFFFFF',
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 65 },
        2: { cellWidth: 28 },
        3: { cellWidth: 28 },
      },
      margin: { left: 14, right: 14 },
      didParseCell: function (data) {
        if (data.section === 'body') {
          const task = categoryTasks[data.row.index];
          if (data.column.index === 2 && task.draftDue) {
            data.cell.styles.textColor = getBadgeColor(task.draftDue, task.draftComplete);
          }
          if (data.column.index === 3 && task.finalDue) {
            data.cell.styles.textColor = getBadgeColor(task.finalDue, task.finalComplete);
          }
        }
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  });

  doc.save(filename);
};

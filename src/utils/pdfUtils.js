import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { formatDate, getMonthDisplayName, groupTasksByMonth, getMonthKey } from './dateUtils';

// Colors for PDF - matching dashboard theme
const colors = {
  header: '#334155',      // Slate for headers
  secondary: '#38BDF8',   // Blue for future dates
  success: '#10B981',     // Green for complete
  warning: '#FBBF24',     // Yellow for due soon
  danger: '#F43F5E',      // Red for overdue
  text: '#1e293b',        // Dark slate for text
  textSecondary: '#64748b', // Muted text
  textLight: '#FFFFFF',   // White text
  border: '#e2e8f0',      // Light border
  surface: '#f8fafc',     // Light surface
  rowBorder: '#e2e8f0',   // Row borders
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

// Draw rounded rectangle
const drawRoundedRect = (doc, x, y, width, height, radius, fillColor, strokeColor) => {
  const rgb = hexToRgb(fillColor);
  doc.setFillColor(rgb.r, rgb.g, rgb.b);

  if (strokeColor) {
    const strokeRgb = hexToRgb(strokeColor);
    doc.setDrawColor(strokeRgb.r, strokeRgb.g, strokeRgb.b);
  }

  doc.roundedRect(x, y, width, height, radius, radius, fillColor ? 'F' : 'S');
};

// Draw a pill/badge with text
const drawPill = (doc, x, y, text, bgColor, textColor = '#FFFFFF') => {
  const textWidth = doc.getTextWidth(text);
  const pillWidth = textWidth + 6;
  const pillHeight = 5;
  const radius = 2;

  const bgRgb = hexToRgb(bgColor);
  doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
  doc.roundedRect(x, y - 3.5, pillWidth, pillHeight, radius, radius, 'F');

  const textRgb = hexToRgb(textColor);
  doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);
  doc.text(text, x + 3, y);

  return pillWidth;
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
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  // Title
  doc.setFontSize(18);
  doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
  doc.text('Marketing Task List', pageWidth / 2, 20, { align: 'center' });

  // Subtitle with date
  doc.setFontSize(10);
  doc.setTextColor(hexToRgb(colors.textSecondary).r, hexToRgb(colors.textSecondary).g, hexToRgb(colors.textSecondary).b);
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, 28, { align: 'center' });

  // Sort tasks: dated first by draft due, then unscheduled
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.draftDue && !b.draftDue) return 0;
    if (!a.draftDue) return 1;
    if (!b.draftDue) return -1;
    return new Date(a.draftDue) - new Date(b.draftDue);
  });

  // Draw section box with rounded corners
  let yPos = 35;
  const headerHeight = 12;
  const rowHeight = 10;
  const estimatedHeight = headerHeight + (sortedTasks.length * rowHeight) + 10;

  // Section container with rounded corners and border
  const borderRgb = hexToRgb(colors.border);
  doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, contentWidth, Math.min(estimatedHeight, 240), 3, 3, 'S');

  // Section header with rounded top corners
  const headerRgb = hexToRgb(colors.header);
  doc.setFillColor(headerRgb.r, headerRgb.g, headerRgb.b);
  // Draw header background (clip to rounded corners at top)
  doc.roundedRect(margin, yPos, contentWidth, headerHeight, 3, 3, 'F');
  // Cover bottom rounded corners with rectangle
  doc.rect(margin, yPos + 6, contentWidth, headerHeight - 6, 'F');

  // Header text
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.text('All Tasks', pageWidth / 2, yPos + 8, { align: 'center' });
  doc.setFont(undefined, 'normal');

  yPos += headerHeight + 2;

  // Table with custom styling
  doc.autoTable({
    startY: yPos,
    head: [['Task Name', 'Notes', 'Draft Due', 'Final Due']],
    body: sortedTasks.map((task) => [
      task.taskName || 'Untitled',
      task.notes || '-',
      task.draftDue ? formatDate(task.draftDue) : '-',
      task.finalDue ? formatDate(task.finalDue) : '-',
    ]),
    headStyles: {
      fillColor: [248, 250, 252], // surface color
      textColor: [100, 116, 139], // textSecondary
      fontSize: 8,
      fontStyle: 'bold',
      lineWidth: 0,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59], // text color
      lineWidth: 0.1,
      lineColor: [226, 232, 240], // border color
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 70 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' },
    },
    margin: { left: margin + 1, right: margin + 1 },
    tableLineWidth: 0,
    didDrawCell: function (data) {
      // Draw colored pill for date cells
      if (data.section === 'body') {
        const task = sortedTasks[data.row.index];
        if (data.column.index === 2 && task.draftDue) {
          const badgeColor = getBadgeColor(task.draftDue, task.draftComplete);
          const dateText = formatDate(task.draftDue);
          const textWidth = doc.getTextWidth(dateText);
          const pillX = data.cell.x + (data.cell.width - textWidth - 6) / 2;
          const pillY = data.cell.y + data.cell.height / 2 + 1;

          // Clear the cell text and draw pill
          doc.setFillColor(255, 255, 255);
          doc.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 'F');
          doc.setFontSize(7);
          drawPill(doc, pillX, pillY, dateText, badgeColor);
        }
        if (data.column.index === 3 && task.finalDue) {
          const badgeColor = getBadgeColor(task.finalDue, task.finalComplete);
          const dateText = formatDate(task.finalDue);
          const textWidth = doc.getTextWidth(dateText);
          const pillX = data.cell.x + (data.cell.width - textWidth - 6) / 2;
          const pillY = data.cell.y + data.cell.height / 2 + 1;

          // Clear the cell text and draw pill
          doc.setFillColor(255, 255, 255);
          doc.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 'F');
          doc.setFontSize(7);
          drawPill(doc, pillX, pillY, dateText, badgeColor);
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
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
  doc.text('Marketing Task List', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(hexToRgb(colors.textSecondary).r, hexToRgb(colors.textSecondary).g, hexToRgb(colors.textSecondary).b);
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')} | Grouped by: ${dateMode === 'draft' ? 'Draft Date' : 'Final Date'}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Group tasks by month
  const dateField = dateMode === 'draft' ? 'draftDue' : 'finalDue';
  const { groups, sortedKeys } = groupTasksByMonth(tasks, dateField);

  sortedKeys.forEach((monthKey) => {
    const monthTasks = groups[monthKey];
    const monthName = getMonthDisplayName(monthKey);
    const headerHeight = 12;

    // Estimate section height
    const estimatedHeight = headerHeight + (monthTasks.length * 10) + 20;

    // Check if we need a new page
    if (yPos + estimatedHeight > 280) {
      doc.addPage();
      yPos = 20;
    }

    // Draw section border (rounded rectangle)
    const borderRgb = hexToRgb(colors.border);
    doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
    doc.setLineWidth(0.5);

    // Section header with rounded top corners
    const headerRgb = hexToRgb(colors.header);
    doc.setFillColor(headerRgb.r, headerRgb.g, headerRgb.b);
    doc.roundedRect(margin, yPos, contentWidth, headerHeight, 3, 3, 'F');
    doc.rect(margin, yPos + 6, contentWidth, headerHeight - 6, 'F');

    // Header text
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(monthName, pageWidth / 2, yPos + 8, { align: 'center' });
    doc.setFont(undefined, 'normal');

    const tableStartY = yPos + headerHeight + 2;

    // Table for this month
    doc.autoTable({
      startY: tableStartY,
      head: [['Task Name', 'Notes', 'Draft Due', 'Final Due']],
      body: monthTasks.map((task) => [
        task.taskName || 'Untitled',
        task.notes || '-',
        task.draftDue ? formatDate(task.draftDue) : '-',
        task.finalDue ? formatDate(task.finalDue) : '-',
      ]),
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [100, 116, 139],
        fontSize: 8,
        fontStyle: 'bold',
        lineWidth: 0,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        lineWidth: 0.1,
        lineColor: [226, 232, 240],
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 65 },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 28, halign: 'center' },
      },
      margin: { left: margin + 1, right: margin + 1 },
      tableLineWidth: 0,
      didDrawCell: function (data) {
        if (data.section === 'body') {
          const task = monthTasks[data.row.index];
          if (data.column.index === 2 && task.draftDue) {
            const badgeColor = getBadgeColor(task.draftDue, task.draftComplete);
            const dateText = formatDate(task.draftDue);
            const textWidth = doc.getTextWidth(dateText);
            const pillX = data.cell.x + (data.cell.width - textWidth - 6) / 2;
            const pillY = data.cell.y + data.cell.height / 2 + 1;
            doc.setFillColor(255, 255, 255);
            doc.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 'F');
            doc.setFontSize(7);
            drawPill(doc, pillX, pillY, dateText, badgeColor);
          }
          if (data.column.index === 3 && task.finalDue) {
            const badgeColor = getBadgeColor(task.finalDue, task.finalComplete);
            const dateText = formatDate(task.finalDue);
            const textWidth = doc.getTextWidth(dateText);
            const pillX = data.cell.x + (data.cell.width - textWidth - 6) / 2;
            const pillY = data.cell.y + data.cell.height / 2 + 1;
            doc.setFillColor(255, 255, 255);
            doc.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 'F');
            doc.setFontSize(7);
            drawPill(doc, pillX, pillY, dateText, badgeColor);
          }
        }
      },
    });

    const tableEndY = doc.lastAutoTable.finalY;

    // Draw section border around everything
    doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
    doc.roundedRect(margin, yPos, contentWidth, tableEndY - yPos + 4, 3, 3, 'S');

    yPos = tableEndY + 5;

    // Monthly notes
    const notes = monthlyNotes[monthKey];
    if (notes) {
      doc.setFontSize(8);
      doc.setTextColor(hexToRgb(colors.textSecondary).r, hexToRgb(colors.textSecondary).g, hexToRgb(colors.textSecondary).b);
      doc.setFont(undefined, 'italic');
      const splitNotes = doc.splitTextToSize(`Notes: ${notes}`, pageWidth - 32);
      doc.text(splitNotes, margin + 2, yPos + 3);
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
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
  doc.text('Tasks by Company', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(hexToRgb(colors.textSecondary).r, hexToRgb(colors.textSecondary).g, hexToRgb(colors.textSecondary).b);
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
    const headerHeight = 12;

    // Estimate section height
    const estimatedHeight = headerHeight + (companyTasks.length * 10) + 20;

    // Check if we need a new page
    if (yPos + estimatedHeight > 280) {
      doc.addPage();
      yPos = 20;
    }

    // Draw section border (rounded rectangle)
    const borderRgb = hexToRgb(colors.border);
    doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
    doc.setLineWidth(0.5);

    // Section header with rounded top corners
    const headerRgb = hexToRgb(colors.header);
    doc.setFillColor(headerRgb.r, headerRgb.g, headerRgb.b);
    doc.roundedRect(margin, yPos, contentWidth, headerHeight, 3, 3, 'F');
    doc.rect(margin, yPos + 6, contentWidth, headerHeight - 6, 'F');

    // Header text
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(companyName, pageWidth / 2, yPos + 8, { align: 'center' });
    doc.setFont(undefined, 'normal');

    const tableStartY = yPos + headerHeight + 2;

    // Table for this company
    doc.autoTable({
      startY: tableStartY,
      head: [['Task Name', 'Notes', 'Draft Due', 'Final Due']],
      body: companyTasks.map((task) => [
        task.taskName || 'Untitled',
        task.notes || '-',
        task.draftDue ? formatDate(task.draftDue) : '-',
        task.finalDue ? formatDate(task.finalDue) : '-',
      ]),
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [100, 116, 139],
        fontSize: 8,
        fontStyle: 'bold',
        lineWidth: 0,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        lineWidth: 0.1,
        lineColor: [226, 232, 240],
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 65 },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 28, halign: 'center' },
      },
      margin: { left: margin + 1, right: margin + 1 },
      tableLineWidth: 0,
      didDrawCell: function (data) {
        if (data.section === 'body') {
          const task = companyTasks[data.row.index];
          if (data.column.index === 2 && task.draftDue) {
            const badgeColor = getBadgeColor(task.draftDue, task.draftComplete);
            const dateText = formatDate(task.draftDue);
            const textWidth = doc.getTextWidth(dateText);
            const pillX = data.cell.x + (data.cell.width - textWidth - 6) / 2;
            const pillY = data.cell.y + data.cell.height / 2 + 1;
            doc.setFillColor(255, 255, 255);
            doc.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 'F');
            doc.setFontSize(7);
            drawPill(doc, pillX, pillY, dateText, badgeColor);
          }
          if (data.column.index === 3 && task.finalDue) {
            const badgeColor = getBadgeColor(task.finalDue, task.finalComplete);
            const dateText = formatDate(task.finalDue);
            const textWidth = doc.getTextWidth(dateText);
            const pillX = data.cell.x + (data.cell.width - textWidth - 6) / 2;
            const pillY = data.cell.y + data.cell.height / 2 + 1;
            doc.setFillColor(255, 255, 255);
            doc.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 'F');
            doc.setFontSize(7);
            drawPill(doc, pillX, pillY, dateText, badgeColor);
          }
        }
      },
    });

    const tableEndY = doc.lastAutoTable.finalY;

    // Draw section border around everything
    doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
    doc.roundedRect(margin, yPos, contentWidth, tableEndY - yPos + 4, 3, 3, 'S');

    yPos = tableEndY + 15;
  });

  doc.save(filename);
};

// Export PDF - By Category View
export const exportPDFByCategory = (tasks, categories = [], filename = 'tasks-by-category.pdf') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(hexToRgb(colors.text).r, hexToRgb(colors.text).g, hexToRgb(colors.text).b);
  doc.text('Tasks by Category', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(hexToRgb(colors.textSecondary).r, hexToRgb(colors.textSecondary).g, hexToRgb(colors.textSecondary).b);
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
    const headerHeight = 12;

    // Estimate section height
    const estimatedHeight = headerHeight + (categoryTasks.length * 10) + 20;

    // Check if we need a new page
    if (yPos + estimatedHeight > 280) {
      doc.addPage();
      yPos = 20;
    }

    // Draw section border (rounded rectangle)
    const borderRgb = hexToRgb(colors.border);
    doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
    doc.setLineWidth(0.5);

    // Section header with rounded top corners
    const headerRgb = hexToRgb(colors.header);
    doc.setFillColor(headerRgb.r, headerRgb.g, headerRgb.b);
    doc.roundedRect(margin, yPos, contentWidth, headerHeight, 3, 3, 'F');
    doc.rect(margin, yPos + 6, contentWidth, headerHeight - 6, 'F');

    // Header text
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(categoryName, pageWidth / 2, yPos + 8, { align: 'center' });
    doc.setFont(undefined, 'normal');

    const tableStartY = yPos + headerHeight + 2;

    // Table for this category
    doc.autoTable({
      startY: tableStartY,
      head: [['Task Name', 'Notes', 'Draft Due', 'Final Due']],
      body: categoryTasks.map((task) => [
        task.taskName || 'Untitled',
        task.notes || '-',
        task.draftDue ? formatDate(task.draftDue) : '-',
        task.finalDue ? formatDate(task.finalDue) : '-',
      ]),
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [100, 116, 139],
        fontSize: 8,
        fontStyle: 'bold',
        lineWidth: 0,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        lineWidth: 0.1,
        lineColor: [226, 232, 240],
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 65 },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 28, halign: 'center' },
      },
      margin: { left: margin + 1, right: margin + 1 },
      tableLineWidth: 0,
      didDrawCell: function (data) {
        if (data.section === 'body') {
          const task = categoryTasks[data.row.index];
          if (data.column.index === 2 && task.draftDue) {
            const badgeColor = getBadgeColor(task.draftDue, task.draftComplete);
            const dateText = formatDate(task.draftDue);
            const textWidth = doc.getTextWidth(dateText);
            const pillX = data.cell.x + (data.cell.width - textWidth - 6) / 2;
            const pillY = data.cell.y + data.cell.height / 2 + 1;
            doc.setFillColor(255, 255, 255);
            doc.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 'F');
            doc.setFontSize(7);
            drawPill(doc, pillX, pillY, dateText, badgeColor);
          }
          if (data.column.index === 3 && task.finalDue) {
            const badgeColor = getBadgeColor(task.finalDue, task.finalComplete);
            const dateText = formatDate(task.finalDue);
            const textWidth = doc.getTextWidth(dateText);
            const pillX = data.cell.x + (data.cell.width - textWidth - 6) / 2;
            const pillY = data.cell.y + data.cell.height / 2 + 1;
            doc.setFillColor(255, 255, 255);
            doc.rect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 'F');
            doc.setFontSize(7);
            drawPill(doc, pillX, pillY, dateText, badgeColor);
          }
        }
      },
    });

    const tableEndY = doc.lastAutoTable.finalY;

    // Draw section border around everything
    doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
    doc.roundedRect(margin, yPos, contentWidth, tableEndY - yPos + 4, 3, 3, 'S');

    yPos = tableEndY + 15;
  });

  doc.save(filename);
};

import { useState, useEffect, useMemo } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
// ============================================================================
// Reports, Statistics, Graphs, Logbook pages
// ============================================================================

const safeWindow = () => ({
  UI: typeof window !== 'undefined' && window.PulseUI || { Icon: () => null, Avatar: () => null, Pill: () => null, Button: () => null, IconButton: () => null, Card: () => null, CardHeader: () => null, Skeleton: () => null, EmptyState: () => null, TOKENS: {} },
  Form: typeof window !== 'undefined' && window.PulseForm || { Select: () => null, Segmented: () => null, Input: () => null },
  Layout: typeof window !== 'undefined' && window.PulseLayout || { PageHeader: () => null, Tabs: () => null, Link: () => null, navigate: () => {} }
});

const w = safeWindow();
const IR = w.UI.Icon; const AvR = w.UI.Avatar; const PR = w.UI.Pill; const BR = w.UI.Button; const IBR = w.UI.IconButton; const CR = w.UI.Card; const CHR = w.UI.CardHeader; const SR = w.UI.Skeleton; const ER = w.UI.EmptyState; const TR = w.UI.TOKENS;
const SeR = w.Form.Select; const SgR = w.Form.Segmented; const InR = w.Form.Input;
const PHR = w.Layout.PageHeader; const TBR = w.Layout.Tabs; const LinkR = w.Layout.Link; const navR = w.Layout.navigate;

// =====================================================================
// REPORTS — index, custom, logbook
// =====================================================================
function ReportsPage({ tab = "index" }) {
  const tabs = [
    { value: "index",  label: "Overview", to: "/reports" },
    { value: "custom", label: "Custom",   to: "/reports/custom" },
    { value: "logbook", label: "Logbook", to: "/reports/logbook" },
  ];
  return (
    <div>
      <PHR title="Reports" subtitle="Export and review issue activity"
        actions={<BR variant="outline" icon="download">Export</BR>}
        tabs={
          <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            {tabs.map(t => (
              <LinkR key={t.value} to={t.to}>
                <div style={{
                  padding: "8px 12px", color: tab === t.value ? TR.text : TR.muted,
                  fontSize: 13.5, fontWeight: tab === t.value ? 600 : 500,
                  borderBottom: `2px solid ${tab === t.value ? TR.accent : "transparent"}`,
                  marginBottom: -1, cursor: "pointer", letterSpacing: "-0.005em",
                }}>{t.label}</div>
              </LinkR>
            ))}
          </div>
        }/>
      <div style={{ padding: "20px 28px 60px", maxWidth: 1280 }}>
        {tab === "index"  && <ReportsIndex/>}
        {tab === "custom" && <ReportsCustom/>}
        {tab === "logbook" && <ReportsLogbook/>}
      </div>
    </div>
  );
}

function ReportsIndex() {
  const tiles = [
    { to: "/reports/custom", icon: "filter", label: "Custom Report", desc: "Filter issues by date, department, status, and more", color: TR.accent },
    { to: "/reports/logbook", icon: "book", label: "DM Logbook", desc: "Daily shift logbook for management review", color: TR.warning },
    { to: "/statistics",      icon: "chart-pie", label: "Statistics", desc: "Aggregated metrics by department and user", color: TR.success },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
      {tiles.map(t => (
        <LinkR key={t.to} to={t.to}>
          <CR hover>
            <div style={{ padding: 20, display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: `${t.color}15`, color: t.color, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <IR name={t.icon} size={22}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{t.label}</div>
                <div style={{ fontSize: 13, color: TR.muted, marginTop: 4, lineHeight: 1.5 }}>{t.desc}</div>
              </div>
              <IR name="chevron-right" size={16} color={TR.mutedLight}/>
            </div>
          </CR>
        </LinkR>
      ))}
    </div>
  );
}

function ReportsCustom() {
  const [filters, setFilters] = useState({
    date_range: 'all', // Changed from separate date_from/date_to to a single range selector
    date_from: '',
    date_to: '',
    status: '',
    priority: '',
    department_id: '',
    issue_type_id: '',
    page: 1,
    per_page: 10,
  });
  const [issues, setIssues] = useState([]);
  const [allIssues, setAllIssues] = useState([]); // For charts
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);

  // Load filter options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [deptResponse, typesResponse] = await Promise.all([
          window.PulseAPI.Departments.list(),
          window.PulseAPI.IssueTypes.list()
        ]);
        setDepartments(deptResponse.data || []);
        setIssueTypes(typesResponse.data || []);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    loadOptions();
  }, []);

  // Load filtered issues
  useEffect(() => {
    const loadIssues = async () => {
      setLoading(true);
      try {
        // Build base params for both requests
        const baseParams = {
          ...(filters.date_range !== 'all' && filters.date_range !== 'custom' && {
            date_from: filters.date_from,
            date_to: filters.date_to
          }),
          ...(filters.date_range === 'custom' && filters.date_from && { date_from: filters.date_from }),
          ...(filters.date_range === 'custom' && filters.date_to && { date_to: filters.date_to }),
          ...(filters.status && { status: filters.status }),
          ...(filters.priority && { priority: filters.priority }),
          ...(filters.department_id && { department_id: Number(filters.department_id) }),
          ...(filters.issue_type_id && { issue_type_id: Number(filters.issue_type_id) }),
        };

        // Fetch paginated data for table
        const tableParams = {
          ...baseParams,
          page: filters.page,
          per_page: filters.per_page,
        };

        // Fetch ALL data for charts (no pagination)
        const chartParams = {
          ...baseParams,
          page: 1,
          per_page: 10000, // Get all matching issues
        };

        const [tableResponse, chartResponse] = await Promise.all([
          window.PulseAPI.Issues.list(tableParams),
          window.PulseAPI.Issues.list(chartParams)
        ]);

        setIssues(tableResponse.data || []);
        setAllIssues(chartResponse.data || []);
        setMeta(tableResponse.meta || null);
      } catch (error) {
        console.error('Failed to load issues:', error);
        setIssues([]);
        setAllIssues([]);
        setMeta(null);
      } finally {
        setLoading(false);
      }
    };

    // Only load if at least one filter is set (other than 'all')
    const hasFilters = filters.status || filters.priority || filters.department_id || filters.issue_type_id ||
                      (filters.date_range !== 'all' && filters.date_range !== 'custom') ||
                      (filters.date_range === 'custom' && (filters.date_from || filters.date_to));

    if (hasFilters) {
      loadIssues();
    } else {
      setIssues([]);
      setAllIssues([]);
      setMeta(null);
    }
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 })); // Reset to page 1 when filters change
  };

  const clearFilters = () => {
    setFilters({
      date_range: 'all',
      date_from: '',
      date_to: '',
      status: '',
      priority: '',
      department_id: '',
      issue_type_id: '',
      page: 1,
      per_page: 25,
    });
    setIssues([]);
    setAllIssues([]);
    setMeta(null);
  };

  const goToPage = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Export Functions
  const exportToPDF = () => {
    if (!allIssues.length) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('GuestPulse Custom Report', pageWidth / 2, 20, { align: 'center' });

    // Report metadata
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(`Generated: ${reportDate}`, pageWidth / 2, 28, { align: 'center' });

    // Filter summary
    let filterSummary = [];
    if (filters.date_range !== 'all') {
      filterSummary.push(`Date: ${getDateRangeDisplay()}`);
    }
    if (filters.status) {
      filterSummary.push(`Status: ${filters.status}`);
    }
    if (filters.priority) {
      filterSummary.push(`Priority: ${filters.priority}`);
    }
    if (filters.department_id) {
      const deptName = departments.find(d => d.id === Number(filters.department_id))?.name || '';
      filterSummary.push(`Department: ${deptName}`);
    }
    if (filters.issue_type_id) {
      const typeName = issueTypes.find(t => t.id === Number(filters.issue_type_id))?.name || '';
      filterSummary.push(`Type: ${typeName}`);
    }

    if (filterSummary.length > 0) {
      doc.setFontSize(9);
      doc.text('Filters: ' + filterSummary.join(' | '), pageWidth / 2, 35, { align: 'center' });
    }

    // Statistics
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary Statistics', 14, 48);

    const statsData = [
      ['Total Issues', String(totalCreated)],
      ['Open Issues', String(openIssues)],
      ['Closed Issues', String(totalClosed)],
      ['Urgent Issues', String(urgentIssues)]
    ];

    doc.autoTable({
      startY: 52,
      head: [],
      body: statsData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 2
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 30 }
      }
    });

    // Chart Data - Issue Types
    if (chartData?.typeData?.length > 0) {
      doc.setFontSize(14);
      doc.text('Issues by Type', 14, doc.lastAutoTable.finalY + 15);

      const typeData = chartData.typeData.map(item => [
        item.name,
        String(item.count),
        String(Math.round((item.count / totalCreated) * 100) + '%')
      ]);

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 18,
        head: [['Issue Type', 'Count', 'Percentage']],
        body: typeData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246] }
      });
    }

    // Chart Data - Departments
    if (chartData?.departmentData?.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Issues by Department', 14, 20);

      const deptData = chartData.departmentData.map(item => [
        item.name,
        String(item.count),
        String(Math.round((item.count / totalCreated) * 100) + '%')
      ]);

      doc.autoTable({
        startY: 24,
        head: [['Department', 'Count', 'Percentage']],
        body: deptData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246] }
      });
    }

    // Issues Table
    doc.addPage();
    doc.setFontSize(14);
    doc.text(`Detailed Issues (${totalCreated} total)`, 14, 20);

    const tableData = allIssues.map(issue => [
      '#' + String(issue.id),
      issue.title || 'N/A',
      issue.name || issue.room_number || 'N/A',
      issue.departments?.map(d => d.name).join(', ') || 'N/A',
      issue.priority,
      issue.status,
      new Date(issue.created_at).toLocaleDateString()
    ]);

    doc.autoTable({
      startY: 24,
      head: [['ID', 'Title', 'Guest/Room', 'Department', 'Priority', 'Status', 'Created']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 25 }
      }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount} | GuestPulse Custom Report`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save
    const fileName = `GuestPulse_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const exportToExcel = () => {
    if (!allIssues.length) return;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['GuestPulse Custom Report'],
      ['Generated', new Date().toLocaleDateString()],
      [''],
      ['Summary Statistics'],
      ['Total Issues', totalCreated],
      ['Open Issues', openIssues],
      ['Closed Issues', totalClosed],
      ['Urgent Issues', urgentIssues],
      [''],
      ['Filters Applied'],
      ['Date Range', getDateRangeDisplay()],
      ['Status', filters.status || 'All'],
      ['Priority', filters.priority || 'All'],
      ['Department', filters.department_id ? departments.find(d => d.id === Number(filters.department_id))?.name || '' : 'All'],
      ['Issue Type', filters.issue_type_id ? issueTypes.find(t => t.id === Number(filters.issue_type_id))?.name || '' : 'All']
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Issues by Type sheet
    if (chartData?.typeData?.length > 0) {
      const typeData = [
        ['Issue Type', 'Count', 'Percentage'],
        ...chartData.typeData.map(item => [
          item.name,
          item.count,
          Math.round((item.count / totalCreated) * 100) + '%'
        ])
      ];
      const typeWs = XLSX.utils.aoa_to_sheet(typeData);
      XLSX.utils.book_append_sheet(wb, typeWs, 'By Type');
    }

    // Issues by Department sheet
    if (chartData?.departmentData?.length > 0) {
      const deptData = [
        ['Department', 'Count', 'Percentage'],
        ...chartData.departmentData.map(item => [
          item.name,
          item.count,
          Math.round((item.count / totalCreated) * 100) + '%'
        ])
      ];
      const deptWs = XLSX.utils.aoa_to_sheet(deptData);
      XLSX.utils.book_append_sheet(wb, deptWs, 'By Department');
    }

    // Priority Distribution sheet
    if (chartData?.priorityData?.length > 0) {
      const priorityData = [
        ['Priority', 'Count', 'Percentage'],
        ...chartData.priorityData.map(item => [
          item.name.charAt(0).toUpperCase() + item.name.slice(1),
          item.count,
          Math.round((item.count / totalCreated) * 100) + '%'
        ])
      ];
      const priorityWs = XLSX.utils.aoa_to_sheet(priorityData);
      XLSX.utils.book_append_sheet(wb, priorityWs, 'By Priority');
    }

    // Detailed Issues sheet
    const issuesData = [
      ['ID', 'Title', 'Description', 'Guest Name', 'Room Number', 'Department', 'Issue Types', 'Priority', 'Status', 'Created Date', 'Created Time'],
      ...allIssues.map(issue => [
        issue.id,
        issue.title || '',
        issue.description || '',
        issue.name || '',
        issue.room_number || issue.location || '',
        issue.departments?.map(d => d.name).join(', ') || '',
        issue.issueTypes?.map(t => t.name).join(', ') || '',
        issue.priority,
        issue.status,
        new Date(issue.created_at).toLocaleDateString(),
        new Date(issue.created_at).toLocaleTimeString()
      ])
    ];

    const issuesWs = XLSX.utils.aoa_to_sheet(issuesData);

    // Set column widths
    issuesWs['!cols'] = [
      { wch: 6 },  // ID
      { wch: 30 }, // Title
      { wch: 40 }, // Description
      { wch: 20 }, // Guest Name
      { wch: 15 }, // Room Number
      { wch: 20 }, // Department
      { wch: 25 }, // Issue Types
      { wch: 10 }, // Priority
      { wch: 10 }, // Status
      { wch: 15 }, // Created Date
      { wch: 12 }  // Created Time
    ];

    XLSX.utils.book_append_sheet(wb, issuesWs, 'All Issues');

    // Save
    const fileName = `GuestPulse_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Date range handler
  const handleDateRangeChange = (range) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let dateFrom, dateTo;

    switch (range) {
      case 'today':
        dateFrom = today.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'last_7_days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        dateFrom = sevenDaysAgo.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'this_week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
        dateFrom = startOfWeek.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'last_week':
        const endOfLastWeek = new Date(today);
        endOfLastWeek.setDate(today.getDate() - today.getDay() - 1); // Saturday
        const startOfLastWeek = new Date(endOfLastWeek);
        startOfLastWeek.setDate(endOfLastWeek.getDate() - 6); // Previous Sunday
        dateFrom = startOfLastWeek.toISOString().split('T')[0];
        dateTo = endOfLastWeek.toISOString().split('T')[0];
        break;
      case 'this_month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFrom = startOfMonth.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'last_month':
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        dateFrom = startOfLastMonth.toISOString().split('T')[0];
        dateTo = endOfLastMonth.toISOString().split('T')[0];
        break;
      case 'this_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
        dateFrom = startOfQuarter.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'last_30_days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'last_90_days':
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(today.getDate() - 90);
        dateFrom = ninetyDaysAgo.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'this_year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        dateFrom = startOfYear.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'year_to_date':
        const startOfYTD = new Date(now.getFullYear(), 0, 1);
        dateFrom = startOfYTD.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'custom':
        dateFrom = '';
        dateTo = '';
        break;
      default:
        dateFrom = '';
        dateTo = '';
    }

    setFilters(prev => ({
      ...prev,
      date_range: range,
      date_from: dateFrom,
      date_to: dateTo,
      page: 1 // Reset to page 1 when date range changes
    }));
  };

  const hasFilters = filters.status || filters.priority || filters.department_id || filters.issue_type_id ||
                      (filters.date_range !== 'all');
  const totalCreated = meta?.total || 0;
  const totalClosed = allIssues.filter(i => i.status === 'closed').length;
  const openIssues = allIssues.filter(i => i.status === 'open').length;
  const urgentIssues = allIssues.filter(i => i.priority === 'urgent').length;

  // Calculate chart data from ALL filtered issues (not just current page)
  const chartData = useMemo(() => {
    if (!allIssues.length) return null;

    // Issues by type
    const issuesByType = {};
    allIssues.forEach(issue => {
      if (issue.issueTypes && issue.issueTypes.length > 0) {
        issue.issueTypes.forEach(type => {
          issuesByType[type.name] = (issuesByType[type.name] || 0) + 1;
        });
      } else {
        issuesByType['Uncategorized'] = (issuesByType['Uncategorized'] || 0) + 1;
      }
    });

    // Issues by department
    const issuesByDepartment = {};
    allIssues.forEach(issue => {
      if (issue.departments && issue.departments.length > 0) {
        issue.departments.forEach(dept => {
          issuesByDepartment[dept.name] = (issuesByDepartment[dept.name] || 0) + 1;
        });
      } else {
        issuesByDepartment['Unassigned'] = (issuesByDepartment['Unassigned'] || 0) + 1;
      }
    });

    // Issues by priority (as category)
    const issuesByPriority = {};
    allIssues.forEach(issue => {
      const priority = issue.priority || 'unknown';
      issuesByPriority[priority] = (issuesByPriority[priority] || 0) + 1;
    });

    // Convert to arrays and sort
    const typeData = Object.entries(issuesByType)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Add "Others" category if there are more than 10 types
    let displayTypeData = typeData.slice(0, 10);
    if (typeData.length > 10) {
      const othersCount = typeData.slice(10).reduce((sum, item) => sum + item.count, 0);
      displayTypeData.push({ name: 'Others', count: othersCount });
    }

    const departmentData = Object.entries(issuesByDepartment)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const priorityData = Object.entries(issuesByPriority)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { typeData: displayTypeData, departmentData, priorityData };
  }, [allIssues]);

  // Get date range display text
  const getDateRangeDisplay = () => {
    if (filters.date_range === 'all') return 'All time';
    if (filters.date_range === 'custom') {
      if (filters.date_from && filters.date_to) {
        return `${filters.date_from} → ${filters.date_to}`;
      }
      return 'Custom range (select dates)';
    }

    const rangeLabels = {
      today: 'Today',
      last_7_days: 'Last 7 days',
      this_week: 'This week',
      last_week: 'Last week',
      this_month: 'This month',
      last_month: 'Last month',
      this_quarter: 'This quarter',
      last_30_days: 'Last 30 days',
      last_90_days: 'Last 90 days',
      this_year: 'This year',
      year_to_date: 'Year to date'
    };
    return rangeLabels[filters.date_range] || 'All time';
  };

  return (
    <div>
      {/* Filters */}
      <CR style={{ marginBottom: 16 }}>
        <CHR title="Custom Filters" subtitle="Filter issues by multiple criteria"/>
        <div style={{ padding: "18px 22px 22px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {/* Date Range Dropdown */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: TR.mutedLight, marginBottom: 4, display: "block" }}>Date Range</label>
              <SeR
                value={filters.date_range}
                onChange={v => handleDateRangeChange(v)}
                options={[
                  { value: "all", label: "All time" },
                  { value: "today", label: "Today" },
                  { value: "last_7_days", label: "Last 7 days" },
                  { value: "this_week", label: "This week" },
                  { value: "last_week", label: "Last week" },
                  { value: "this_month", label: "This month" },
                  { value: "last_month", label: "Last month" },
                  { value: "this_quarter", label: "This quarter" },
                  { value: "last_30_days", label: "Last 30 days" },
                  { value: "last_90_days", label: "Last 90 days" },
                  { value: "this_year", label: "This year" },
                  { value: "year_to_date", label: "Year to date" },
                  { value: "custom", label: "Custom range..." },
                ]}
                style={{ width: "100%" }}
              />
            </div>

            {/* Status */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: TR.mutedLight, marginBottom: 4, display: "block" }}>Status</label>
              <SeR value={filters.status} onChange={v => updateFilter('status', v)} placeholder="All statuses" options={[
                { value: "", label: "All statuses" },
                { value: "open", label: "Open" },
                { value: "closed", label: "Closed" },
              ]}/>
            </div>

            {/* Priority */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: TR.mutedLight, marginBottom: 4, display: "block" }}>Priority</label>
              <SeR value={filters.priority} onChange={v => updateFilter('priority', v)} placeholder="All priorities" options={[
                { value: "", label: "All priorities" },
                { value: "urgent", label: "Urgent" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ]}/>
            </div>

            {/* Department */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: TR.mutedLight, marginBottom: 4, display: "block" }}>Department</label>
              <SeR value={filters.department_id} onChange={v => updateFilter('department_id', v)} placeholder="All departments" options={[
                { value: "", label: "All departments" },
                ...departments.filter(d => d.is_active).map(d => ({ value: d.id, label: d.name })),
              ]}/>
            </div>

            {/* Issue Type */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: TR.mutedLight, marginBottom: 4, display: "block" }}>Issue Type</label>
              <SeR value={filters.issue_type_id} onChange={v => updateFilter('issue_type_id', v)} placeholder="All types" options={[
                { value: "", label: "All types" },
                ...issueTypes.filter(t => t.is_active).map(t => ({ value: t.id, label: t.name })),
              ]}/>
            </div>

            {/* Export buttons placeholder */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <BR variant="outline" icon="download" size="sm" onClick={exportToPDF} disabled={!hasFilters || loading}>Export PDF</BR>
              <BR variant="outline" icon="file" size="sm" onClick={exportToExcel} disabled={!hasFilters || loading}>Export Excel</BR>
            </div>
          </div>

          {/* Custom Date Fields - Only show when "Custom range" is selected */}
          {filters.date_range === 'custom' && (
            <div style={{
              marginTop: 16,
              padding: "14px 16px",
              background: "rgba(0,122,255,0.04)",
              borderRadius: 10,
              border: "1px solid rgba(0,122,255,0.15)"
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TR.accent, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <IR name="calendar" size={14} color={TR.accent}/>
                Custom Date Range
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: TR.mutedLight, marginBottom: 4, display: "block" }}>Date From</label>
                  <InR value={filters.date_from} onChange={v => updateFilter('date_from', v)} type="date" placeholder="" style={{ width: "100%" }}/>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: TR.mutedLight, marginBottom: 4, display: "block" }}>Date To</label>
                  <InR value={filters.date_to} onChange={v => updateFilter('date_to', v)} type="date" placeholder="" style={{ width: "100%" }}/>
                </div>
              </div>
              <div style={{ fontSize: 12, color: TR.muted, marginTop: 8 }}>
                {filters.date_from && filters.date_to ? (
                  <span style={{ color: TR.accent, fontWeight: 500 }}>📅 {filters.date_from} → {filters.date_to}</span>
                ) : (
                  <span>Select both dates to generate report</span>
                )}
              </div>
            </div>
          )}

          {/* Show current filter summary */}
          {hasFilters && (
            <div style={{
              marginTop: 16,
              padding: "12px 14px",
              background: "rgba(0,0,0,0.03)",
              borderRadius: 8,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <span style={{ color: TR.muted }}>
                <span style={{ fontWeight: 600, color: TR.text }}>Active filters:</span>{' '}
                {filters.date_range !== 'all' && (
                  <span style={{ marginLeft: 8 }}>📅 {getDateRangeDisplay()}</span>
                )}
                {filters.status && (
                  <span style={{ marginLeft: 8 }}>· Status: {filters.status}</span>
                )}
                {filters.priority && (
                  <span style={{ marginLeft: 8 }}>· Priority: {filters.priority}</span>
                )}
                {filters.department_id && (
                  <span style={{ marginLeft: 8 }}>· Department: {departments.find(d => d.id === Number(filters.department_id))?.name || ''}</span>
                )}
                {filters.issue_type_id && (
                  <span style={{ marginLeft: 8 }}>· Type: {issueTypes.find(t => t.id === Number(filters.issue_type_id))?.name || ''}</span>
                )}
              </span>
              <BR variant="ghost" size="sm" icon="x" onClick={clearFilters}>Clear all</BR>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {!hasFilters && (
              <span style={{ fontSize: 13, color: TR.muted, fontStyle: "italic" }}>Select filters to generate report</span>
            )}
            <div style={{ flex: 1 }}/>
          </div>
        </div>
      </CR>

      {/* Results */}
      {!hasFilters ? (
        <ER icon="filter" title="Set filters to generate report" description="Use the filters above to create a custom report based on your criteria."/>
      ) : loading ? (
        <div style={{ padding: 22, textAlign: "center", color: TR.muted }}>Loading report data...</div>
      ) : (
        <>
          {/* Summary Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            <MiniStat label="Total Issues" value={totalCreated} icon="inbox" color={TR.text}/>
            <MiniStat label="Open" value={openIssues} icon="alert" color={TR.accent}/>
            <MiniStat label="Closed" value={totalClosed} icon="check-circle" color={TR.success}/>
            <MiniStat label="Urgent" value={urgentIssues} icon="alert" color={TR.danger}/>
          </div>

          {/* Interactive Charts */}
          {chartData && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 16 }}>
              {/* Issues by Type */}
              <CR>
                <CHR title="Issues by Type" subtitle="Distribution across issue types"/>
                <div style={{ padding: "16px 22px 22px" }}>
                  {chartData.typeData.length > 0 ? (
                    <InteractiveDonutChart
                      data={chartData.typeData}
                      colors={['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444', '#14B8A6']}
                      size="medium"
                    />
                  ) : (
                    <div style={{ textAlign: "center", color: TR.muted, fontSize: 13 }}>No data available</div>
                  )}
                </div>
              </CR>

              {/* Issues by Department */}
              <CR>
                <CHR title="Issues by Department" subtitle="Distribution across departments"/>
                <div style={{ padding: "16px 22px 22px" }}>
                  {chartData.departmentData.length > 0 ? (
                    <InteractiveBarChart
                      data={chartData.departmentData}
                      color="#3B82F6"
                      size="medium"
                    />
                  ) : (
                    <div style={{ textAlign: "center", color: TR.muted, fontSize: 13 }}>No data available</div>
                  )}
                </div>
              </CR>

              {/* Issues by Priority */}
              <CR style={{ gridColumn: "1 / -1" }}>
                <CHR title="Issues by Priority" subtitle="Priority distribution overview"/>
                <div style={{ padding: "16px 22px 22px" }}>
                  {chartData.priorityData.length > 0 ? (
                    <PriorityDistributionChart data={chartData.priorityData} />
                  ) : (
                    <div style={{ textAlign: "center", color: TR.muted, fontSize: 13 }}>No data available</div>
                  )}
                </div>
              </CR>
            </div>
          )}

          {/* Results Table */}
          <CR>
            <CHR title={`Results: ${totalCreated} issues found`} subtitle="Filtered based on your custom criteria"/>
            <div style={{ padding: "18px 22px 22px" }}>
              {issues.length === 0 ? (
                <ER icon="search" title="No issues found" description="Try adjusting your filter criteria."/>
              ) : (
                <>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                        <th style={thR}>ID</th>
                        <th style={thR}>Title</th>
                        <th style={thR}>Guest · Room</th>
                        <th style={thR}>Department</th>
                        <th style={thR}>Priority</th>
                        <th style={thR}>Status</th>
                        <th style={thR}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map(issue => (
                        <tr key={issue.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                          <td style={tdR}>#{issue.id}</td>
                          <td style={tdR}>
                            <div style={{ fontWeight: 500 }}>{issue.title}</div>
                            {issue.issueTypes && issue.issueTypes.length > 0 && (
                              <div style={{ fontSize: 12, color: TR.mutedLight, marginTop: 2 }}>
                                {issue.issueTypes.slice(0, 2).map((t, i) => (
                                  <span key={t.id}>{i > 0 && ", "}{t.name}</span>
                                ))}
                                {issue.issueTypes.length > 2 && <span> +{issue.issueTypes.length - 2} more</span>}
                              </div>
                            )}
                          </td>
                          <td style={tdR}>
                            <div>{issue.name || "—"}</div>
                            <div style={{ fontSize: 12, color: TR.mutedLight }}>{issue.room_number || issue.location}</div>
                          </td>
                          <td style={tdR}>
                            {issue.departments?.map(d => <PR key={d.id} color={TR.muted}>{d.name}</PR>)}
                          </td>
                          <td style={tdR}><span style={{
                            fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                            background: issue.priority === 'urgent' ? TR.urgent + '20' : issue.priority === 'high' ? TR.high + '20' : issue.priority === 'medium' ? TR.medium + '20' : TR.low + '20',
                            color: issue.priority === 'urgent' ? TR.urgent : issue.priority === 'high' ? TR.high : issue.priority === 'medium' ? TR.medium : TR.low,
                            textTransform: "capitalize"
                          }}>{issue.priority}</span></td>
                          <td style={tdR}><span style={{
                            fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                            background: issue.status === 'open' ? TR.accent + '15' : TR.success + '15',
                            color: issue.status === 'open' ? TR.accent : TR.success,
                            textTransform: "capitalize"
                          }}>{issue.status}</span></td>
                          <td style={tdR}>{new Date(issue.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {meta && meta.last_page > 1 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                      <div style={{ fontSize: 12.5, color: TR.muted }}>
                        Showing {((filters.page - 1) * filters.per_page + 1)}–{Math.min(filters.page * filters.per_page, meta.total)} of {meta.total} issues
                      </div>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <BR
                          size="sm"
                          variant="ghost"
                          icon="chevron-left"
                          disabled={filters.page === 1}
                          onClick={() => goToPage(filters.page - 1)}
                        >
                          Prev
                        </BR>
                        <span style={{ fontSize: 12.5, color: TR.muted, padding: "0 8px", fontVariantNumeric: "tabular-nums" }}>
                          Page {filters.page} of {meta.last_page}
                        </span>
                        <BR
                          size="sm"
                          variant="ghost"
                          iconRight="chevron-right"
                          disabled={filters.page === meta.last_page}
                          onClick={() => goToPage(filters.page + 1)}
                        >
                          Next
                        </BR>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CR>
        </>
      )}
    </div>
  );
}

function ReportsLogbook() {
  const [date, setDate] = useState("2026-05-20");
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        const response = await window.PulseAPI.Issues.list({
          per_page: 6
        });
        setIssues(response.data || []);
      } catch (error) {
        console.error('Failed to fetch logbook issues:', error);
        setIssues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [date]);

  if (loading) return <div style={{ padding: 22, textAlign: "center", color: TR.muted }}>Loading logbook...</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <InR value={date} onChange={setDate} type="date" style={{ width: 170 }}/>
        <SgR value="day" onChange={() => {}} options={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }]}/>
        <div style={{ flex: 1 }}/>
        <BR variant="outline" icon="download" size="sm">Export PDF</BR>
      </div>
      <CR>
        <div style={{ padding: 22 }}>
          <div style={{ borderBottom: "2px solid rgba(0,0,0,0.1)", paddingBottom: 12, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <div style={{ fontSize: 11.5, color: TR.mutedLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Duty Manager Logbook</div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", marginTop: 4 }}>Wednesday, 20 May 2026</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: TR.muted }}>
              <div>Anvaya Beach Resort &amp; Spa Bali</div>
              <div style={{ marginTop: 2 }}>Shift: Sofia Reyes · 14:00 – 22:00</div>
            </div>
          </div>

          {issues.slice(0, 6).map((i, idx) => (
            <div key={i.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: idx < 5 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>#{i.id} — {i.title}</div>
                <div style={{ fontSize: 11.5, color: TR.muted, fontVariantNumeric: "tabular-nums" }}>{new Date(i.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              <div style={{ fontSize: 12.5, color: TR.muted, marginBottom: 4 }}>{i.location} · {i.name || "—"} · Priority: {i.priority}</div>
              <div style={{ fontSize: 13, color: TR.text, lineHeight: 1.5 }}>{i.description}</div>
              {i.recovery && <div style={{ marginTop: 6, fontSize: 12.5, color: TR.success, fontStyle: "italic" }}>Recovery: {i.recovery}</div>}
            </div>
          ))}
        </div>
      </CR>
    </div>
  );
}

// =====================================================================
// STATISTICS PAGE
// =====================================================================
function StatisticsPage() {
  const [data, setData] = useState(null);
  const [byDept, setByDept] = useState(null);
  const [byUser, setByUser] = useState(null);
  useEffect(() => {
    Promise.all([
      window.PulseAPI.Stats.dashboard(),
      window.PulseAPI.Stats.byDepartment(),
      window.PulseAPI.Stats.byUser({ limit: 8 }),
    ]).then(([d, dept, usr]) => { setData(d); setByDept(dept); setByUser(usr); });
  }, []);
  return (
    <div>
      <PHR title="Statistics" subtitle="Aggregated metrics across departments, users, and priorities"
        actions={<><BR variant="outline" icon="refresh" size="md">Refresh</BR><BR variant="outline" icon="download" size="md">Export</BR></>}/>
      <div style={{ padding: "20px 28px 60px", maxWidth: 1400 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 14 }}>
          <MiniStat label="Total" value={data?.summary.total_issues ?? "—"} icon="inbox" color={TR.text}/>
          <MiniStat label="Open" value={data?.summary.open_issues ?? "—"} icon="alert" color={TR.accent}/>
          <MiniStat label="Closed" value={data?.summary.closed_issues ?? "—"} icon="check-circle" color={TR.success}/>
          <MiniStat label="Urgent" value={data?.summary.urgent_issues ?? "—"} icon="alert" color={TR.danger}/>
          <MiniStat label="Avg. resolution" value={data ? (data.summary.avg_resolution_hours < 1 ? `${Math.round(data.summary.avg_resolution_hours * 60)}m` : `${data.summary.avg_resolution_hours.toFixed(1)}h`) : "—"} icon="clock" color={TR.purple}/>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <CR>
            <CHR title="By priority" subtitle="Open issues only"/>
            <div style={{ padding: "16px 22px 18px" }}>
              <PriorityDonut data={data?.by_priority || {}}/>
            </div>
          </CR>
          <CR>
            <CHR title="By status"/>
            <div style={{ padding: "16px 22px 18px" }}>
              <StatusSplit data={data?.by_status || {}}/>
            </div>
          </CR>
        </div>

        <CR style={{ marginBottom: 14 }}>
          <CHR title="By department" subtitle="Open / closed / closure rate"/>
          {!byDept ? <div style={{ padding: 20 }}><SR height={120}/></div> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <th style={thR}>Department</th>
                  <th style={{ ...thR, textAlign: "right" }}>Open</th>
                  <th style={{ ...thR, textAlign: "right" }}>Closed</th>
                  <th style={{ ...thR, textAlign: "right" }}>Total</th>
                  <th style={{ ...thR, textAlign: "right", paddingRight: 22 }}>Closure rate</th>
                </tr>
              </thead>
              <tbody>
                {byDept.departments.map(d => (
                  <tr key={d.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <td style={{ ...tdR, paddingLeft: 22, fontWeight: 500 }}>{d.name}</td>
                    <td style={{ ...tdR, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.open_issues}</td>
                    <td style={{ ...tdR, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.closed_issues}</td>
                    <td style={{ ...tdR, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{d.total_issues}</td>
                    <td style={{ ...tdR, textAlign: "right", paddingRight: 22 }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: "rgba(0,0,0,0.06)", borderRadius: 6, overflow: "hidden" }}>
                          <div style={{ width: `${d.closure_rate}%`, height: "100%", background: TR.success, borderRadius: 6 }}/>
                        </div>
                        <span style={{ fontSize: 12.5, color: TR.text, fontVariantNumeric: "tabular-nums", minWidth: 40, textAlign: "right", fontWeight: 500 }}>{d.closure_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CR>

        <CR>
          <CHR title="Top staff by completion" subtitle="Active users with assigned issues"/>
          {!byUser ? <div style={{ padding: 20 }}><SR height={120}/></div> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <th style={thR}>Staff member</th>
                  <th style={{ ...thR, textAlign: "right" }}>Open</th>
                  <th style={{ ...thR, textAlign: "right" }}>Closed</th>
                  <th style={{ ...thR, textAlign: "right" }}>Created</th>
                  <th style={{ ...thR, textAlign: "right", paddingRight: 22 }}>Completion</th>
                </tr>
              </thead>
              <tbody>
                {byUser.users.filter(u => u.total_assigned > 0).map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <td style={{ ...tdR, paddingLeft: 22 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <AvR name={u.name} size={26}/>
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.name}</div>
                          <div style={{ fontSize: 11.5, color: TR.mutedLight }}>{u.roles.join(", ")}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdR, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{u.assigned_open}</td>
                    <td style={{ ...tdR, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{u.assigned_closed}</td>
                    <td style={{ ...tdR, textAlign: "right", fontVariantNumeric: "tabular-nums", color: TR.muted }}>{u.created_count}</td>
                    <td style={{ ...tdR, textAlign: "right", paddingRight: 22 }}>
                      <span style={{ fontVariantNumeric: "tabular-nums", color: u.completion_rate > 80 ? TR.success : u.completion_rate > 50 ? TR.warning : TR.muted, fontWeight: 600 }}>{u.completion_rate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CR>
      </div>
    </div>
  );
}

// =====================================================================
// GRAPHS PAGE
// =====================================================================
function GraphsPage() {
  const [period, setPeriod] = useState("daily");
  const [data, setData] = useState(null);
  useEffect(() => { window.PulseAPI.Stats.trends({ period, limit: period === "monthly" ? 12 : period === "weekly" ? 12 : 30 }).then(setData); }, [period]);

  return (
    <div>
      <PHR title="Graphs" subtitle="Visual trends across time and categories"
        actions={<SgR value={period} onChange={setPeriod} options={[{ value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }]}/>}/>
      <div style={{ padding: "20px 28px 60px", maxWidth: 1400 }}>
        <CR style={{ marginBottom: 14 }}>
          <CHR title="Issues created vs closed" subtitle={data ? `${data.summary.total_created} created, ${data.summary.total_closed} closed in last ${data.summary.days_analyzed} days` : "—"}/>
          <div style={{ padding: "18px 22px 22px" }}>
            {data ? <BigTrendChart created={data.created_trend} closed={data.closed_trend}/> : <SR height={260}/>}
          </div>
        </CR>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <CR>
            <CHR title="Priority distribution" subtitle="All issues"/>
            <div style={{ padding: "16px 22px 22px" }}>
              {data ? <PriorityBars data={data.priority_distribution}/> : <SR height={180}/>}
            </div>
          </CR>
          <CR>
            <CHR title="Department ranking" subtitle="Issues per department"/>
            <div style={{ padding: "16px 22px 22px" }}>
              {data ? <DepartmentBars data={data.department_ranking}/> : <SR height={180}/>}
            </div>
          </CR>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Chart components
// =====================================================================
function MiniStat({ label, value, icon, color = TR.text }) {
  return (
    <CR>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: TR.muted, fontSize: 12, fontWeight: 500 }}>
          <IR name={icon} size={13} color={color}/>
          {label}
        </div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.025em", marginTop: 4, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      </div>
    </CR>
  );
}

function DailyBarChart({ data }) {
  const w = 880, h = 240, padL = 30, padR = 14, padT = 14, padB = 30;
  const maxV = Math.max(1, ...data.map(d => Math.max(d.created, d.closed)));
  const barGroupWidth = (w - padL - padR) / data.length;
  const barW = Math.max(2, barGroupWidth * 0.36);
  const toY = (v) => padT + (1 - v / maxV) * (h - padT - padB);
  return (
    <div>
      <div style={{ display: "flex", gap: 14, fontSize: 12, color: TR.muted, marginBottom: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, background: TR.accent, borderRadius: 2 }}/>Created</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, background: TR.success, borderRadius: 2 }}/>Closed</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", display: "block" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = padT + p * (h - padT - padB);
          return (<g key={i}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="rgba(0,0,0,0.05)"/>
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10.5" fill={TR.mutedLight}>{Math.round(maxV * (1 - p))}</text>
          </g>);
        })}
        {data.map((d, i) => {
          const xc = padL + i * barGroupWidth + barGroupWidth / 2;
          return (
            <g key={i}>
              <rect x={xc - barW - 1} y={toY(d.created)} width={barW} height={h - padB - toY(d.created)} fill={TR.accent} rx="2"/>
              <rect x={xc + 1} y={toY(d.closed)} width={barW} height={h - padB - toY(d.closed)} fill={TR.success} rx="2" opacity="0.85"/>
              {(i % Math.max(1, Math.floor(data.length / 12)) === 0) && (
                <text x={xc} y={h - 10} textAnchor="middle" fontSize="10.5" fill={TR.mutedLight}>{d.day}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function BigTrendChart({ created, closed }) {
  const w = 1000, h = 260, padL = 36, padR = 14, padT = 14, padB = 30;
  const days = created.map(d => d.period);
  const maxV = Math.max(1, ...created.map(d => d.count), ...closed.map(d => d.count));
  const stepX = (w - padL - padR) / Math.max(1, days.length - 1);
  const toY = (v) => padT + (1 - v / maxV) * (h - padT - padB);
  const path = (arr) => arr.reduce((acc, d, i) => acc + (i === 0 ? `M${padL + i*stepX},${toY(d.count)}` : ` L${padL + i*stepX},${toY(d.count)}`), "");
  const area = (arr) => `${path(arr)} L${padL + (arr.length-1)*stepX},${h - padB} L${padL},${h - padB} Z`;
  return (
    <div>
      <div style={{ display: "flex", gap: 14, fontSize: 12, color: TR.muted, marginBottom: 6 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, background: TR.accent, borderRadius: 2 }}/>Created</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, background: TR.success, borderRadius: 2 }}/>Closed</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", display: "block" }}>
        <defs>
          <linearGradient id="gp-bg-c" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={TR.accent} stopOpacity="0.18"/><stop offset="100%" stopColor={TR.accent} stopOpacity="0"/></linearGradient>
          <linearGradient id="gp-bg-x" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={TR.success} stopOpacity="0.14"/><stop offset="100%" stopColor={TR.success} stopOpacity="0"/></linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = padT + p * (h - padT - padB);
          return (<g key={i}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="rgba(0,0,0,0.05)"/>
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10.5" fill={TR.mutedLight}>{Math.round(maxV * (1 - p))}</text>
          </g>);
        })}
        <path d={area(created)} fill="url(#gp-bg-c)"/>
        <path d={path(created)} fill="none" stroke={TR.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d={area(closed)} fill="url(#gp-bg-x)"/>
        <path d={path(closed)} fill="none" stroke={TR.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {days.map((d, i) => i % Math.max(1, Math.floor(days.length / 10)) === 0 && (
          <text key={i} x={padL + i * stepX} y={h - 10} textAnchor="middle" fontSize="10.5" fill={TR.mutedLight}>{d.length > 7 ? new Date(d).getDate() : d}</text>
        ))}
      </svg>
    </div>
  );
}

function PriorityDonut({ data }) {
  const order = [
    { key: "urgent", label: "Urgent", color: TR.urgent },
    { key: "high", label: "High", color: TR.high },
    { key: "medium", label: "Medium", color: TR.medium },
    { key: "low", label: "Low", color: TR.low },
  ];
  const total = Math.max(1, order.reduce((s, o) => s + (data[o.key] || 0), 0));
  let acc = 0;
  const segs = order.map(o => {
    const val = data[o.key] || 0;
    const start = acc / total;
    acc += val;
    return { ...o, val, start, end: acc / total };
  });
  const r = 70, sw = 24, cx = 100, cy = 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg viewBox="0 0 200 200" style={{ width: 180, height: 180 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={sw}/>
        {segs.map((s, i) => {
          if (s.val === 0) return null;
          const a1 = s.start * 2 * Math.PI - Math.PI / 2;
          const a2 = s.end * 2 * Math.PI - Math.PI / 2;
          const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
          const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
          const large = (s.end - s.start) > 0.5 ? 1 : 0;
          return <path key={i} d={`M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}`} stroke={s.color} strokeWidth={sw} fill="none" strokeLinecap="butt"/>;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fill={TR.mutedLight} fontWeight="500">Open</text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="28" fill={TR.text} fontWeight="600" style={{ fontVariantNumeric: "tabular-nums" }}>{total === 1 && segs.every(s => s.val === 0) ? 0 : total}</text>
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {segs.map(s => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }}/>
            <span style={{ color: TR.text, flex: 1 }}>{s.label}</span>
            <span style={{ color: TR.text, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{s.val}</span>
            <span style={{ color: TR.mutedLight, fontSize: 11.5, fontVariantNumeric: "tabular-nums", width: 38, textAlign: "right" }}>{Math.round((s.val / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusSplit({ data }) {
  const total = (data.open || 0) + (data.closed || 0);
  const openPct = total ? (data.open / total) * 100 : 0;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 16 }}>
        <span style={{ fontSize: 28, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.025em" }}>{total}</span>
        <span style={{ fontSize: 13, color: TR.muted }}>total issues all-time</span>
      </div>
      <div style={{ height: 12, borderRadius: 12, background: "rgba(0,0,0,0.06)", overflow: "hidden", display: "flex" }}>
        <div style={{ width: `${openPct}%`, background: TR.accent, transition: "width 400ms ease" }}/>
        <div style={{ flex: 1, background: TR.success, opacity: 0.85 }}/>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 13 }}>
        <div>
          <div style={{ color: TR.muted, fontSize: 12 }}><span style={{ width: 8, height: 8, background: TR.accent, borderRadius: 2, display: "inline-block", marginRight: 5 }}/>Open</div>
          <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: TR.accent }}>{data.open || 0}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: TR.muted, fontSize: 12 }}>Closed<span style={{ width: 8, height: 8, background: TR.success, borderRadius: 2, display: "inline-block", marginLeft: 5 }}/></div>
          <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: TR.success }}>{data.closed || 0}</div>
        </div>
      </div>
    </div>
  );
}

function PriorityBars({ data }) {
  const max = Math.max(1, ...data.map(d => d.count));
  const colors = { urgent: TR.urgent, high: TR.high, medium: TR.medium, low: TR.low };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map(d => (
        <div key={d.priority}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
            <span style={{ textTransform: "capitalize", color: TR.text, fontWeight: 500 }}>{d.priority}</span>
            <span style={{ fontVariantNumeric: "tabular-nums", color: TR.muted }}>{d.count}</span>
          </div>
          <div style={{ height: 8, background: "rgba(0,0,0,0.05)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ width: `${(d.count / max) * 100}%`, height: "100%", background: colors[d.priority], borderRadius: 8 }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function DepartmentBars({ data }) {
  const max = Math.max(1, ...data.map(d => d.issue_count));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.slice(0, 7).map((d, i) => (
        <div key={d.department}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: TR.text, fontWeight: 500 }}>{d.department}</span>
            <span style={{ fontVariantNumeric: "tabular-nums", color: TR.muted }}>{d.issue_count}</span>
          </div>
          <div style={{ height: 8, background: "rgba(0,0,0,0.05)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ width: `${(d.issue_count / max) * 100}%`, height: "100%", background: TR.text, borderRadius: 8 }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

const thR = { padding: "10px 8px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: TR.mutedLight, textTransform: "uppercase", letterSpacing: "0.04em", paddingLeft: 22 };
const tdR = { padding: "12px 8px", color: TR.text };

// =====================================================================
// Interactive Chart Components for Custom Reports
// =====================================================================

function InteractiveDonutChart({ data, colors, size = "medium" }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const dimensions = size === "large" ? { cx: 120, cy: 120, r: 80, sw: 28 } :
                      size === "medium" ? { cx: 100, cy: 100, r: 65, sw: 22 } :
                      { cx: 80, cy: 80, r: 50, sw: 18 };

  let acc = 0;
  const segments = data.map((item, index) => {
    const start = acc / total;
    acc += item.count;
    return {
      ...item,
      color: colors[index % colors.length],
      start,
      end: acc / total
    };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg viewBox={`0 0 ${dimensions.cx * 2} ${dimensions.cy * 2}`}
           style={{ width: size === "large" ? 220 : size === "medium" ? 180 : 140, height: size === "large" ? 220 : size === "medium" ? 180 : 140 }}>
        <circle cx={dimensions.cx} cy={dimensions.cy} r={dimensions.r}
                fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={dimensions.sw}/>
        {segments.map((segment, i) => {
          if (segment.count === 0) return null;
          const a1 = segment.start * 2 * Math.PI - Math.PI / 2;
          const a2 = segment.end * 2 * Math.PI - Math.PI / 2;
          const x1 = dimensions.cx + dimensions.r * Math.cos(a1);
          const y1 = dimensions.cy + dimensions.r * Math.sin(a1);
          const x2 = dimensions.cx + dimensions.r * Math.cos(a2);
          const y2 = dimensions.cy + dimensions.r * Math.sin(a2);
          const large = (segment.end - segment.start) > 0.5 ? 1 : 0;

          return (
            <path key={i}
                  d={`M${x1},${y1} A${dimensions.r},${dimensions.r} 0 ${large},1 ${x2},${y2}`}
                  stroke={segment.color} strokeWidth={dimensions.sw} fill="none"
                  strokeLinecap="butt"
                  style={{ transition: "all 0.3s ease", cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.8";
                    e.currentTarget.style.strokeWidth = `${dimensions.sw + 4}px`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.strokeWidth = `${dimensions.sw}px`;
                  }}
            />
          );
        })}
        <text x={dimensions.cx} y={dimensions.cy - 4}
              textAnchor="middle" fontSize="12" fill={TR.mutedLight} fontWeight="500">Total</text>
        <text x={dimensions.cx} y={dimensions.cy + 16}
              textAnchor="middle" fontSize="24" fill={TR.text} fontWeight="600"
              style={{ fontVariantNumeric: "tabular-nums" }}>{total}</text>
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {segments.map((segment, i) => (
          <div key={i}
               style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "4px 6px", borderRadius: 6, transition: "background 0.2s" }}
               onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
               onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <span style={{
              width: 10, height: 10, borderRadius: 3, background: segment.color,
              flexShrink: 0
            }}/>
            <span style={{ color: TR.text, flex: 1, fontWeight: 500 }}>{segment.name}</span>
            <span style={{ color: TR.text, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{segment.count}</span>
            <span style={{ color: TR.mutedLight, fontSize: 11.5, fontVariantNumeric: "tabular-nums", width: 38, textAlign: "right" }}>
              {Math.round((segment.count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InteractiveBarChart({ data, color, size = "medium" }) {
  const max = Math.max(1, ...data.map(d => d.count));
  const height = size === "large" ? 200 : size === "medium" ? 160 : 120;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((item, index) => (
        <div key={index}
             style={{ cursor: "pointer", padding: "6px 8px", borderRadius: 6, transition: "background 0.2s" }}
             onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
             onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: TR.text, fontWeight: 500, flex: 1 }}>{item.name}</span>
            <span style={{ fontVariantNumeric: "tabular-nums", color: TR.text, fontWeight: 600, marginLeft: 12 }}>{item.count}</span>
          </div>
          <div style={{ height: 8, background: "rgba(0,0,0,0.05)", borderRadius: 8, overflow: "hidden" }}>
            <div
              style={{
                width: `${(item.count / max) * 100}%`,
                height: "100%",
                background: color,
                borderRadius: 8,
                transition: "width 0.6s ease"
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PriorityDistributionChart({ data }) {
  const max = Math.max(1, ...data.map(d => d.count));
  const colors = {
    urgent: "#DC2626",
    high: "#F59E0B",
    medium: "#3B82F6",
    low: "#6B7280",
    unknown: "#9CA3AF"
  };
  const labels = {
    urgent: "Urgent",
    high: "High",
    medium: "Medium",
    low: "Low",
    unknown: "Unknown"
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
      {data.map((item, index) => (
        <div key={index}
             style={{
               textAlign: "center",
               padding: "16px",
               background: "rgba(0,0,0,0.02)",
               borderRadius: 12,
               cursor: "pointer",
               transition: "all 0.2s",
               border: "2px solid transparent"
             }}
             onMouseEnter={(e) => {
               e.currentTarget.style.background = "rgba(0,0,0,0.04)";
               e.currentTarget.style.borderColor = colors[item.name] || colors.unknown;
               e.currentTarget.style.transform = "translateY(-2px)";
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.background = "rgba(0,0,0,0.02)";
               e.currentTarget.style.borderColor = "transparent";
               e.currentTarget.style.transform = "translateY(0)";
             }}>
          <div style={{
            fontSize: 32,
            fontWeight: 700,
            color: colors[item.name] || colors.unknown,
            fontVariantNumeric: "tabular-nums",
            marginBottom: 4
          }}>
            {item.count}
          </div>
          <div style={{
            fontSize: 13,
            color: TR.muted,
            fontWeight: 500,
            textTransform: "capitalize"
          }}>
            {labels[item.name] || item.name}
          </div>
          <div style={{
            marginTop: 8,
            height: 4,
            background: "rgba(0,0,0,0.08)",
            borderRadius: 4,
            overflow: "hidden"
          }}>
            <div
              style={{
                width: `${(item.count / max) * 100}%`,
                height: "100%",
                background: colors[item.name] || colors.unknown,
                borderRadius: 4
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

window.PageReports = ReportsPage;
window.PageStatistics = StatisticsPage;
window.PageGraphs = GraphsPage;

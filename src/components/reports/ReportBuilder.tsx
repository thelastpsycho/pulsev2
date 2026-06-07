// ============================================================================
// Advanced Report Builder Component
// ============================================================================

import { useState } from 'react';
import type { ReportConfig, ReportField } from '@/types';

// Safe access to window components
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return {
    Icon: () => null,
    Button: () => null,
    Card: () => null,
    CardHeader: () => null,
    TOKENS: {
      accent: "#007aff",
      text: "#1d1d1f",
      textSecondary: "#3a3a3c",
      muted: "#6e6e73",
      mutedLight: "#86868b",
      border: "rgba(0,0,0,0.08)",
      borderStrong: "rgba(0,0,0,0.12)",
      surface: "#ffffff",
      bg: "#f5f5f7",
      bgSoft: "#fafafa",
      success: "#34c759",
      warning: "#ff9500",
      danger: "#ff3b30",
      urgent: "#ff3b30",
      high: "#ff9500",
      medium: "#ffb800",
      low: "#34c759",
      purple: "#8e5cf2",
      gold: "#b8860b",
    },
    cx: (...xs: any[]) => xs.filter(Boolean).join(' '),
  };
};

const Icon = getPulseUI().Icon;
const Button = getPulseUI().Button;
const Card = getPulseUI().Card;
const CardHeader = getPulseUI().CardHeader;
const TOKENS = getPulseUI().TOKENS;
const cx = getPulseUI().cx;

/**
 * Available report fields
 */
const AVAILABLE_FIELDS: ReportField[] = [
  { id: 'title', label: 'Issue Title', type: 'text' },
  { id: 'status', label: 'Status', type: 'select', options: [{ label: 'Open', value: 'open' }, { label: 'Closed', value: 'closed' }] },
  { id: 'priority', label: 'Priority', type: 'select', options: [{ label: 'Urgent', value: 'urgent' }, { label: 'High', value: 'high' }, { label: 'Medium', value: 'medium' }, { label: 'Low', value: 'low' }] },
  { id: 'created_at', label: 'Created Date', type: 'date' },
  { id: 'updated_at', label: 'Updated Date', type: 'date' },
  { id: 'closed_at', label: 'Closed Date', type: 'date' },
  { id: 'name', label: 'Guest Name', type: 'text' },
  { id: 'room_number', label: 'Room Number', type: 'text' },
  { id: 'departments', label: 'Department', type: 'select' },
  { id: 'issueTypes', label: 'Issue Type', type: 'select' },
  { id: 'assignedTo', label: 'Assigned To', type: 'select' },
  { id: 'recovery_cost', label: 'Recovery Cost', type: 'number' },
  { id: 'resolution_time', label: 'Resolution Time (hours)', type: 'number' },
];

/**
 * Report Builder Component
 */
export function ReportBuilder() {
  const [config, setConfig] = useState<ReportConfig>({
    name: '',
    fields: [],
    filters: {},
    group_by: 'department',
    sort_by: 'created_at',
    chart_type: 'table',
  });

  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Add field to report
   */
  const addField = (field: ReportField) => {
    setConfig(prev => ({
      ...prev,
      fields: [...prev.fields, field],
    }));
    setSelectedFields(prev => new Set(prev).add(field.id));
  };

  /**
   * Remove field from report
   */
  const removeField = (fieldId: string) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId),
    }));
    setSelectedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldId);
      return newSet;
    });
  };

  /**
   * Move field up/down
   */
  const moveField = (index: number, direction: 'up' | 'down') => {
    const fields = [...config.fields];
    if (direction === 'up' && index > 0) {
      [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
    } else if (direction === 'down' && index < fields.length - 1) {
      [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
    }
    setConfig(prev => ({ ...prev, fields }));
  };

  /**
   * Export report
   */
  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    setIsExporting(true);
    try {
      // Generate report data
      const response = await window.PulseAPI.Issues.list({
        ...config.filters,
        per_page: 1000,
      });

      const data = response.data;

      // Export based on format
      if (format === 'csv') {
        exportToCSV(data, config.fields);
      } else if (format === 'excel') {
        exportToExcel(data, config);
      } else if (format === 'pdf') {
        exportToPDF(data, config);
      }

      console.log(`[Reports] Exported as ${format}`);
    } catch (error) {
      console.error('[Reports] Export failed:', error);
      if (window.toast) {
        window.toast.error('Export failed. Please try again.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export to CSV
   */
  const exportToCSV = (data: any[], fields: ReportField[]) => {
    const headers = fields.map(f => f.label);
    const rows = data.map(item =>
      fields.map(field => {
        const value = getNestedValue(item, field.id);
        return value ?? '';
      })
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    downloadFile(csvContent, 'report.csv', 'text/csv');
  };

  /**
   * Export to Excel (simplified - just CSV with .xlsx extension)
   * In production, use a library like xlsx
   */
  const exportToExcel = (data: any[], config: ReportConfig) => {
    // This is a simplified version
    // In production, you'd use the xlsx library to create proper Excel files
    exportToCSV(data, config.fields);

    // Rename the downloaded file to .xlsx
    setTimeout(() => {
      const link = document.querySelector('a[download="report.csv"]') as HTMLAnchorElement;
      if (link) {
        link.setAttribute('download', 'report.xlsx');
        link.click();
      }
    }, 100);
  };

  /**
   * Export to PDF
   */
  const exportToPDF = async (data: any[], config: ReportConfig) => {
    // In production, use jspdf or similar library
    // For now, create a simple HTML-based PDF

    const hotelBranding = {
      logo: '',
      hotel_name: 'GuestPulse - Anvaya Bali',
      address: 'Jl. Pantai Mengening, Desa Adat Sading, Mengwi Badung, Bali',
      phone: '+62 361 202 2000',
    };

    const reportDate = new Date().toLocaleDateString();

    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1d1d1f; margin: 0;">${hotelBranding.hotel_name}</h1>
          <p style="color: #6e6e73; margin: 5px 0;">${hotelBranding.address}</p>
          <p style="color: #6e6e73; margin: 5px 0;">${hotelBranding.phone}</p>
        </div>

        <div style="border-bottom: 2px solid #007aff; padding-bottom: 10px; margin-bottom: 20px;">
          <h2 style="color: #1d1d1f; margin: 0;">${config.name || 'Custom Report'}</h2>
          <p style="color: #6e6e73; margin: 5px 0;">Generated: ${reportDate}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f5f5f7;">
              ${config.fields.map(field => `<th style="padding: 10px; text-align: left; border-bottom: 1px solid #d1d1d6;">${field.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                ${config.fields.map(field => `<td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">${getNestedValue(item, field.id) ?? '-'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="text-align: center; color: #6e6e73; font-size: 12px; margin-top: 40px;">
          <p>Generated by GuestPulse Hotel Operations System</p>
          <p>Page 1 of 1</p>
        </div>
      </div>
    `;

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${config.name || 'Custom Report'}</title>
          <style>
            body { margin: 0; padding: 20px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>${html}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  /**
   * Helper to get nested object values
   */
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  };

  /**
   * Helper to download file
   */
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Custom Report Builder</h1>
        <p className="text-muted-light text-sm">Create custom reports with drag-and-drop fields, filters, and export options.</p>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Main Builder Area */}
        <div className="space-y-4">
          {/* Report Name */}
          <Card>
            <div className="p-4">
              <label className="block text-xs font-semibold text-muted-light uppercase tracking-wider mb-2">
                Report Name
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter report name..."
                className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm"
              />
            </div>
          </Card>

          {/* Available Fields */}
          <Card>
            <CardHeader
              title="Available Fields"
              subtitle="Click to add fields to your report"
            />
            <div className="p-4 grid grid-cols-2 gap-2">
              {AVAILABLE_FIELDS.map(field => (
                <button
                  key={field.id}
                  onClick={() => addField(field)}
                  disabled={selectedFields.has(field.id)}
                  className={cx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all duration-100',
                    selectedFields.has(field.id)
                      ? 'bg-accent/10 text-accent cursor-not-allowed opacity-50'
                      : 'bg-black/[.04] hover:bg-black/[.08] text-text'
                  )}
                >
                  <Icon
                    name={field.type === 'date' ? 'calendar' : field.type === 'number' ? 'chart-bar' : 'tag'}
                    size={14}
                    color={selectedFields.has(field.id) ? TOKENS.accent : TOKENS.mutedLight}
                  />
                  <span>{field.label}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Selected Fields */}
          {config.fields.length > 0 && (
            <Card>
              <CardHeader
                title={`Selected Fields (${config.fields.length})`}
                subtitle="Drag to reorder, click X to remove"
              />
              <div className="p-4 space-y-2">
                {config.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-2 px-3 py-2 bg-black/[.04] rounded-lg group"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Icon name="list" size={14} color={TOKENS.mutedLight} />
                      <span className="text-sm font-medium">{field.label}</span>
                      <span className="text-xs text-muted-light">({field.type})</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-black/[.08] disabled:opacity-30"
                      >
                        <Icon name="chevron-up" size={14} />
                      </button>
                      <button
                        onClick={() => moveField(index, 'down')}
                        disabled={index === config.fields.length - 1}
                        className="p-1 rounded hover:bg-black/[.08] disabled:opacity-30"
                      >
                        <Icon name="chevron-down" size={14} />
                      </button>
                      <button
                        onClick={() => removeField(field.id)}
                        className="p-1 rounded hover:bg-black/[.08]"
                      >
                        <Icon name="x" size={14} color={TOKENS.danger} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Export Options */}
          <Card>
            <CardHeader title="Export Options" />
            <div className="p-4 space-y-3">
              <Button
                variant="outline"
                icon="download"
                onClick={() => exportReport('csv')}
                disabled={config.fields.length === 0 || isExporting}
                className="w-full justify-start"
              >
                Export as CSV
              </Button>
              <Button
                variant="outline"
                icon="download"
                onClick={() => exportReport('excel')}
                disabled={config.fields.length === 0 || isExporting}
                className="w-full justify-start"
              >
                Export as Excel
              </Button>
              <Button
                variant="outline"
                icon="download"
                onClick={() => exportReport('pdf')}
                disabled={config.fields.length === 0 || isExporting}
                className="w-full justify-start"
              >
                Export as PDF
              </Button>
            </div>
          </Card>

          {/* Chart Options */}
          <Card>
            <CardHeader title="Chart Type" />
            <div className="p-4 space-y-2">
              {[
                { value: 'table', label: 'Table View', icon: 'list' },
                { value: 'bar', label: 'Bar Chart', icon: 'chart-bar' },
                { value: 'line', label: 'Line Chart', icon: 'chart-line' },
                { value: 'pie', label: 'Pie Chart', icon: 'chart-pie' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setConfig(prev => ({ ...prev, chart_type: option.value as any }))}
                  className={cx(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all duration-100',
                    config.chart_type === option.value
                      ? 'bg-accent/10 text-accent'
                      : 'bg-black/[.04] hover:bg-black/[.08] text-text'
                  )}
                >
                  <Icon
                    name={option.icon as any}
                    size={14}
                    color={config.chart_type === option.value ? TOKENS.accent : TOKENS.mutedLight}
                  />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Group By */}
          <Card>
            <CardHeader title="Group By" />
            <div className="p-4">
              <select
                value={config.group_by}
                onChange={(e) => setConfig(prev => ({ ...prev, group_by: e.target.value }))}
                className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm"
              >
                <option value="department">Department</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="issue_type">Issue Type</option>
                <option value="assigned_to">Assigned To</option>
              </select>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Export for window global
if (typeof window !== 'undefined') {
  (window as any).ReportBuilder = ReportBuilder;
}
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

/**
 * Utility functions for exporting data to Excel (.xlsx), CSV, and PDF (Print & Direct PDF Download)
 */

export function exportToExcel(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const safeFilename = filename.replace(/\.csv$/i, '').replace(/\.xlsx$/i, '') + '.xlsx';
  const data = [headers, ...rows.map(row => row.map(cell => (cell === null || cell === undefined ? '' : cell)))];
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Enable Right-To-Left view for Arabic text in Excel
  worksheet['!views'] = [{ RTL: true }];

  // Auto-adjust column widths based on content
  const colWidths = headers.map((h, colIdx) => {
    let maxLen = String(h).length;
    rows.forEach(r => {
      const cellVal = String(r[colIdx] ?? '');
      if (cellVal.length > maxLen) maxLen = cellVal.length;
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'التقرير');
  XLSX.writeFile(workbook, safeFilename);
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  // Alias exportToCSV to exportToExcel so any Excel export action produces a genuine .xlsx file
  const excelFilename = filename.replace(/\.csv$/i, '.xlsx');
  exportToExcel(excelFilename, headers, rows);
}

export async function downloadElementAsPDF(paperElement: HTMLElement, filename: string) {
  try {
    const canvas = await html2canvas(paperElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Sanitize any oklch color functions in style tags to prevent html2canvas parsing errors
        const styles = clonedDoc.querySelectorAll('style');
        styles.forEach((style) => {
          if (style.textContent && style.textContent.includes('oklch')) {
            try {
              style.textContent = style.textContent.replace(/oklch\([^)]+\)/gi, '#1e293b');
            } catch {
              // Ignore if read-only
            }
          }
        });

        // Sanitize inline style attributes as well
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          const styleAttr = htmlEl.getAttribute('style');
          if (styleAttr && styleAttr.includes('oklch')) {
            htmlEl.setAttribute('style', styleAttr.replace(/oklch\([^)]+\)/gi, '#1e293b'));
          }
        });
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(safeName);
  } catch (err) {
    console.error('Failed to generate PDF via canvas:', err);
    window.print();
  }
}

export function exportToPDF(title: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const currentDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Remove any existing print modal
  const existingModal = document.getElementById('print-modal-overlay');
  if (existingModal) {
    existingModal.remove();
  }

  // Inject print styles if not present
  let printStyleEl = document.getElementById('print-custom-styles');
  if (!printStyleEl) {
    printStyleEl = document.createElement('style');
    printStyleEl.id = 'print-custom-styles';
    printStyleEl.innerHTML = `
      @media print {
        body > *:not(#print-modal-overlay) {
          display: none !important;
        }
        #print-modal-overlay {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          height: auto !important;
          background: white !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: visible !important;
          z-index: 999999 !important;
        }
        .print-modal-no-print {
          display: none !important;
        }
        .print-page-paper {
          box-shadow: none !important;
          border: none !important;
          padding: 10px !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
        }
      }
    `;
    document.head.appendChild(printStyleEl);
  }

  // Create overlay modal
  const modal = document.createElement('div');
  modal.id = 'print-modal-overlay';
  modal.className = 'fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex flex-col items-center justify-start p-4 md:p-8 overflow-y-auto font-sans dir-rtl';
  modal.setAttribute('dir', 'rtl');

  const rowsHtml = rows
    .map(
      (row, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
        ${row.map(cell => `<td style="padding: 10px; font-size: 12px; color: #1e293b; border: 1px solid #cbd5e1; text-align: right;">${cell !== null && cell !== undefined ? cell : ''}</td>`).join('')}
      </tr>
    `
    )
    .join('');

  const safeFilename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

  modal.innerHTML = `
    <div class="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200">
      <!-- Modal Header (Controls) -->
      <div class="print-modal-no-print bg-slate-900 text-white p-4 px-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-500 to-amber-400 text-white flex items-center justify-center font-bold text-lg shadow">
            📄
          </div>
          <div>
            <h3 class="font-bold text-base text-white">تصدير ومعاينة تقرير PDF</h3>
            <p class="text-xs text-slate-400">حمل ملف PDF أو اطبعه مباشرة</p>
          </div>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <button id="btn-do-pdf-download" class="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer">
            <i class="fas fa-file-pdf"></i>
            <span id="btn-pdf-text">📥 تحميل ملف PDF (Direct Download)</span>
          </button>
          <button id="btn-do-print" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer">
            <i class="fas fa-print"></i>
            <span>طباعة المتصفح</span>
          </button>
          <button id="btn-close-print-modal" class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer border border-slate-700">
            <span>✕ إغلاق</span>
          </button>
        </div>
      </div>

      <!-- Printable Document Paper -->
      <div id="pdf-paper-container" class="print-page-paper" style="padding: 32px; background-color: #ffffff; color: #0f172a; min-height: 500px; font-family: system-ui, -apple-system, sans-serif; direction: rtl;">
        <!-- Store Branding Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1a2a6c; padding-bottom: 16px; margin-bottom: 24px;">
          <div>
            <h1 style="font-size: 20px; font-weight: 900; color: #1a2a6c; margin: 0; line-height: 1.3;">محل الإسراء لأدوات السباكة</h1>
            <p style="font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 500; margin-bottom: 0;">منظومة إدارة المبيعات والمخزون وحسابات العملاء</p>
          </div>
          <div style="text-align: left; direction: ltr;">
            <span style="display: inline-block; background-color: #eff6ff; color: #1e3a8a; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; border: 1px solid #bfdbfe;">
              ${currentDate}
            </span>
          </div>
        </div>

        <!-- Report Title -->
        <div style="text-align: center; margin-top: 16px; margin-bottom: 20px;">
          <h2 style="font-size: 16px; font-weight: 700; color: #1e293b; background-color: #f1f5f9; display: inline-block; padding: 6px 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 0;">
            ${title}
          </h2>
        </div>

        <!-- Data Table -->
        <div style="margin-top: 20px; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 12px;">
            <thead>
              <tr style="background-color: #1a2a6c; color: #ffffff; font-weight: bold;">
                ${headers.map(h => `<th style="padding: 10px; border: 1px solid #1a2a6c; background-color: #1a2a6c; color: #ffffff; text-align: right;">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Document Footer -->
        <div style="margin-top: 40px; padding-top: 16px; border-top: 1px dashed #cbd5e1; text-align: center; font-size: 11px; color: #64748b;">
          تم استخراج هذا التقرير آلياً من نظام "محل الإسراء" — جميع الحقوق محفوظة © ${new Date().getFullYear()}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const paperContainer = document.getElementById('pdf-paper-container');
  const downloadPdfBtn = document.getElementById('btn-do-pdf-download');
  const pdfBtnText = document.getElementById('btn-pdf-text');

  const triggerPdfDownload = async () => {
    if (!paperContainer || !downloadPdfBtn || !pdfBtnText) return;
    try {
      pdfBtnText.innerText = '⏳ جاري إنشاء ملف PDF...';
      downloadPdfBtn.setAttribute('disabled', 'true');
      await downloadElementAsPDF(paperContainer, safeFilename);
      pdfBtnText.innerText = '✅ تم التنزيل بنجاح!';
      setTimeout(() => {
        if (pdfBtnText) pdfBtnText.innerText = '📥 تحميل ملف PDF (Direct Download)';
        if (downloadPdfBtn) downloadPdfBtn.removeAttribute('disabled');
      }, 2500);
    } catch (e) {
      console.error(e);
      if (pdfBtnText) pdfBtnText.innerText = '📥 تحميل ملف PDF (Direct Download)';
      if (downloadPdfBtn) downloadPdfBtn.removeAttribute('disabled');
    }
  };

  // Add event listeners
  document.getElementById('btn-close-print-modal')?.addEventListener('click', () => {
    modal.remove();
  });

  downloadPdfBtn?.addEventListener('click', triggerPdfDownload);

  document.getElementById('btn-do-print')?.addEventListener('click', () => {
    window.print();
  });

  // Automatically trigger PDF file generation & download right away!
  setTimeout(() => {
    triggerPdfDownload();
  }, 100);
}



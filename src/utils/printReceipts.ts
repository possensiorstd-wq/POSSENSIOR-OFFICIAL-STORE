/**
 * Dedicated POSSENSIOR receipt printing engine.
 * Ensures receipts print with 100% fidelity on A4 and thermal printers without blank pages,
 * isolating content from parent modal overflows and CSS backdrop filters.
 */

export function printReceiptElement(element: HTMLElement, documentTitle: string = 'Resi Pengiriman Possensior') {
  if (!element) {
    window.print();
    return;
  }

  // Create an invisible iframe for isolated printing
  const iframe = document.createElement('iframe');
  iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Clone all styles and link tags from main document for full Tailwind & font support
  let headHtml = `<meta charset="utf-8"/><title>${documentTitle}</title>`;
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((styleNode) => {
    headHtml += styleNode.outerHTML;
  });

  // Inject crisp print CSS rules specifically tuned for shipping labels & multi-page batches
  headHtml += `
    <style>
      @page {
        size: auto;
        margin: 8mm;
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
      }
      .printable-receipt-card {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        border: 2px solid #000000 !important;
        margin-bottom: 24px !important;
        background: #ffffff !important;
        color: #000000 !important;
        width: 100% !important;
        box-shadow: none !important;
      }
      .print-page-break {
        page-break-after: always !important;
        break-after: page !important;
      }
      .no-print, .print\\:hidden {
        display: none !important;
      }
    </style>
  `;

  doc.open();
  doc.write(`<!DOCTYPE html><html><head>${headHtml}</head><body><div style="padding: 10px; width: 100%; max-width: 820px; margin: 0 auto;">${element.innerHTML}</div></body></html>`);
  doc.close();

  // Execute print once DOM is prepared
  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Iframe print error, invoking window.print fallback', err);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  };

  // Safe timeout to ensure barcodes, SVG icons and fonts inside iframe are painted
  setTimeout(triggerPrint, 300);
}
